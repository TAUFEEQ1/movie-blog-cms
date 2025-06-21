/**
 * trending service
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreService('api::trending.trending', ({ strapi }) => ({
  // Override the default create method to automatically set expiration (informational only)
  async create(params) {
    const DEFAULT_EXPIRATION_HOURS = 36;
    
    // Set expiration date if not provided (informational only - cleanup uses createdAt)
    if (params.data && !params.data.expires_at) {
      const expirationDate = new Date();
      expirationDate.setHours(expirationDate.getHours() + DEFAULT_EXPIRATION_HOURS);
      params.data.expires_at = expirationDate.toISOString();
    }

    // Call the default create method
    const result = await super.create(params);
    
    console.log(`Created trending entry "${result.title}" - will be cleaned up after ${DEFAULT_EXPIRATION_HOURS} hours based on createdAt`);
    
    return result;
  },

  // Override the default update method to handle expiration updates
  async update(entityId, params) {
    // If updating is_active to false, this entry will be cleaned up by the cron job
    if (params.data && params.data.is_active === false) {
      console.log(`Trending entry ${entityId} marked as inactive - will be cleaned up by next cron job`);
    }

    return super.update(entityId, params);
  },

  // Custom method to extend expiration for an entry (informational only)
  async extendExpiration(entityId, additionalHours = 36) {
    const entry = await strapi.entityService.findOne('api::trending.trending', entityId);
    
    if (!entry) {
      throw new Error(`Trending entry with ID ${entityId} not found`);
    }

    const currentExpiration = entry.expires_at ? new Date(entry.expires_at) : new Date();
    const newExpiration = new Date(currentExpiration.getTime() + (additionalHours * 60 * 60 * 1000));

    const updatedEntry = await strapi.entityService.update('api::trending.trending', entityId, {
      data: {
        expires_at: newExpiration.toISOString()
      }
    });

    console.log(`Extended expiration for trending entry "${entry.title}" to ${newExpiration.toISOString()} (informational only - cleanup uses createdAt)`);
    
    return updatedEntry;
  },

  // Custom method to get trending entries that will expire soon (based on createdAt + 36 hours)
  async getExpiringEntries(hoursUntilExpiration = 2) {
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - (36 - hoursUntilExpiration)); // 36 hours - buffer

    const expiringEntries = await strapi.entityService.findMany('api::trending.trending', {
      filters: {
        createdAt: {
          $lt: cutoffDate.toISOString()
        },
        is_active: true
      }
    });

    return expiringEntries;
  }
}));
