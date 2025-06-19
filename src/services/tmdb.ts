/**
 * TMDB API Service
 * Provides movie and TV show search functionality using The Movie Database API
 */

import axios from 'axios';

interface SearchResult {
  id: number;
  title: string;
  overview: string;
  poster_url: string | null;
  backdrop_url: string | null;
  release_date: string;
  genres: string[];
  rating: number;
  vote_count: number;
  type: 'movie' | 'tv';
  original_title?: string;
  original_language: string;
}

class TMDBService {
  private baseUrl = 'https://api.themoviedb.org/3';
  private baseImageUrl = 'https://image.tmdb.org/t/p/w500';
  private apiKey: string;
  private genreCache: Map<number, string> = new Map();

  constructor() {
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey) {
      throw new Error('TMDB_API_KEY environment variable is required');
    }
    
    this.apiKey = apiKey;
    this.initializeGenres();
  }

  /**
   * Make authenticated request to TMDB API
   */
  private async makeRequest(endpoint: string, params: any = {}): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        params
      });
      return response.data;
    } catch (error: any) {
      console.error(`TMDB API error for ${endpoint}:`, error.response?.data || error.message);
      throw new Error(`TMDB API request failed: ${error.response?.data?.status_message || error.message}`);
    }
  }

  /**
   * Initialize genre cache for both movies and TV shows
   */
  private async initializeGenres(): Promise<void> {
    try {
      // Get movie genres
      const movieGenres = await this.makeRequest('/genre/movie/list');
      movieGenres.genres?.forEach((genre: any) => {
        this.genreCache.set(genre.id, genre.name);
      });

      // Get TV genres
      const tvGenres = await this.makeRequest('/genre/tv/list');
      tvGenres.genres?.forEach((genre: any) => {
        this.genreCache.set(genre.id, genre.name);
      });
    } catch (error) {
      console.error('Failed to initialize TMDB genres:', error);
    }
  }

  /**
   * Convert genre IDs to genre names
   */
  private getGenreNames(genreIds: number[]): string[] {
    return genreIds
      .map(id => this.genreCache.get(id))
      .filter(Boolean) as string[];
  }

  /**
   * Get full image URL from relative path
   */
  private getImageUrl(path: string | null): string | null {
    return path ? `${this.baseImageUrl}${path}` : null;
  }

  /**
   * Search for movies and TV shows
   */
  async searchMulti(query: string, page: number = 1): Promise<{
    results: SearchResult[];
    total_pages: number;
    total_results: number;
  }> {
    try {
      const response = await this.makeRequest('/search/multi', { query, page });
      
      const results: SearchResult[] = response.results
        ?.filter((item: any) => item.media_type === 'movie' || item.media_type === 'tv')
        .map((item: any) => {
          const isMovie = item.media_type === 'movie';
          
          return {
            id: item.id,
            title: isMovie ? item.title : item.name,
            overview: item.overview || '',
            poster_url: this.getImageUrl(item.poster_path),
            backdrop_url: this.getImageUrl(item.backdrop_path),
            release_date: isMovie ? item.release_date : item.first_air_date,
            genres: this.getGenreNames(item.genre_ids || []),
            rating: item.vote_average || 0,
            vote_count: item.vote_count || 0,
            type: isMovie ? 'movie' : 'tv',
            original_title: isMovie ? item.original_title : item.original_name,
            original_language: item.original_language || 'en'
          };
        }) || [];

      return {
        results,
        total_pages: response.total_pages || 1,
        total_results: response.total_results || 0
      };
    } catch (error) {
      console.error('TMDB search error:', error);
      throw new Error('Failed to search movies and TV shows');
    }
  }

  /**
   * Search for movies only
   */
  async searchMovies(query: string, page: number = 1): Promise<{
    results: SearchResult[];
    total_pages: number;
    total_results: number;
  }> {
    try {
      const response = await this.makeRequest('/search/movie', { query, page });
      
      const results: SearchResult[] = response.results?.map((movie: any) => ({
        id: movie.id,
        title: movie.title,
        overview: movie.overview || '',
        poster_url: this.getImageUrl(movie.poster_path),
        backdrop_url: this.getImageUrl(movie.backdrop_path),
        release_date: movie.release_date,
        genres: this.getGenreNames(movie.genre_ids || []),
        rating: movie.vote_average || 0,
        vote_count: movie.vote_count || 0,
        type: 'movie' as const,
        original_title: movie.original_title,
        original_language: movie.original_language || 'en'
      })) || [];

      return {
        results,
        total_pages: response.total_pages || 1,
        total_results: response.total_results || 0
      };
    } catch (error) {
      console.error('TMDB movie search error:', error);
      throw new Error('Failed to search movies');
    }
  }

  /**
   * Search for TV shows only
   */
  async searchTVShows(query: string, page: number = 1): Promise<{
    results: SearchResult[];
    total_pages: number;
    total_results: number;
  }> {
    try {
      const response = await this.makeRequest('/search/tv', { query, page });
      
      const results: SearchResult[] = response.results?.map((show: any) => ({
        id: show.id,
        title: show.name,
        overview: show.overview || '',
        poster_url: this.getImageUrl(show.poster_path),
        backdrop_url: this.getImageUrl(show.backdrop_path),
        release_date: show.first_air_date,
        genres: this.getGenreNames(show.genre_ids || []),
        rating: show.vote_average || 0,
        vote_count: show.vote_count || 0,
        type: 'tv' as const,
        original_title: show.original_name,
        original_language: show.original_language || 'en'
      })) || [];

      return {
        results,
        total_pages: response.total_pages || 1,
        total_results: response.total_results || 0
      };
    } catch (error) {
      console.error('TMDB TV search error:', error);
      throw new Error('Failed to search TV shows');
    }
  }

  /**
   * Get detailed movie information
   */
  async getMovieDetails(movieId: number): Promise<any> {
    try {
      const movie = await this.makeRequest(`/movie/${movieId}`);
      return {
        ...movie,
        poster_url: this.getImageUrl(movie.poster_path),
        backdrop_url: this.getImageUrl(movie.backdrop_path),
        type: 'movie'
      };
    } catch (error) {
      console.error('TMDB movie details error:', error);
      throw new Error('Failed to get movie details');
    }
  }

  /**
   * Get detailed TV show information
   */
  async getTVShowDetails(tvId: number): Promise<any> {
    try {
      const show = await this.makeRequest(`/tv/${tvId}`);
      return {
        ...show,
        poster_url: this.getImageUrl(show.poster_path),
        backdrop_url: this.getImageUrl(show.backdrop_path),
        type: 'tv'
      };
    } catch (error) {
      console.error('TMDB TV details error:', error);
      throw new Error('Failed to get TV show details');
    }
  }
}

// Export singleton instance
export default new TMDBService();
export type { SearchResult };
