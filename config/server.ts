export default ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  app: {
    keys: env.array('APP_KEYS'),
  },
  transfer: {
    remote: {
      enabled: true, // or simply remove this block to use the default
    },
  },
  cron: {
    enabled: true,
    tasks: {
      // Clean up old trending entries every day at 2 AM
      '0 2 * * *': async ({ strapi }) => {
        console.log('Running daily trending entries cleanup...');
        try {
          const cleanupService = require('../src/services/trending-cleanup');
          const result = await cleanupService.cleanupOldTrendingEntries();
          console.log('Daily trending cleanup completed:', result);
          
          // Also cleanup inactive entries
          const inactiveResult = await cleanupService.cleanupInactiveEntries();
          console.log('Inactive trending cleanup completed:', inactiveResult);
        } catch (error) {
          console.error('Daily trending cleanup failed:', error);
        }
      },
    },
  },
});
