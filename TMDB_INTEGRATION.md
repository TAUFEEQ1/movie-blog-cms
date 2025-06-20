# TMDB Integration for Journal Entry

This backend implementation provides movie and TV show search functionality using The Movie Database (TMDB) API for the journal entry system.

## Features

- **Search Movies and TV Shows**: Multi-search, movie-only search, and TV-only search
- **Detailed Information**: Get comprehensive details about movies and TV shows
- **Automatic Media Creation**: Automatically create media entries when adding to journal
- **Genre Support**: Automatic genre mapping from TMDB IDs to names
- **Image URLs**: Automatic poster and backdrop URL generation

## Setup

### 1. Environment Variables

Add your TMDB API key to the `.env` file:

```bash
TMDB_API_KEY=your_tmdb_bearer_token_here
```

### 2. Dependencies

The following dependencies are required and already installed:

- `axios` - For HTTP requests to TMDB API
- `@strapi/strapi` - Strapi framework

## API Endpoints

### Search Endpoints

#### Search Movies and TV Shows

```bash
GET /api/journal-entries/search?query=movie_name&type=all&page=1
```

#### Search Movies Only

```bash
GET /api/journal-entries/search?query=movie_name&type=movie&page=1
```

#### Search TV Shows Only

```bash
GET /api/journal-entries/search?query=show_name&type=tv&page=1
```

**Parameters:**

- `query` (required): Search term
- `type` (optional): `movie`, `tv`, or `all` (default: `all`)
- `page` (optional): Page number (default: 1)

**Response:**

```json
{
  "data": [
    {
      "id": 872585,
      "title": "Oppenheimer",
      "overview": "The story of J. Robert Oppenheimer...",
      "poster_url": "https://image.tmdb.org/t/p/w500/poster.jpg",
      "backdrop_url": "https://image.tmdb.org/t/p/w500/backdrop.jpg",
      "release_date": "2023-07-19",
      "genres": ["Drama", "History"],
      "rating": 8.3,
      "vote_count": 5000,
      "type": "movie",
      "original_title": "Oppenheimer",
      "original_language": "en"
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

### Detail Endpoints

#### Get Movie Details

```bash
GET /api/journal-entries/details/movie/872585
```

#### Get TV Show Details

```bash
GET /api/journal-entries/details/tv/1396
```

**Response:**

```json
{
  "data": {
    "id": 872585,
    "title": "Oppenheimer",
    "overview": "Full overview...",
    "poster_url": "https://image.tmdb.org/t/p/w500/poster.jpg",
    "backdrop_url": "https://image.tmdb.org/t/p/w500/backdrop.jpg",
    "release_date": "2023-07-19",
    "genres": [
      {"id": 18, "name": "Drama"},
      {"id": 36, "name": "History"}
    ],
    "runtime": 181,
    "vote_average": 8.3,
    "vote_count": 5000,
    "type": "movie"
  }
}
```

### Journal Entry Creation

#### Create Journal Entry with TMDB Data

```bash
POST /api/journal-entries/create-with-tmdb
```

**Request Body:**

```json
{
  "data": {
    "tmdb_id": 872585,
    "type": "movie",
    "status": "planned",
    "my_rating": null,
    "notes": "Want to watch this soon!",
    "watched_date": null
  }
}
```

This endpoint will:

1. Fetch detailed information from TMDB
2. Create or find existing media entry
3. Create the journal entry linked to the media
4. Return the complete journal entry with media information

## TMDB Service

The `TMDBService` class (`src/services/tmdb.ts`) provides the following methods:

### Search Methods

- `searchMulti(query, page)` - Search both movies and TV shows
- `searchMovies(query, page)` - Search movies only
- `searchTVShows(query, page)` - Search TV shows only

### Detail Methods

- `getMovieDetails(movieId)` - Get detailed movie information
- `getTVShowDetails(tvId)` - Get detailed TV show information

## Testing

Run the test script to verify TMDB integration:

```bash
node scripts/test-tmdb.js
```

This will test:

- Movie search functionality
- Movie details retrieval
- TV show search
- Multi-search capability

## Error Handling

The service includes comprehensive error handling:

- **API Key Validation**: Ensures TMDB API key is configured
- **Request Timeout**: Automatic timeout handling
- **Rate Limiting**: Respects TMDB API rate limits
- **Error Logging**: Detailed error logging for debugging

## Usage in Frontend

Example usage in frontend application:

```javascript
// Search for movies
const searchResults = await fetch('/api/journal-entries/search?query=Oppenheimer&type=movie');
const movies = await searchResults.json();

// Get movie details
const detailsResponse = await fetch('/api/journal-entries/details/movie/872585');
const movieDetails = await detailsResponse.json();

// Create journal entry
const journalEntry = await fetch('/api/journal-entries/create-with-tmdb', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    data: {
      tmdb_id: 872585,
      type: 'movie',
      status: 'planned',
      notes: 'Excited to watch this!'
    }
  })
});
```

## Image URLs

The service automatically converts TMDB image paths to full URLs using the base URL `https://image.tmdb.org/t/p/w500/`. This provides medium-quality images suitable for most use cases.

## Genre Mapping

The service automatically loads and caches genre information from TMDB on startup, converting genre IDs to human-readable names in all responses.

## Rate Limiting

TMDB API has rate limits. The service handles this gracefully and provides meaningful error messages when limits are exceeded.

---

## Files Created/Modified

1. **`src/services/tmdb.ts`** - TMDB service implementation
2. **`src/api/journal-entry/controllers/journal-entry.ts`** - Extended controller with search methods
3. **`src/api/journal-entry/routes/custom.js`** - Custom routes for TMDB endpoints
4. **`scripts/test-tmdb.js`** - Test script for TMDB integration
5. **`.env`** - Added TMDB_API_KEY environment variable

This implementation provides a complete TMDB integration for the journal entry system, enabling users to search for and add movies and TV shows to their personal journal with rich metadata.
