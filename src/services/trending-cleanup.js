/**
 * Cleanup service for removing old trending entries
 * This service deletes trending entries older than 24 hours
 */

'use strict';

const CLEANUP_OLDER_THAN_HOURS = 24;

module.exports = {
  async cleanupOldTrendingEntries() {
    try {
      const cutoffDate = new Date();
      cutoffDate.setHours(cutoffDate.getHours() - CLEANUP_OLDER_THAN_HOURS);

      console.log(`Starting cleanup of trending entries older than ${CLEANUP_OLDER_THAN_HOURS} hours (before ${cutoffDate.toISOString()})`);

      // Find all trending entries older than 24 hours
      const oldEntries = await strapi.entityService.findMany('api::trending.trending', {
        filters: {
          $or: [
            // Use expires_at if set
            {
              expires_at: {
                $lt: new Date().toISOString()
              }
            },
            // Otherwise use createdAt for entries older than 24 hours
            {
              $and: [
                {
                  expires_at: {
                    $null: true
                  }
                },
                {
                  createdAt: {
                    $lt: cutoffDate.toISOString()
                  }
                }
              ]
            }
          ]
        },
        limit: 1000 // Process in batches to avoid memory issues
      });

      if (!oldEntries || oldEntries.length === 0) {
        console.log('No old trending entries found to cleanup');
        return { deletedCount: 0 };
      }

      console.log(`Found ${oldEntries.length} trending entries to delete`);

      // Delete old entries
      let deletedCount = 0;
      for (const entry of oldEntries) {
        try {
          await strapi.entityService.delete('api::trending.trending', entry.id);
          deletedCount++;
          
          // Log progress for large batches
          if (deletedCount % 10 === 0) {
            console.log(`Deleted ${deletedCount}/${oldEntries.length} trending entries`);
          }
        } catch (deleteError) {
          console.error(`Failed to delete trending entry ${entry.id}:`, deleteError.message);
        }
      }

      console.log(`Successfully deleted ${deletedCount} old trending entries`);
      
      return { 
        deletedCount,
        totalFound: oldEntries.length,
        cutoffDate: cutoffDate.toISOString()
      };

    } catch (error) {
      console.error('Error during trending entries cleanup:', error);
      throw error;
    }
  },

  /**
   * Set expiration time for new trending entries
   * This can be called when creating new trending entries
   */
  async setExpirationForEntry(entryId, hoursFromNow = CLEANUP_OLDER_THAN_HOURS) {
    try {
      const expirationDate = new Date();
      expirationDate.setHours(expirationDate.getHours() + hoursFromNow);

      await strapi.entityService.update('api::trending.trending', entryId, {
        data: {
          expires_at: expirationDate.toISOString()
        }
      });

      console.log(`Set expiration for trending entry ${entryId} to ${expirationDate.toISOString()}`);
      return expirationDate;
    } catch (error) {
      console.error(`Failed to set expiration for trending entry ${entryId}:`, error);
      throw error;
    }
  },

  /**
   * Cleanup inactive trending entries
   * This removes entries that are marked as inactive
   */
  async cleanupInactiveEntries() {
    try {
      console.log('Starting cleanup of inactive trending entries');

      const inactiveEntries = await strapi.entityService.findMany('api::trending.trending', {
        filters: {
          is_active: false
        },
        limit: 1000
      });

      if (!inactiveEntries || inactiveEntries.length === 0) {
        console.log('No inactive trending entries found to cleanup');
        return { deletedCount: 0 };
      }

      console.log(`Found ${inactiveEntries.length} inactive trending entries to delete`);

      let deletedCount = 0;
      for (const entry of inactiveEntries) {
        try {
          await strapi.entityService.delete('api::trending.trending', entry.id);
          deletedCount++;
        } catch (deleteError) {
          console.error(`Failed to delete inactive trending entry ${entry.id}:`, deleteError.message);
        }
      }

      console.log(`Successfully deleted ${deletedCount} inactive trending entries`);
      
      return { 
        deletedCount,
        totalFound: inactiveEntries.length
      };

    } catch (error) {
      console.error('Error during inactive trending entries cleanup:', error);
      throw error;
    }
  }
};
