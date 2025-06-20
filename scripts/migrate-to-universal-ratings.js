const axios = require('axios');

/**
 * Migration script to move from trending-rating to universal user-rating system
 * This script migrates existing trending ratings to the new universal format
 */

async function migrateTrendingRatings() {
  const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
  const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

  if (!STRAPI_API_TOKEN) {
    console.error('STRAPI_API_TOKEN environment variable is required');
    process.exit(1);
  }

  console.log('Starting migration from trending-rating to user-rating...');

  try {
    // Fetch all existing trending ratings
    console.log('Fetching existing trending ratings...');
    const existingRatingsResponse = await axios.get(
      `${STRAPI_URL}/api/trending-ratings?pagination[limit]=1000`,
      {
        headers: {
          'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const existingRatings = existingRatingsResponse.data.data || [];
    console.log(`Found ${existingRatings.length} existing trending ratings to migrate`);

    if (existingRatings.length === 0) {
      console.log('No ratings to migrate. Migration complete.');
      return;
    }

    // Migrate each rating to the new format
    let migratedCount = 0;
    let errorCount = 0;

    for (const rating of existingRatings) {
      try {
        console.log(`Migrating rating ${rating.id}...`);

        // Create new user rating with universal format
        const newRatingData = {
          user: rating.user || rating.user?.id, // Handle both populated and ID references
          tmdb_id: rating.tmdb_id,
          content_type: 'trending', // All existing ratings are for trending content
          media_type: rating.type,
          rating: rating.rating,
          comment: rating.comment,
          is_notable: rating.is_notable || false,
          is_unfavorable: rating.is_unfavorable || false,
          is_watchlisted: false, // Default value for migrated items
          rewatch_count: 0,
          metadata: {
            migrated_from: 'trending-rating',
            original_id: rating.id,
            original_created_at: rating.createdAt,
            original_updated_at: rating.updatedAt
          }
        };

        // Create the new user rating
        const response = await axios.post(
          `${STRAPI_URL}/api/user-ratings`,
          {
            data: newRatingData
          },
          {
            headers: {
              'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
              'Content-Type': 'application/json'
            }
          }
        );

        console.log(`✅ Migrated rating ${rating.id} -> ${response.data.data.id}`);
        migratedCount++;

        // Optional: Add a small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`❌ Error migrating rating ${rating.id}:`, error.response?.data || error.message);
        errorCount++;
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`✅ Successfully migrated: ${migratedCount} ratings`);
    console.log(`❌ Failed to migrate: ${errorCount} ratings`);
    console.log(`📝 Total processed: ${existingRatings.length} ratings`);

    if (errorCount === 0) {
      console.log('\n🎉 Migration completed successfully!');
      console.log('\n⚠️  NOTE: You can now safely remove the old trending-rating content type');
      console.log('   and update your frontend to use the new user-rating endpoints.');
    } else {
      console.log('\n⚠️  Migration completed with errors. Please review the failed migrations.');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Function to validate the migration
async function validateMigration() {
  const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
  const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

  console.log('\n🔍 Validating migration...');

  try {
    // Count old ratings
    const oldRatingsResponse = await axios.get(
      `${STRAPI_URL}/api/trending-ratings?pagination[limit]=1`,
      {
        headers: {
          'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const oldRatingsCount = oldRatingsResponse.data.meta?.pagination?.total || 0;

    // Count new ratings for trending content
    const newRatingsResponse = await axios.get(
      `${STRAPI_URL}/api/user-ratings?filters[content_type][$eq]=trending&pagination[limit]=1`,
      {
        headers: {
          'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const newRatingsCount = newRatingsResponse.data.meta?.pagination?.total || 0;

    console.log(`📊 Old trending ratings: ${oldRatingsCount}`);
    console.log(`📊 New user ratings (trending): ${newRatingsCount}`);

    if (newRatingsCount >= oldRatingsCount) {
      console.log('✅ Migration validation passed!');
    } else {
      console.log('⚠️  Migration validation warning: Some ratings may not have been migrated.');
    }

  } catch (error) {
    console.error('❌ Validation failed:', error.response?.data || error.message);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--validate')) {
    await validateMigration();
  } else {
    await migrateTrendingRatings();
    await validateMigration();
  }
}

main();
