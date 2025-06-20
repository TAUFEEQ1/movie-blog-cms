const axios = require('axios');

const STRAPI_URL = 'http://localhost:1337';

const trendingData = [
  {
    title: "Titan: The OceanGate Disaster",
    tmdb_id: 1184918,
    type: "movie",
    tmdb_rating: 7.1,
    tmdb_vote_count: 234,
    genres: ["Documentary", "Drama"],
    poster_path: "/pzc7S7NzSeKG3VCXxGClFD5BQ5K.jpg",
    backdrop_path: "/dqK9Hag1054tghRQSqLSfrkvQnA.jpg",
    overview: "An in-depth look at the tragic OceanGate submersible incident that captivated the world in 2023.",
    release_date: "2024-06-18",
    runtime: 120,
    certification: "PG-13",
    popularity: 89.5,
    trending_rank: 1,
    platform: "Netflix",
    trailer_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    trending_since: new Date().toISOString(),
    is_ephemeral: true
  },
  {
    title: "Deadpool & Wolverine",
    tmdb_id: 533535,
    type: "movie",
    tmdb_rating: 8.2,
    tmdb_vote_count: 15420,
    genres: ["Action", "Comedy", "Superhero"],
    poster_path: "/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg",
    backdrop_path: "/yDHYTfA3R0jFYba16jBB1ef8oIt.jpg",
    overview: "Deadpool and Wolverine team up in this highly anticipated superhero crossover.",
    release_date: "2024-07-26",
    runtime: 127,
    certification: "R",
    popularity: 95.8,
    trending_rank: 2,
    platform: "Theaters",
    trailer_url: "https://www.youtube.com/watch?v=73_1biulkYk",
    trending_since: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    is_ephemeral: true
  },
  {
    title: "The Batman",
    tmdb_id: 414906,
    type: "movie",
    tmdb_rating: 7.8,
    tmdb_vote_count: 8950,
    genres: ["Action", "Crime", "Drama"],
    poster_path: "/b0PlSFdDwbyK0cf5RxwDpaOJQvQ.jpg",
    backdrop_path: "/qqHQsStV6exghCM7zbObuYBiYxw.jpg",
    overview: "Batman ventures into Gotham City's underworld when a sadistic killer leaves behind a trail of cryptic clues.",
    release_date: "2022-03-04",
    runtime: 176,
    certification: "PG-13",
    popularity: 78.2,
    trending_rank: 3,
    platform: "HBO Max",
    trailer_url: "https://www.youtube.com/watch?v=mqqft2x_Aa4",
    trending_since: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    is_ephemeral: false
  },
  {
    title: "Stranger Things",
    tmdb_id: 66732,
    type: "tv",
    tmdb_rating: 8.7,
    tmdb_vote_count: 12340,
    genres: ["Drama", "Fantasy", "Horror"],
    poster_path: "/49WJfeN0moxb9IPfGn8AIqMGskD.jpg",
    backdrop_path: "/56v2KjBlU4XaOv9rVYEQypROD7P.jpg",
    overview: "When a young boy vanishes, a small town uncovers a mystery involving secret experiments.",
    release_date: "2016-07-15",
    runtime: 50,
    certification: "TV-14",
    popularity: 92.1,
    trending_rank: 4,
    platform: "Netflix",
    trailer_url: "https://www.youtube.com/watch?v=b9EkMc79ZSU",
    trending_since: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    is_ephemeral: true
  },
  {
    title: "The Bear",
    tmdb_id: 136315,
    type: "tv",
    tmdb_rating: 8.9,
    tmdb_vote_count: 5670,
    genres: ["Comedy", "Drama"],
    poster_path: "/sHFlbKS3WLqMnp9t2ghADIJFnuQ.jpg",
    backdrop_path: "/zPIug5giU8oug6Xes5K1sTfQJxY.jpg",
    overview: "A young chef from the fine dining world returns to Chicago to run his family's sandwich shop.",
    release_date: "2022-06-23",
    runtime: 30,
    certification: "TV-MA",
    popularity: 86.4,
    trending_rank: 5,
    platform: "Hulu",
    trailer_url: "https://www.youtube.com/watch?v=y-cqqAJIXhs",
    trending_since: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    is_ephemeral: false
  }
];

async function seedTrendingToStrapi() {
  try {
    console.log('Starting to seed trending data to Strapi...');
    
    // Create each trending item
    for (const item of trendingData) {
      try {
        console.log(`Creating trending item: ${item.title}`);
        
        const response = await axios.post(`${STRAPI_URL}/api/trendings`, {
          data: item
        });
        
        console.log(`✅ Created: ${item.title} (ID: ${response.data.data.id})`);
      } catch (error) {
        if (error.response?.data?.error?.details?.errors?.some(e => e.path.includes('tmdb_id'))) {
          console.log(`⚠️  Item already exists: ${item.title}`);
        } else {
          console.error(`❌ Error creating ${item.title}:`, error.response?.data || error.message);
        }
      }
    }
    
    console.log('\n🎉 Trending seed data creation completed!');
    console.log('You can now visit http://localhost:3002/trending to see the data.');
    
  } catch (error) {
    console.error('❌ Error seeding trending data:', error.message);
    console.log('Make sure Strapi is running on http://localhost:1337');
  }
}

// If running directly, execute the seed function
if (require.main === module) {
  seedTrendingToStrapi();
}

module.exports = { trendingData, seedTrendingToStrapi };
