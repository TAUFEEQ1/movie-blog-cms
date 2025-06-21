#!/usr/bin/env node

/**
 * Manual cleanup script for trending entries
 * Usage: npm run cleanup:trending
 * 
 * This script can be run manually to clean up old trending entries
 * without waiting for the daily cron job
 */

'use strict';

const axios = require('axios');

async function manualCleanup() {
  const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
  const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

  if (!STRAPI_API_TOKEN) {
    console.error('STRAPI_API_TOKEN environment variable is required');
    console.log('You can set it in your .env file or run: STRAPI_API_TOKEN=your_token npm run cleanup:trending');
    process.exit(1);
  }

  console.log('Starting manual cleanup of old trending entries...');
  
  try {
    const CLEANUP_OLDER_THAN_HOURS = 36;
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - CLEANUP_OLDER_THAN_HOURS);
    
    console.log(`Looking for entries older than ${CLEANUP_OLDER_THAN_HOURS} hours (before ${cutoffDate.toISOString()})`);

    // Fetch trending entries to cleanup - only based on createdAt
    const response = await axios.get(`${STRAPI_URL}/api/trendings`, {
      headers: {
        'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      params: {
        'pagination[limit]': 1000,
        'filters[createdAt][$lt]': cutoffDate.toISOString()
      }
    });

    const oldEntries = response.data.data || [];
    console.log(`Found ${oldEntries.length} trending entries to delete`);

    if (oldEntries.length === 0) {
      console.log('No old trending entries found. Cleanup complete.');
      return;
    }

    // Delete old entries
    let deletedCount = 0;
    let errorCount = 0;

    for (const entry of oldEntries) {
      try {
        await axios.delete(`${STRAPI_URL}/api/trendings/${entry.id}`, {
          headers: {
            'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
            'Content-Type': 'application/json'
          }
        });
        
        deletedCount++;
        
        // Log progress
        if (deletedCount % 10 === 0) {
          console.log(`Deleted ${deletedCount}/${oldEntries.length} trending entries`);
        }
        
      } catch (deleteError) {
        errorCount++;
        console.error(`Failed to delete trending entry ${entry.id}:`, deleteError.response?.data?.message || deleteError.message);
      }
    }

    console.log(`\nCleanup Summary:`);
    console.log(`- Total entries found: ${oldEntries.length}`);
    console.log(`- Successfully deleted: ${deletedCount}`);
    console.log(`- Errors: ${errorCount}`);
    console.log(`- Cutoff date: ${cutoffDate.toISOString()}`);

    // Also cleanup inactive entries
    console.log('\nCleaning up inactive trending entries...');
    
    const inactiveResponse = await axios.get(`${STRAPI_URL}/api/trendings`, {
      headers: {
        'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      params: {
        'pagination[limit]': 1000,
        'filters[is_active][$eq]': false
      }
    });

    const inactiveEntries = inactiveResponse.data.data || [];
    console.log(`Found ${inactiveEntries.length} inactive trending entries to delete`);

    let inactiveDeletedCount = 0;
    let inactiveErrorCount = 0;

    for (const entry of inactiveEntries) {
      try {
        await axios.delete(`${STRAPI_URL}/api/trendings/${entry.id}`, {
          headers: {
            'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
            'Content-Type': 'application/json'
          }
        });
        
        inactiveDeletedCount++;
        
      } catch (deleteError) {
        inactiveErrorCount++;
        console.error(`Failed to delete inactive trending entry ${entry.id}:`, deleteError.response?.data?.message || deleteError.message);
      }
    }

    console.log(`\nInactive Cleanup Summary:`);
    console.log(`- Inactive entries found: ${inactiveEntries.length}`);
    console.log(`- Successfully deleted: ${inactiveDeletedCount}`);
    console.log(`- Errors: ${inactiveErrorCount}`);

    console.log('\n✅ Manual trending cleanup completed successfully!');

  } catch (error) {
    console.error('❌ Error during manual cleanup:', error.response?.data?.message || error.message);
    process.exit(1);
  }
}

// Run the cleanup if this script is executed directly
if (require.main === module) {
  manualCleanup();
}

module.exports = { manualCleanup };
