/**
 * coming-soon controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::coming-soon.coming-soon' as any, ({ strapi }) => ({
  /**
   * Get all active coming soon items
   * GET /api/coming-soons
   */
  async find(ctx: any) {
    try {
      const { type, status, limit = 20, sortBy = 'release_date' } = ctx.request.query;
      const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : 20;

      const filters: any = {
        is_active: true,
        release_date: {
          $gte: new Date().toISOString().split('T')[0] // Only future releases
        }
      };

      if (type && ['movie', 'tv'].includes(type as string)) {
        filters.type = type;
      }

      if (status && ['announced', 'in_production', 'post_production', 'rumored', 'planned'].includes(status as string)) {
        filters.status = status;
      }

      let sort: any = [{ release_date: 'asc' }]; // Default: earliest releases first

      if (sortBy === 'anticipation_score') {
        sort = [{ anticipation_score: 'desc' }, { release_date: 'asc' }];
      } else if (sortBy === 'popularity') {
        sort = [{ popularity: 'desc' }, { release_date: 'asc' }];
      } else if (sortBy === 'tmdb_rating') {
        sort = [{ tmdb_rating: 'desc' }, { release_date: 'asc' }];
      }

      const comingSoonItems = await strapi.entityService.findMany('api::coming-soon.coming-soon' as any, {
        filters,
        sort,
        limit: Math.min(limitNum, 100)
      }) as any;

      return comingSoonItems;
    } catch (error: any) {
      strapi.log.error('Error fetching coming soon items:', error);
      return ctx.internalServerError('Unable to fetch coming soon items');
    }
  },

  /**
   * Get coming soon items by release period
   * GET /api/coming-soons/by-period/:period
   */
  async getByPeriod(ctx: any) {
    try {
      const { period } = ctx.params;
      const { type, limit = 20 } = ctx.request.query;
      const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : 20;

      const now = new Date();
      let startDate: Date;
      let endDate: Date;

      switch (period) {
        case 'this-week':
          startDate = new Date(now);
          endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          break;
        case 'this-month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          break;
        case 'next-month':
          startDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 2, 0);
          break;
        case 'this-year':
          startDate = new Date(now.getFullYear(), 0, 1);
          endDate = new Date(now.getFullYear(), 11, 31);
          break;
        case 'next-year':
          startDate = new Date(now.getFullYear() + 1, 0, 1);
          endDate = new Date(now.getFullYear() + 1, 11, 31);
          break;
        default:
          return ctx.badRequest('Invalid period. Use: this-week, this-month, next-month, this-year, next-year');
      }

      const filters: any = {
        is_active: true,
        release_date: {
          $gte: startDate.toISOString().split('T')[0],
          $lte: endDate.toISOString().split('T')[0]
        }
      };

      if (type && ['movie', 'tv'].includes(type as string)) {
        filters.type = type;
      }

      const comingSoonItems = await strapi.entityService.findMany('api::coming-soon.coming-soon' as any, {
        filters,
        sort: [{ release_date: 'asc' }, { anticipation_score: 'desc' }],
        limit: Math.min(limitNum, 100)
      }) as any;

      return {
        period,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        items: comingSoonItems
      };
    } catch (error: any) {
      strapi.log.error('Error fetching coming soon items by period:', error);
      return ctx.internalServerError('Unable to fetch coming soon items');
    }
  },

  /**
   * Get most anticipated items
   * GET /api/coming-soons/most-anticipated
   */
  async getMostAnticipated(ctx: any) {
    try {
      const { type, limit = 10 } = ctx.request.query;
      const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : 10;

      const filters: any = {
        is_active: true,
        release_date: {
          $gte: new Date().toISOString().split('T')[0]
        }
      };

      if (type && ['movie', 'tv'].includes(type as string)) {
        filters.type = type;
      }

      const comingSoonItems = await strapi.entityService.findMany('api::coming-soon.coming-soon' as any, {
        filters,
        sort: [{ anticipation_score: 'desc' }, { popularity: 'desc' }],
        limit: Math.min(limitNum, 50)
      }) as any;

      return comingSoonItems;
    } catch (error: any) {
      strapi.log.error('Error fetching most anticipated items:', error);
      return ctx.internalServerError('Unable to fetch most anticipated items');
    }
  },

  /**
   * Get coming soon items by genre
   * GET /api/coming-soons/by-genre/:genre
   */
  async getByGenre(ctx: any) {
    try {
      const { genre } = ctx.params;
      const { type, limit = 20 } = ctx.request.query;
      const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : 20;

      const filters: any = {
        is_active: true,
        release_date: {
          $gte: new Date().toISOString().split('T')[0]
        },
        genres: {
          $contains: genre
        }
      };

      if (type && ['movie', 'tv'].includes(type as string)) {
        filters.type = type;
      }

      const comingSoonItems = await strapi.entityService.findMany('api::coming-soon.coming-soon' as any, {
        filters,
        sort: [{ release_date: 'asc' }, { anticipation_score: 'desc' }],
        limit: Math.min(limitNum, 50)
      }) as any;

      return comingSoonItems;
    } catch (error: any) {
      strapi.log.error('Error fetching coming soon items by genre:', error);
      return ctx.internalServerError('Unable to fetch coming soon items by genre');
    }
  }
}));
