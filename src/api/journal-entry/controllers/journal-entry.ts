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

      // Get detailed information including trailer from TMDB for both new and existing media
      let detailedInfo;
      try {
        if (tmdb.type === 'movie') {
          detailedInfo = await tmdbService.getMovieDetails(tmdb.id);
        } else {
          detailedInfo = await tmdbService.getTVShowDetails(tmdb.id);
        }
      } catch (error) {
        console.error('Failed to get detailed TMDB info:', error);
        detailedInfo = null;
      }

      let mediaEntry;

      if (!existingMedia || existingMedia.length === 0) {
        // Handle genres - find or create them
        let genreIds: string[] = [];
        if (tmdb.genres && Array.isArray(tmdb.genres)) {
          // If genres are objects with name/id
          for (const genre of tmdb.genres) {
            const genreName = typeof genre === 'string' ? genre : genre.name;
            if (genreName) {
              // Check if genre exists
              let existingGenre = await strapi.entityService.findMany('api::genre.genre', {
                filters: { name: genreName },
                limit: 1
              });

              if (!existingGenre || existingGenre.length === 0) {
                // Create new genre
                const newGenre = await strapi.entityService.create('api::genre.genre', {
                  data: {
                    name: genreName,
                    slug: genreName.toLowerCase().replace(/\s+/g, '-')
                  }
                });
                genreIds.push(newGenre.id as string);
              } else {
                genreIds.push(existingGenre[0].id as string);
              }
            }
          }
        } else if (tmdb.genre_ids && Array.isArray(tmdb.genre_ids)) {
          // If we have genre IDs from search results, convert them to names
          const genreNames = tmdbService.getGenreNamesFromIds(tmdb.genre_ids);
          for (const genreName of genreNames) {
            if (genreName) {
              // Check if genre exists
              let existingGenre = await strapi.entityService.findMany('api::genre.genre', {
                filters: { name: genreName },
                limit: 1
              });

              if (!existingGenre || existingGenre.length === 0) {
                // Create new genre
                const newGenre = await strapi.entityService.create('api::genre.genre', {
                  data: {
                    name: genreName,
                    slug: genreName.toLowerCase().replace(/\s+/g, '-')
                  }
                });
                genreIds.push(newGenre.id as string);
              } else {
                genreIds.push(existingGenre[0].id as string);
              }
            }
          }
        }

        // Create new media entry with TMDB data
        const mediaData = {
          title: tmdb.title || tmdb.name,
          synopsis: tmdb.overview || '',
          releaseDate: tmdb.release_date || tmdb.first_air_date,
          poster_path: tmdb.poster_path,
          tmdbId: tmdb.id,
          type: mediaType as 'movies' | 'tv_series',
          tmdb_average_rating: detailedInfo?.vote_average || tmdb.vote_average || 0,
          tmdb_vote_count: detailedInfo?.vote_count || tmdb.vote_count || 0,
          runtime: tmdb.runtime || detailedInfo?.runtime || null,
          release_status: 'released' as 'released' | 'upcoming',
          trailerUrl: detailedInfo?.trailer_url || null
        };


        mediaEntry = await strapi.entityService.create('api::media.media', {
          data: mediaData
        });

        // Link genres using relation helper if any genres exist
        if (genreIds.length > 0) {
          for (const genreId of genreIds) {
            await strapi.db.query('api::media.media').update({
              where: { id: mediaEntry.id },
              data: {
                genres: {
                  connect: [genreId]
                }
              }
            });
          }
        }

        strapi.log.info(`Created new media entry: ${mediaData.title} (TMDB ID: ${tmdb.id}) with ${genreIds.length} genres`);
      } else {
        // Use existing media entry
        mediaEntry = existingMedia[0];
        strapi.log.info(`Using existing media entry: ${mediaEntry.title} (TMDB ID: ${tmdb.id})`);
        
        // Optionally update the existing media with fresh TMDB data
        const updatedMediaData = {
          title: tmdb.title || tmdb.name,
          synopsis: tmdb.overview || mediaEntry.synopsis,
          poster_path: tmdb.poster_path || mediaEntry.poster_path,
          tmdb_average_rating: detailedInfo?.vote_average || tmdb.vote_average || mediaEntry.tmdb_average_rating,
          tmdb_vote_count: detailedInfo?.vote_count || tmdb.vote_count || mediaEntry.tmdb_vote_count
        };

        mediaEntry = await strapi.entityService.update('api::media.media', mediaEntry.id, {
          data: updatedMediaData
        });
      }

      // Create journal entry linked to the media
      // Validate episode field for paused TV series
      if (mediaType === 'tv_series' && 
          journalData.watch_status === 'paused' && 
          (!journalData.episode || journalData.episode <= 0)) {
        return ctx.badRequest('Episode number is required for paused TV series');
      }

      // Filter out inappropriate fields based on media type and clean up empty values
      const filteredJournalData = { ...journalData };
      
      // Helper function to clean up empty date values
      const cleanDateField = (value: any) => {
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          return undefined;
        }
        return value;
      };
      
      // Clean up date fields - remove empty strings and null values
      filteredJournalData.watched_date = cleanDateField(filteredJournalData.watched_date);
      filteredJournalData.start_date = cleanDateField(filteredJournalData.start_date);
      filteredJournalData.end_date = cleanDateField(filteredJournalData.end_date);
      
      // Clean up other optional fields
      if (!filteredJournalData.title || filteredJournalData.title.trim() === '') {
        delete filteredJournalData.title;
      }
      
      if (!filteredJournalData.notes_reflections || filteredJournalData.notes_reflections.trim() === '') {
        delete filteredJournalData.notes_reflections;
      }
      
      if (!filteredJournalData.my_rating || filteredJournalData.my_rating <= 0) {
        delete filteredJournalData.my_rating;
      }
      
      if (!filteredJournalData.season_number || filteredJournalData.season_number <= 0) {
        delete filteredJournalData.season_number;
      }

      if (!filteredJournalData.episode || filteredJournalData.episode <= 0) {
        delete filteredJournalData.episode;
      }

      if (!filteredJournalData.total_episodes || filteredJournalData.total_episodes <= 0) {
        delete filteredJournalData.total_episodes;
      }
      
      // For movies, remove start_date and end_date as they're only for TV series
      if (mediaType === 'movies') {
        delete filteredJournalData.start_date;
        delete filteredJournalData.end_date;
        delete filteredJournalData.season_number;
        delete filteredJournalData.episode;
        delete filteredJournalData.total_episodes;
      }
      
      // For planned_to_watch entries, don't require watched_date
      if (filteredJournalData.watch_status === 'planned_to_watch') {
        delete filteredJournalData.watched_date;
        // For planned entries, start_date can be used as planned_date
      }
      
      const journalEntryData = {
        ...filteredJournalData,
        media_item: mediaEntry,
        user: ctx.state.user?.id
      };

      const journalEntry = await strapi.entityService.create('api::journal-entry.journal-entry', {
        data: journalEntryData,
        populate: {
          media_item: {
            populate: {
              genres: true
            }
          },
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
  },

  /**
   * Override default update to handle empty date values and validation
   * PUT /api/journal-entries/:id
   */
  async update(ctx) {
    try {
      const { data } = ctx.request.body;
      
      if (!data) {
        return ctx.badRequest('No data provided for update');
      }

      // First, let's try the default update process and add validation as a pre-hook
      // Helper function to clean up empty date values
      const cleanDateField = (value: any) => {
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          return undefined;
        }
        return value;
      };
      
      // Clean the update data
      const cleanedData = { ...data };
      
      // Clean up date fields - remove empty strings and null values
      cleanedData.watched_date = cleanDateField(cleanedData.watched_date);
      cleanedData.start_date = cleanDateField(cleanedData.start_date);
      cleanedData.end_date = cleanDateField(cleanedData.end_date);
      
      // Clean up other optional fields
      if (cleanedData.title && cleanedData.title.trim() === '') {
        delete cleanedData.title;
      }
      
      if (cleanedData.notes_reflections && cleanedData.notes_reflections.trim() === '') {
        delete cleanedData.notes_reflections;
      }
      
      if (cleanedData.my_rating && cleanedData.my_rating <= 0) {
        delete cleanedData.my_rating;
      }
      
      if (cleanedData.season_number && cleanedData.season_number <= 0) {
        delete cleanedData.season_number;
      }

      if (cleanedData.episode && cleanedData.episode <= 0) {
        delete cleanedData.episode;
      }

      if (cleanedData.total_episodes && cleanedData.total_episodes <= 0) {
        delete cleanedData.total_episodes;
      }
      
      // Remove undefined fields to avoid overwriting existing data with null
      Object.keys(cleanedData).forEach(key => {
        if (cleanedData[key] === undefined) {
          delete cleanedData[key];
        }
      });

      // For episode validation, we'll do a simple check without complex lookups
      // If it's a paused status and episode is being set, validate it exists
      if (cleanedData.watch_status === 'paused' && 
          cleanedData.episode !== undefined && 
          (!cleanedData.episode || cleanedData.episode <= 0)) {
        return ctx.badRequest('Episode number must be greater than 0 for paused entries');
      }
      
      // Call the default update method with cleaned data
      ctx.request.body.data = cleanedData;
      return await super.update(ctx);
    } catch (error) {
      console.error('Update journal entry error:', error);
      console.error('Error details:', {
        params: ctx.params,
        body: ctx.request.body,
        stack: error.stack
      });
      ctx.internalServerError('Failed to update journal entry');
    }
  }
}));
