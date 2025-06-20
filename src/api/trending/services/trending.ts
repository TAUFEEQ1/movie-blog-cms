/**
 * trending service
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreService('api::trending.trending', ({ strapi }) => ({
  // Override the default create method to automatically set expiration
  async create(params) {
    const DEFAULT_EXPIRATION_HOURS = 24;
    
    // Set expiration date if not provided
    if (params.data && !params.data.expires_at) {
      const expirationDate = new Date();
      expirationDate.setHours(expirationDate.getHours() + DEFAULT_EXPIRATION_HOURS);
      params.data.expires_at = expirationDate.toISOString();
    }

    // Call the default create method
    const result = await super.create(params);
    
    console.log(`Created trending entry "${result.title}" with expiration: ${result.expires_at}`);
    
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

  // Custom method to extend expiration for an entry
  async extendExpiration(entityId, additionalHours = 24) {
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

    console.log(`Extended expiration for trending entry "${entry.title}" to ${newExpiration.toISOString()}`);
    
    return updatedEntry;
  },

  // Custom method to get trending entries that will expire soon
  async getExpiringEntries(hoursUntilExpiration = 2) {
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() + hoursUntilExpiration);

    const expiringEntries = await strapi.entityService.findMany('api::trending.trending', {
      filters: {
        expires_at: {
          $lt: cutoffDate.toISOString()
        },
        is_active: true
      }
    });

    return expiringEntries;
  }
}));
