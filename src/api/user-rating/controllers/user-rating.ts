/**
 * user-rating controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::user-rating.user-rating' as any, ({ strapi }) => ({
  /**
   * Rate a trending or coming soon item
   * POST /api/user-ratings/rate
   */
  async rate(ctx: any) {
    try {
      const { 
        tmdb_id, 
        content_type, 
        media_type, 
        rating, 
        comment, 
        is_notable = false, 
        is_unfavorable = false,
        is_watchlisted = false,
        mood_rating,
        anticipation_level,
        tags
      } = ctx.request.body;
      
      const user = ctx.state.user;

      if (!user) {
        return ctx.unauthorized('You must be logged in to rate content');
      }

      if (!tmdb_id || !content_type || !media_type || rating === undefined) {
        return ctx.badRequest('tmdb_id, content_type, media_type, and rating are required');
      }

      if (rating < 1 || rating > 10) {
        return ctx.badRequest('Rating must be between 1 and 10');
      }

      if (!['trending', 'coming_soon'].includes(content_type)) {
        return ctx.badRequest('content_type must be either "trending" or "coming_soon"');
      }

      if (!['movie', 'tv'].includes(media_type)) {
        return ctx.badRequest('media_type must be either "movie" or "tv"');
      }

      // Check if user has already rated this item
      const existingRating = await strapi.entityService.findMany('api::user-rating.user-rating' as any, {
        filters: {
          user: user.id,
          tmdb_id,
          content_type,
          media_type
        },
        limit: 1
      }) as any;

      let result;

      if (Array.isArray(existingRating) && existingRating.length > 0) {
        // Update existing rating
        result = await strapi.entityService.update('api::user-rating.user-rating' as any, existingRating[0].id, {
          data: {
            rating,
            comment: comment || null,
            is_notable,
            is_unfavorable,
            is_watchlisted,
            mood_rating: mood_rating || null,
            anticipation_level: anticipation_level || null,
            tags: tags || null
          }
        });
      } else {
        // Create new rating
        result = await strapi.entityService.create('api::user-rating.user-rating' as any, {
          data: {
            user: user.id,
            tmdb_id,
            content_type,
            media_type,
            rating,
            comment: comment || null,
            is_notable,
            is_unfavorable,
            is_watchlisted,
            mood_rating: mood_rating || null,
            anticipation_level: anticipation_level || null,
            tags: tags || null
          }
        });
      }

      return result;
    } catch (error: any) {
      strapi.log.error('Error rating item:', error);
      return ctx.internalServerError('Unable to rate item');
    }
  },

  /**
   * Get user's rating for a specific item
   * GET /api/user-ratings/my-rating/:tmdb_id/:content_type/:media_type
   */
  async getMyRating(ctx: any) {
    try {
      const { tmdb_id, content_type, media_type } = ctx.params;
      const user = ctx.state.user;

      if (!user) {
        return ctx.unauthorized('You must be logged in');
      }

      const rating = await strapi.entityService.findMany('api::user-rating.user-rating' as any, {
        filters: {
          user: user.id,
          tmdb_id: parseInt(tmdb_id),
          content_type,
          media_type
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
   * Get user's notable items
   * GET /api/user-ratings/notable
   */
  async getNotable(ctx: any) {
    try {
      const user = ctx.state.user;

      if (!user) {
        return ctx.unauthorized('You must be logged in');
      }

      const { content_type, media_type, limit = 20 } = ctx.request.query;
      const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : 20;

      const filters: any = {
        user: user.id,
        $or: [
          { is_notable: true },
          { rating: { $gte: 8 } } // Consider ratings >= 8 as notable
        ]
      };

      if (content_type && ['trending', 'coming_soon'].includes(content_type as string)) {
        filters.content_type = content_type;
      }

      if (media_type && ['movie', 'tv'].includes(media_type as string)) {
        filters.media_type = media_type;
      }

      const ratings = await strapi.entityService.findMany('api::user-rating.user-rating' as any, {
        filters,
        sort: [{ rating: 'desc' }, { createdAt: 'desc' }],
        limit: Math.min(limitNum, 50),
        populate: ['user']
      }) as any;

      return ratings;
    } catch (error: any) {
      strapi.log.error('Error fetching notable items:', error);
      return ctx.internalServerError('Unable to fetch notable items');
    }
  },

  /**
   * Get user's unfavorable items
   * GET /api/user-ratings/unfavorable
   */
  async getUnfavorable(ctx: any) {
    try {
      const user = ctx.state.user;

      if (!user) {
        return ctx.unauthorized('You must be logged in');
      }

      const { content_type, media_type, limit = 20 } = ctx.request.query;
      const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : 20;

      const filters: any = {
        user: user.id,
        $or: [
          { is_unfavorable: true },
          { rating: { $lte: 4 } } // Consider ratings <= 4 as unfavorable
        ]
      };

      if (content_type && ['trending', 'coming_soon'].includes(content_type as string)) {
        filters.content_type = content_type;
      }

      if (media_type && ['movie', 'tv'].includes(media_type as string)) {
        filters.media_type = media_type;
      }

      const ratings = await strapi.entityService.findMany('api::user-rating.user-rating' as any, {
        filters,
        sort: [{ rating: 'asc' }, { createdAt: 'desc' }],
        limit: Math.min(limitNum, 50),
        populate: ['user']
      }) as any;

      return ratings;
    } catch (error: any) {
      strapi.log.error('Error fetching unfavorable items:', error);
      return ctx.internalServerError('Unable to fetch unfavorable items');
    }
  },

  /**
   * Get user's watchlist
   * GET /api/user-ratings/watchlist
   */
  async getWatchlist(ctx: any) {
    try {
      const user = ctx.state.user;

      if (!user) {
        return ctx.unauthorized('You must be logged in');
      }

      const { content_type, media_type, limit = 20 } = ctx.request.query;
      const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : 20;

      const filters: any = {
        user: user.id,
        is_watchlisted: true
      };

      if (content_type && ['trending', 'coming_soon'].includes(content_type as string)) {
        filters.content_type = content_type;
      }

      if (media_type && ['movie', 'tv'].includes(media_type as string)) {
        filters.media_type = media_type;
      }

      const ratings = await strapi.entityService.findMany('api::user-rating.user-rating' as any, {
        filters,
        sort: [{ createdAt: 'desc' }],
        limit: Math.min(limitNum, 50),
        populate: ['user']
      }) as any;

      return ratings;
    } catch (error: any) {
      strapi.log.error('Error fetching watchlist:', error);
      return ctx.internalServerError('Unable to fetch watchlist');
    }
  },

  /**
   * Get all user ratings with filters
   * GET /api/user-ratings/my-ratings
   */
  async getMyRatings(ctx: any) {
    try {
      const user = ctx.state.user;

      if (!user) {
        return ctx.unauthorized('You must be logged in');
      }

      const { 
        content_type, 
        media_type, 
        mood_rating,
        min_rating,
        max_rating,
        page = 1, 
        pageSize = 25 
      } = ctx.request.query;
      
      const pageNum = typeof page === 'string' ? parseInt(page, 10) : 1;
      const pageSizeNum = typeof pageSize === 'string' ? parseInt(pageSize, 10) : 25;

      const filters: any = {
        user: user.id
      };

      if (content_type && ['trending', 'coming_soon'].includes(content_type as string)) {
        filters.content_type = content_type;
      }

      if (media_type && ['movie', 'tv'].includes(media_type as string)) {
        filters.media_type = media_type;
      }

      if (mood_rating && ['excited', 'interested', 'neutral', 'disappointed', 'avoid'].includes(mood_rating as string)) {
        filters.mood_rating = mood_rating;
      }

      if (min_rating) {
        filters.rating = { $gte: parseFloat(min_rating as string) };
      }

      if (max_rating) {
        if (filters.rating) {
          filters.rating.$lte = parseFloat(max_rating as string);
        } else {
          filters.rating = { $lte: parseFloat(max_rating as string) };
        }
      }

      const ratings = await strapi.entityService.findMany('api::user-rating.user-rating' as any, {
        filters,
        sort: [{ updatedAt: 'desc' }],
        start: (pageNum - 1) * pageSizeNum,
        limit: pageSizeNum,
        populate: ['user']
      }) as any;

      return ratings;
    } catch (error: any) {
      strapi.log.error('Error fetching user ratings:', error);
      return ctx.internalServerError('Unable to fetch ratings');
    }
  },

  /**
   * Delete/Remove a rating
   * DELETE /api/user-ratings/remove/:tmdb_id/:content_type/:media_type
   */
  async removeRating(ctx: any) {
    try {
      const { tmdb_id, content_type, media_type } = ctx.params;
      const user = ctx.state.user;

      if (!user) {
        return ctx.unauthorized('You must be logged in');
      }

      const existingRating = await strapi.entityService.findMany('api::user-rating.user-rating' as any, {
        filters: {
          user: user.id,
          tmdb_id: parseInt(tmdb_id),
          content_type,
          media_type
        },
        limit: 1
      }) as any;

      if (!Array.isArray(existingRating) || existingRating.length === 0) {
        return ctx.notFound('Rating not found');
      }

      await strapi.entityService.delete('api::user-rating.user-rating' as any, existingRating[0].id);

      return { message: 'Rating removed successfully' };
    } catch (error: any) {
      strapi.log.error('Error removing rating:', error);
      return ctx.internalServerError('Unable to remove rating');
    }
  }
}));
