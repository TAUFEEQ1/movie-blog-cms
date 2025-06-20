const axios = require('axios');

// Sample coming soon data (this would normally come from TMDB API or other sources)
const sampleComingSoonData = [
  {
    title: "Dune: Part Three",
    tmdb_id: 123456,
    type: "movie",
    platform: "Theatrical",
    tmdb_rating: 8.2,
    tmdb_vote_count: 15000,
    genres: ["Science Fiction", "Adventure", "Drama"],
    poster_path: "/example-poster1.jpg",
    backdrop_path: "/example-backdrop1.jpg",
    release_date: "2026-11-01",
    trailer_url: "https://youtube.com/watch?v=example1",
    overview: "The final chapter of Denis Villeneuve's epic adaptation of Frank Herbert's Dune continues the mythic journey of Paul Atreides.",
    runtime: 150,
    language: "en",
    popularity: 95.5,
    anticipation_score: 92.0,
    anticipation_rank: 1,
    is_active: true,
    expires_at: "2026-12-01T00:00:00.000Z",
    status: "in_production",
    production_companies: ["Legendary Entertainment", "Warner Bros."],
    cast: ["Timothée Chalamet", "Zendaya", "Oscar Isaac"],
    director: "Denis Villeneuve",
    budget: 200000000
  },
  {
    title: "The Batman Part II",
    tmdb_id: 123457,
    type: "movie",
    platform: "Theatrical",
    tmdb_rating: 8.0,
    tmdb_vote_count: 12000,
    genres: ["Action", "Crime", "Drama"],
    poster_path: "/example-poster2.jpg",
    backdrop_path: "/example-backdrop2.jpg",
    release_date: "2025-10-03",
    trailer_url: "https://youtube.com/watch?v=example2",
    overview: "The Dark Knight returns in this highly anticipated sequel to Matt Reeves' The Batman.",
    runtime: 140,
    language: "en",
    popularity: 88.3,
    anticipation_score: 89.0,
    anticipation_rank: 2,
    is_active: true,
    expires_at: "2025-11-03T00:00:00.000Z",
    status: "post_production",
    production_companies: ["Warner Bros.", "DC Films"],
    cast: ["Robert Pattinson", "Zoë Kravitz", "Jeffrey Wright"],
    director: "Matt Reeves",
    budget: 185000000
  },
  {
    title: "Spider-Man 4",
    tmdb_id: 123458,
    type: "movie",
    platform: "Theatrical",
    tmdb_rating: null,
    tmdb_vote_count: null,
    genres: ["Action", "Adventure", "Science Fiction"],
    poster_path: "/example-poster3.jpg",
    backdrop_path: "/example-backdrop3.jpg",
    release_date: "2025-07-18",
    trailer_url: null,
    overview: "Tom Holland returns as the web-slinger in the fourth installment of the Spider-Man series.",
    runtime: null,
    language: "en",
    popularity: 92.1,
    anticipation_score: 85.0,
    anticipation_rank: 3,
    is_active: true,
    expires_at: "2025-08-18T00:00:00.000Z",
    status: "announced",
    production_companies: ["Sony Pictures", "Marvel Studios"],
    cast: ["Tom Holland", "Zendaya"],
    director: "TBA",
    budget: null
  },
  {
    title: "Stranger Things 5",
    tmdb_id: 123459,
    type: "tv",
    platform: "Netflix",
    tmdb_rating: 8.7,
    tmdb_vote_count: 25000,
    genres: ["Science Fiction", "Horror", "Drama"],
    poster_path: "/example-poster4.jpg",
    backdrop_path: "/example-backdrop4.jpg",
    release_date: "2025-03-15",
    air_date: "2025-03-15",
    trailer_url: "https://youtube.com/watch?v=example4",
    overview: "The final season of the hit Netflix series brings the Upside Down saga to its epic conclusion.",
    runtime: 60,
    language: "en",
    popularity: 96.8,
    anticipation_score: 94.0,
    anticipation_rank: 4,
    is_active: true,
    expires_at: "2025-04-15T00:00:00.000Z",
    status: "post_production",
    production_companies: ["Netflix", "21 Laps Entertainment"],
    cast: ["Millie Bobby Brown", "Finn Wolfhard", "Winona Ryder"],
    director: "The Duffer Brothers",
    budget: null
  },
  {
    title: "Avatar 3",
    tmdb_id: 123460,
    type: "movie",
    platform: "Theatrical",
    tmdb_rating: null,
    tmdb_vote_count: null,
    genres: ["Science Fiction", "Adventure", "Action"],
    poster_path: "/example-poster5.jpg",
    backdrop_path: "/example-backdrop5.jpg",
    release_date: "2025-12-20",
    trailer_url: null,
    overview: "James Cameron continues his epic Avatar saga with the third installment in the groundbreaking series.",
    runtime: null,
    language: "en",
    popularity: 87.4,
    anticipation_score: 82.0,
    anticipation_rank: 5,
    is_active: true,
    expires_at: "2026-01-20T00:00:00.000Z",
    status: "in_production",
    production_companies: ["20th Century Studios", "Lightstorm Entertainment"],
    cast: ["Sam Worthington", "Zoe Saldana", "Sigourney Weaver"],
    director: "James Cameron",
    budget: 350000000
  }
];

async function seedComingSoonData() {
  const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
  const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

  if (!STRAPI_API_TOKEN) {
    console.error('STRAPI_API_TOKEN environment variable is required');
    process.exit(1);
  }

  console.log('Starting to seed Coming Soon data...');

  try {
    for (const item of sampleComingSoonData) {
      console.log(`Creating: ${item.title}`);
      
      const response = await axios.post(
        `${STRAPI_URL}/api/coming-soons`,
        {
          data: item
        },
        {
          headers: {
            'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log(`✅ Created: ${item.title} (ID: ${response.data.data.id})`);
    }

    console.log('🎉 Successfully seeded all Coming Soon data!');
  } catch (error) {
    console.error('❌ Error seeding data:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Run the seed function
seedComingSoonData();
