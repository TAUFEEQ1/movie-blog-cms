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
   * Create a journal entry with TMDB data (upsert media)
   * POST /api/journal-entries/tmdb/create
   */
  async createFromTMDB(ctx) {
    try {
      const { tmdb, ...journalData } = ctx.request.body;

      if (!tmdb || !tmdb.id || !tmdb.type) {
        return ctx.badRequest('TMDB data with id and type are required');
      }

      // Normalize the media type
      const mediaType = tmdb.type === 'tv' ? 'tv_series' : 'movies';

      // Check if media entry already exists by TMDB ID
      const existingMedia = await strapi.entityService.findMany('api::media.media', {
        filters: {
          tmdbId: tmdb.id,
          type: mediaType
        },
        limit: 1
      });

      let mediaEntry;

      if (!existingMedia || existingMedia.length === 0) {
        // Create new media entry with TMDB data
        const mediaData = {
          title: tmdb.title || tmdb.name,
          synopsis: tmdb.overview || '',
          releaseDate: tmdb.release_date || tmdb.first_air_date,
          poster_path: tmdb.poster_path,
          tmdbId: tmdb.id,
          type: mediaType as 'movies' | 'tv_series',
          tmdb_average_rating: tmdb.vote_average || 0,
          tmdb_vote_count: tmdb.vote_count || 0,
          runtime: tmdb.runtime || null,
          release_status: 'released' as 'released' | 'upcoming' // Default status
        };

        mediaEntry = await strapi.entityService.create('api::media.media', {
          data: mediaData
        });

        strapi.log.info(`Created new media entry: ${mediaData.title} (TMDB ID: ${tmdb.id})`);
      } else {
        // Use existing media entry
        mediaEntry = existingMedia[0];
        strapi.log.info(`Using existing media entry: ${mediaEntry.title} (TMDB ID: ${tmdb.id})`);
        
        // Optionally update the existing media with fresh TMDB data
        const updatedMediaData = {
          title: tmdb.title || tmdb.name,
          synopsis: tmdb.overview || mediaEntry.synopsis,
          poster_path: tmdb.poster_path || mediaEntry.poster_path,
          tmdb_average_rating: tmdb.vote_average || mediaEntry.tmdb_average_rating,
          tmdb_vote_count: tmdb.vote_count || mediaEntry.tmdb_vote_count
        };

        mediaEntry = await strapi.entityService.update('api::media.media', mediaEntry.id, {
          data: updatedMediaData
        });
      }

      // Create journal entry linked to the media
      const journalEntryData = {
        ...journalData,
        media_item: mediaEntry.id,
        user: ctx.state.user?.id
      };

      const journalEntry = await strapi.entityService.create('api::journal-entry.journal-entry', {
        data: journalEntryData,
        populate: {
          media_item: true,
          user: true
        }
      });

      ctx.body = {
        data: journalEntry,
        meta: {
          mediaCreated: !existingMedia || existingMedia.length === 0
        }
      };
    } catch (error) {
      console.error('Create with TMDB error:', error);
      strapi.log.error('Failed to create journal entry with TMDB data', error);
      ctx.internalServerError('Failed to create journal entry with TMDB data');
    }
  }
}));
