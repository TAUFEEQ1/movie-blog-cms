/**
 * Script to configure basic public permissions for trending and coming-soon content types
 * Run this script after Strapi is running to set up basic read permissions
 */

const axios = require('axios');

const STRAPI_URL = 'http://localhost:1337';

// You'll need to get this token from the admin panel
// Go to Settings > API Tokens > Create new API Token with "Full access"
const ADMIN_API_TOKEN = 'YOUR_ADMIN_API_TOKEN_HERE';

async function configurePublicPermissions() {
  try {
    console.log('🔧 Configuring public permissions for Strapi...');
    
    // Get the public role
    const rolesResponse = await axios.get(`${STRAPI_URL}/api/users-permissions/roles`, {
      headers: {
        'Authorization': `Bearer ${ADMIN_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    const publicRole = rolesResponse.data.roles.find(role => role.type === 'public');
    if (!publicRole) {
      throw new Error('Public role not found');
    }
    
    console.log(`📝 Found public role with ID: ${publicRole.id}`);
    
    // Configure permissions for trending content type
    const trendingPermissions = {
      permissions: {
        'api::trending.trending': {
          controllers: {
            trending: {
              find: {
                enabled: true,
                policy: ''
              },
              findOne: {
                enabled: true,
                policy: ''
              }
            }
          }
        },
        'api::coming-soon.coming-soon': {
          controllers: {
            'coming-soon': {
              find: {
                enabled: true,
                policy: ''
              },
              findOne: {
                enabled: true,
                policy: ''
              }
            }
          }
        }
      }
    };
    
    // Update the public role permissions
    await axios.put(`${STRAPI_URL}/api/users-permissions/roles/${publicRole.id}`, {
      ...publicRole,
      ...trendingPermissions
    }, {
      headers: {
        'Authorization': `Bearer ${ADMIN_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Successfully configured public permissions!');
    console.log('📊 Trending and Coming Soon content is now publicly accessible');
    console.log('🔗 Test the API: http://localhost:1337/api/trendings');
    
  } catch (error) {
    console.error('❌ Error configuring permissions:', error.response?.data || error.message);
    console.log('\n📋 Manual steps:');
    console.log('1. Go to http://localhost:1337/admin');
    console.log('2. Navigate to Settings > Users & Permissions Plugin > Roles');
    console.log('3. Click on "Public" role');
    console.log('4. Enable "find" and "findOne" permissions for Trending and Coming-soon content types');
    console.log('5. Save the changes');
  }
}

// If running directly, execute the configuration
if (require.main === module) {
  configurePublicPermissions();
}

module.exports = { configurePublicPermissions };
