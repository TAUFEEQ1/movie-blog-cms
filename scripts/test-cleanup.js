#!/usr/bin/env node

/**
 * Test script for trending cleanup functionality
 * This script tests the cleanup system without actually deleting data
 */

'use strict';

const axios = require('axios');

async function testCleanup() {
  const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
  const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

  if (!STRAPI_API_TOKEN) {
    console.error('STRAPI_API_TOKEN environment variable is required');
    console.log('You can set it in your .env file or run: STRAPI_API_TOKEN=your_token npm run test:cleanup');
    process.exit(1);
  }

  console.log('🧪 Testing trending cleanup functionality...\n');
  
  try {
    const CLEANUP_OLDER_THAN_HOURS = 36;
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - CLEANUP_OLDER_THAN_HOURS);
    
    console.log(`📅 Cutoff date: ${cutoffDate.toISOString()}`);
    console.log(`🔍 Looking for entries older than ${CLEANUP_OLDER_THAN_HOURS} hours...\n`);

    // Test 1: Check for old entries based on createdAt (only criteria now)
    console.log('Test 1: Checking for time-based cleanup candidates (createdAt only)...');
    
    const oldEntriesResponse = await axios.get(`${STRAPI_URL}/api/trendings`, {
      headers: {
        'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      params: {
        'pagination[limit]': 1000,
        'filters[createdAt][$lt]': cutoffDate.toISOString()
      }
    });

    const oldEntries = oldEntriesResponse.data.data || [];
    console.log(`   Found ${oldEntries.length} entries older than ${CLEANUP_OLDER_THAN_HOURS} hours`);

    // Test 2: Check for expired entries (informational only - not used for cleanup)
    console.log('\nTest 2: Checking for expired entries (expires_at) - informational only...');
    
    const expiredEntriesResponse = await axios.get(`${STRAPI_URL}/api/trendings`, {
      headers: {
        'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      params: {
        'pagination[limit]': 1000,
        'filters[expires_at][$lt]': new Date().toISOString()
      }
    });

    const expiredEntries = expiredEntriesResponse.data.data || [];
    console.log(`   Found ${expiredEntries.length} entries with expired expires_at timestamps (not used for cleanup)`);

    // Test 3: Check for inactive entries
    console.log('\nTest 3: Checking for inactive entries...');
    
    const inactiveEntriesResponse = await axios.get(`${STRAPI_URL}/api/trendings`, {
      headers: {
        'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      params: {
        'pagination[limit]': 1000,
        'filters[is_active][$eq]': false
      }
    });

    const inactiveEntries = inactiveEntriesResponse.data.data || [];
    console.log(`   Found ${inactiveEntries.length} inactive entries`);

    // Test 4: Check total trending entries
    console.log('\nTest 4: Checking total trending entries...');
    
    const allEntriesResponse = await axios.get(`${STRAPI_URL}/api/trendings`, {
      headers: {
        'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      params: {
        'pagination[limit]': 1
      }
    });

    const totalEntries = allEntriesResponse.data.meta?.pagination?.total || 0;
    console.log(`   Total trending entries in database: ${totalEntries}`);

    // Summary
    console.log('\n📊 Cleanup Test Summary:');
    console.log('========================');
    console.log(`Total entries: ${totalEntries}`);
    console.log(`Old entries (>36h): ${oldEntries.length}`);
    console.log(`Expired entries (informational): ${expiredEntries.length}`);
    console.log(`Inactive entries: ${inactiveEntries.length}`);
    
    const totalToCleanup = oldEntries.length + inactiveEntries.length; // Only count actual cleanup criteria
    console.log(`Total cleanup candidates: ${totalToCleanup}`);
    console.log(`Remaining after cleanup: ${Math.max(0, totalEntries - totalToCleanup)}`);

    if (totalToCleanup === 0) {
      console.log('\n✅ No entries need cleanup at this time.');
    } else {
      console.log(`\n⚠️  ${totalToCleanup} entries would be cleaned up by the cron job.`);
      console.log('   Run "npm run cleanup:trending" to perform actual cleanup.');
    }

    // Test 5: Check for entries expiring soon
    console.log('\nTest 5: Checking for entries expiring in next 2 hours...');
    
    const soonExpireDate = new Date();
    soonExpireDate.setHours(soonExpireDate.getHours() + 2);
    
    const expiringSoonResponse = await axios.get(`${STRAPI_URL}/api/trendings`, {
      headers: {
        'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      params: {
        'pagination[limit]': 100,
        'filters[expires_at][$lt]': soonExpireDate.toISOString(),
        'filters[expires_at][$gt]': new Date().toISOString(),
        'filters[is_active][$eq]': true
      }
    });

    const expiringSoon = expiringSoonResponse.data.data || [];
    console.log(`   Found ${expiringSoon.length} entries expiring in next 2 hours`);

    if (expiringSoon.length > 0) {
      console.log('   Expiring entries:');
      expiringSoon.forEach(entry => {
        console.log(`   - "${entry.attributes.title}" expires at ${entry.attributes.expires_at}`);
      });
    }

    console.log('\n🎉 Cleanup test completed successfully!');

  } catch (error) {
    console.error('❌ Error during cleanup test:', error.response?.data?.message || error.message);
    process.exit(1);
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testCleanup();
}

module.exports = { testCleanup };
