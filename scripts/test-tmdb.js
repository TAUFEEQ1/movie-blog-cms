/**
 * Test script for TMDB integration
 * Usage: node scripts/test-tmdb.js
 */

const axios = require('axios');
require('dotenv').config();

async function testTMDB() {
  try {
    console.log('Testing TMDB API integration...');
    
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey) {
      console.error('TMDB_API_KEY environment variable is required');
      process.exit(1);
    }

    const baseUrl = 'https://api.themoviedb.org/3';
    const headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    };
    
    // Test search functionality
    console.log('\n1. Testing movie search...');
    const searchResponse = await axios.get(`${baseUrl}/search/movie`, {
      headers,
      params: { query: 'Oppenheimer' }
    });
    
    console.log(`Found ${searchResponse.data.results?.length || 0} movies`);
    if (searchResponse.data.results && searchResponse.data.results.length > 0) {
      console.log('First result:', {
        id: searchResponse.data.results[0].id,
        title: searchResponse.data.results[0].title,
        release_date: searchResponse.data.results[0].release_date
      });

      // Test movie details
      console.log('\n2. Testing movie details...');
      const movieId = searchResponse.data.results[0].id;
      const detailsResponse = await axios.get(`${baseUrl}/movie/${movieId}`, { headers });
      
      console.log('Movie details:', {
        id: detailsResponse.data.id,
        title: detailsResponse.data.title,
        overview: detailsResponse.data.overview?.substring(0, 100) + '...',
        runtime: detailsResponse.data.runtime,
        genres: detailsResponse.data.genres?.map(g => g.name).join(', ')
      });
    }

    // Test TV search
    console.log('\n3. Testing TV search...');
    const tvResponse = await axios.get(`${baseUrl}/search/tv`, {
      headers,
      params: { query: 'Breaking Bad' }
    });
    
    console.log(`Found ${tvResponse.data.results?.length || 0} TV shows`);
    if (tvResponse.data.results && tvResponse.data.results.length > 0) {
      console.log('First result:', {
        id: tvResponse.data.results[0].id,
        name: tvResponse.data.results[0].name,
        first_air_date: tvResponse.data.results[0].first_air_date
      });
    }

    // Test multi search
    console.log('\n4. Testing multi search...');
    const multiResponse = await axios.get(`${baseUrl}/search/multi`, {
      headers,
      params: { query: 'Marvel' }
    });
    
    console.log(`Found ${multiResponse.data.results?.length || 0} results`);
    if (multiResponse.data.results && multiResponse.data.results.length > 0) {
      const firstResult = multiResponse.data.results[0];
      console.log('First result:', {
        id: firstResult.id,
        title: firstResult.title || firstResult.name,
        media_type: firstResult.media_type
      });
    }

    console.log('\n✅ TMDB API integration test completed successfully!');
    
  } catch (error) {
    console.error('❌ TMDB API test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    process.exit(1);
  }
}

testTMDB();
