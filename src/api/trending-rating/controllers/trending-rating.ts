/**
 * trending-rating controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::trending-rating.trending-rating' as any, ({ strapi }) => ({
  /**
   * Rate a trending item
   * POST /api/trending-ratings/rate
   */
  async rate(ctx: any) {
    try {
      const { tmdb_id, type, rating, comment, is_notable = false, is_unfavorable = false } = ctx.request.body;
      const user = ctx.state.user;

      if (!user) {
        return ctx.unauthorized('You must be logged in to rate content');
      }

      if (!tmdb_id || !type || rating === undefined) {
        return ctx.badRequest('tmdb_id, type, and rating are required');
      }

      if (rating < 1 || rating > 10) {
        return ctx.badRequest('Rating must be between 1 and 10');
      }

      // Check if user has already rated this item
      const existingRating = await strapi.entityService.findMany('api::trending-rating.trending-rating' as any, {
        filters: {
          user: user.id,
          tmdb_id,
          type
        },
        limit: 1
      }) as any;

      let result;

      if (Array.isArray(existingRating) && existingRating.length > 0) {
        // Update existing rating
        result = await strapi.entityService.update('api::trending-rating.trending-rating' as any, existingRating[0].id, {
          data: {
            rating,
            comment: comment || null,
            is_notable,
            is_unfavorable
          }
        });
      } else {
        // Create new rating
        result = await strapi.entityService.create('api::trending-rating.trending-rating' as any, {
          data: {
            user: user.id,
            tmdb_id,
            type,
            rating,
            comment: comment || null,
            is_notable,
            is_unfavorable
          }
        });
      }

      return result;
    } catch (error: any) {
      strapi.log.error('Error rating trending item:', error);
      return ctx.internalServerError('Unable to rate item');
    }
  },

  /**
   * Get user's rating for a specific trending item
   * GET /api/trending-ratings/my-rating/:tmdb_id/:type
   */
  async getMyRating(ctx: any) {
    try {
      const { tmdb_id, type } = ctx.params;
      const user = ctx.state.user;

      if (!user) {
        return ctx.unauthorized('You must be logged in');
      }

      const rating = await strapi.entityService.findMany('api::trending-rating.trending-rating' as any, {
        filters: {
          user: user.id,
          tmdb_id: parseInt(tmdb_id),
          type
        },
        limit: 1
      }) as any;

      return Array.isArray(rating) && rating.length > 0 ? rating[0] : null;
    } catch (error: any) {
      strapi.log.error('Error fetching user rating:', error);
      return ctx.internalServerError('Unable to fetch rating');
    }
  },

  /**
   * Get user's notable items (highly rated)
   * GET /api/trending-ratings/notable
   */
  async getNotable(ctx: any) {
    try {
      const user = ctx.state.user;

      if (!user) {
        return ctx.unauthorized('You must be logged in');
      }

      const { type, limit = 20 } = ctx.request.query;
      const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : 20;

      const filters: any = {
        user: user.id,
        $or: [
          { is_notable: true },
          { rating: { $gte: 8 } } // Consider ratings >= 8 as notable
        ]
      };

      if (type && ['movie', 'tv'].includes(type as string)) {
        filters.type = type;
      }

      const ratings = await strapi.entityService.findMany('api::trending-rating.trending-rating' as any, {
        filters,
        sort: [{ rating: 'desc' }, { createdAt: 'desc' }],
        limit: Math.min(limitNum, 50),
        populate: ['trending']
      }) as any;

      return ratings;
    } catch (error: any) {
      strapi.log.error('Error fetching notable items:', error);
      return ctx.internalServerError('Unable to fetch notable items');
    }
  },

  /**
   * Get user's unfavorable items (low rated)
   * GET /api/trending-ratings/unfavorable
   */
  async getUnfavorable(ctx: any) {
    try {
      const user = ctx.state.user;

      if (!user) {
        return ctx.unauthorized('You must be logged in');
      }

      const { type, limit = 20 } = ctx.request.query;
      const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : 20;

      const filters: any = {
        user: user.id,
        $or: [
          { is_unfavorable: true },
          { rating: { $lte: 4 } } // Consider ratings <= 4 as unfavorable
        ]
      };

      if (type && ['movie', 'tv'].includes(type as string)) {
        filters.type = type;
      }

      const ratings = await strapi.entityService.findMany('api::trending-rating.trending-rating' as any, {
        filters,
        sort: [{ rating: 'asc' }, { createdAt: 'desc' }],
        limit: Math.min(limitNum, 50),
        populate: ['trending']
      }) as any;

      return ratings;
    } catch (error: any) {
      strapi.log.error('Error fetching unfavorable items:', error);
      return ctx.internalServerError('Unable to fetch unfavorable items');
    }
  },

  /**
   * Get user's all ratings
   * GET /api/trending-ratings/my-ratings
   */
  async getMyRatings(ctx: any) {
    try {
      const user = ctx.state.user;

      if (!user) {
        return ctx.unauthorized('You must be logged in');
      }

      const { type, page = 1, pageSize = 25 } = ctx.request.query;
      const pageNum = typeof page === 'string' ? parseInt(page, 10) : 1;
      const pageSizeNum = typeof pageSize === 'string' ? parseInt(pageSize, 10) : 25;

      const filters: any = {
        user: user.id
      };

      if (type && ['movie', 'tv'].includes(type as string)) {
        filters.type = type;
      }

      const ratings = await strapi.entityService.findMany('api::trending-rating.trending-rating' as any, {
        filters,
        sort: [{ updatedAt: 'desc' }],
        start: (pageNum - 1) * pageSizeNum,
        limit: pageSizeNum,
        populate: ['trending']
      }) as any;

      return ratings;
    } catch (error: any) {
      strapi.log.error('Error fetching user ratings:', error);
      return ctx.internalServerError('Unable to fetch ratings');
    }
  }
}));
