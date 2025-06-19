/**
 * journal-entry controller
 */

import { factories } from '@strapi/strapi';
import tmdbService from '../../../services/tmdb';

export default factories.createCoreController('api::journal-entry.journal-entry', ({ strapi }) => ({
  // Extend default controller with custom methods
  ...factories.createCoreController('api::journal-entry.journal-entry'),

  /**
   * Search for movies and TV shows using TMDB API
   * GET /api/journal-entries/search
   */
  async search(ctx) {
    try {
      const { query, type, page = 1 } = ctx.request.query;

      if (!query || typeof query !== 'string') {
        return ctx.badRequest('Search query is required');
      }

      const pageNum = typeof page === 'string' ? parseInt(page, 10) : 1;
      let searchResults;

      switch (type) {
        case 'movie':
          searchResults = await tmdbService.searchMovies(query, pageNum);
          break;
        case 'tv':
          searchResults = await tmdbService.searchTVShows(query, pageNum);
          break;
        default:
          searchResults = await tmdbService.searchMulti(query, pageNum);
          break;
      }

      ctx.body = {
        data: searchResults.results,
        meta: {
          pagination: {
            page: pageNum,
            total: searchResults.total_results,
            totalPages: searchResults.total_pages
          }
        }
      };
    } catch (error) {
      console.error('Search error:', error);
      ctx.internalServerError('Failed to search for movies and TV shows');
    }
  },

  /**
   * Get detailed information about a movie or TV show
   * GET /api/journal-entries/details/:type/:id
   */
  async getDetails(ctx) {
    try {
      const { type, id } = ctx.params;

      if (!type || !id) {
        return ctx.badRequest('Type and ID are required');
      }

      const numericId = parseInt(id, 10);
      let details;

      if (type === 'movie') {
        details = await tmdbService.getMovieDetails(numericId);
      } else if (type === 'tv') {
        details = await tmdbService.getTVShowDetails(numericId);
      } else {
        return ctx.badRequest('Type must be either "movie" or "tv"');
      }

      ctx.body = {
        data: details
      };
    } catch (error) {
      console.error('Get details error:', error);
      ctx.internalServerError('Failed to get movie/TV show details');
    }
  },

  /**
   * Create a journal entry with TMDB data
   * POST /api/journal-entries/create-with-tmdb
   */
  async createWithTMDB(ctx) {
    try {
      const { tmdb_id, type, ...journalData } = ctx.request.body.data;

      if (!tmdb_id || !type) {
        return ctx.badRequest('TMDB ID and type are required');
      }

      // Get detailed information from TMDB
      let tmdbDetails;
      if (type === 'movie') {
        tmdbDetails = await tmdbService.getMovieDetails(tmdb_id);
      } else if (type === 'tv') {
        tmdbDetails = await tmdbService.getTVShowDetails(tmdb_id);
      } else {
        return ctx.badRequest('Type must be either "movie" or "tv"');
      }

      // Check if media entry already exists
      const existingMedia = await strapi.entityService.findMany('api::media.media', {
        filters: {
          tmdb_id: tmdb_id,
          type: type
        },
        limit: 1
      });

      let mediaEntry;

      // Create media entry if it doesn't exist
      if (!existingMedia || existingMedia.length === 0) {
        const mediaData = {
          title: type === 'movie' ? tmdbDetails.title : tmdbDetails.name,
          overview: tmdbDetails.overview,
          release_date: type === 'movie' ? tmdbDetails.release_date : tmdbDetails.first_air_date,
          poster_url: tmdbDetails.poster_url,
          backdrop_url: tmdbDetails.backdrop_url,
          tmdb_id: tmdb_id,
          type: (type === 'movie' ? 'movies' : 'tv_series') as 'movies' | 'tv_series',
          genres: tmdbDetails.genres?.map((g: any) => g.name).join(', ') || '',
          rating: tmdbDetails.vote_average || 0,
          runtime: type === 'movie' ? tmdbDetails.runtime : null,
          status: tmdbDetails.status || 'Released'
        };

        mediaEntry = await strapi.entityService.create('api::media.media', {
          data: mediaData
        });
      } else {
        mediaEntry = existingMedia[0];
      }

      // Create journal entry
      const journalEntryData = {
        ...journalData,
        media: mediaEntry.id,
        user: ctx.state.user?.id // Assuming user authentication
      };

      const journalEntry = await strapi.entityService.create('api::journal-entry.journal-entry', {
        data: journalEntryData,
        populate: {
          media: true,
          user: true
        }
      });

      ctx.body = {
        data: journalEntry
      };
    } catch (error) {
      console.error('Create with TMDB error:', error);
      ctx.internalServerError('Failed to create journal entry with TMDB data');
    }
  }
}));
