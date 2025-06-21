/**
 * trending controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::trending.trending', ({ strapi }) => ({
  // Override the default find method to disable pagination and return all items
  async find(ctx: any) {
    try {
      // Parse query parameters
      const { type, platform } = ctx.request.query;
      
      const filters: any = {};

      if (type && ['movie', 'tv'].includes(type as string)) {
        filters.type = type;
      }

      if (platform && typeof platform === 'string') {
        filters.platform = platform;
      }

      // Fetch all trending items without pagination
      const entities = await strapi.entityService.findMany('api::trending.trending', {
        filters,
        sort: [{ trending_rank: 'asc' }, { trending_score: 'desc' }],
        limit: 1000, // Set a high limit to get all items
        populate: '*'
      });

      // Return in the format expected by the frontend
      return {
        data: entities,
        meta: {
          pagination: {
            page: 1,
            pageSize: entities.length,
            pageCount: 1,
            total: entities.length
          }
        }
      };
    } catch (error) {
      strapi.log.error('Error fetching trending items:', error);
      return ctx.internalServerError('Unable to fetch trending items');
    }
  },

  /**
   * Get trending items by platform
   * GET /api/trendings/platform/:platform
   */
  async findByPlatform(ctx: any) {
    try {
      const { platform } = ctx.params;
      const { type, limit = '10' } = ctx.request.query;

      if (!platform || typeof platform !== 'string') {
        return ctx.badRequest('Platform parameter is required');
      }

      const filters: any = {
        platform,
        is_active: true,
        $or: [
          { expires_at: { $null: true } },
          { expires_at: { $gt: new Date() } }
        ]
      };

      if (type && ['movie', 'tv'].includes(type as string)) {
        filters.type = type;
      }

      const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : 10;

      const entities = await strapi.entityService.findMany('api::trending.trending', {
        filters,
        sort: [{ trending_rank: 'asc' }, { trending_score: 'desc' }],
        limit: Math.min(limitNum, 50)
      });

      return entities;
    } catch (error) {
      strapi.log.error('Error fetching trending items by platform:', error);
      return ctx.internalServerError('Unable to fetch trending items');
    }
  },

  /**
   * Bulk update trending items (for bot usage)
   * PUT /api/trendings/bulk-update
   */
  async bulkUpdate(ctx: any) {
    try {
      const { items } = ctx.request.body;

      if (!Array.isArray(items) || items.length === 0) {
        return ctx.badRequest('Items array is required');
      }

      const results: any[] = [];
      const errors: any[] = [];

      for (const item of items) {
        try {
          let entity;
          
          // Try to find existing entity by tmdb_id and type
          const existing = await strapi.entityService.findMany('api::trending.trending', {
            filters: {
              tmdb_id: item.tmdb_id,
              type: item.type
            },
            limit: 1
          }) as any[];

          if (existing && existing.length > 0) {
            // Update existing
            entity = await strapi.entityService.update('api::trending.trending', existing[0].id, {
              data: item
            });
          } else {
            // Create new
            entity = await strapi.entityService.create('api::trending.trending', {
              data: item
            });
          }

          results.push(entity);
        } catch (itemError: any) {
          strapi.log.error(`Error processing trending item ${item.tmdb_id}:`, itemError);
          errors.push({
            tmdb_id: item.tmdb_id,
            error: itemError.message
          });
        }
      }

      return {
        success: true,
        processed: results.length,
        errorCount: errors.length,
        results,
        errors
      };
    } catch (error: any) {
      strapi.log.error('Error in bulk update:', error);
      return ctx.internalServerError('Unable to process bulk update');
    }
  },

  /**
   * Clean up expired trending items
   * DELETE /api/trendings/cleanup
   */
  async cleanup(ctx: any) {
    try {
      const expiredItems = await strapi.entityService.findMany('api::trending.trending', {
        filters: {
          expires_at: { $lt: new Date() },
          is_active: true
        }
      }) as any[];

      let cleanedCount = 0;
      for (const item of expiredItems) {
        await strapi.entityService.update('api::trending.trending', item.id, {
          data: { is_active: false }
        });
        cleanedCount++;
      }

      return {
        success: true,
        cleaned: cleanedCount,
        message: `Deactivated ${cleanedCount} expired trending items`
      };
    } catch (error: any) {
      strapi.log.error('Error cleaning up expired items:', error);
      return ctx.internalServerError('Unable to clean up expired items');
    }
  }
}));
