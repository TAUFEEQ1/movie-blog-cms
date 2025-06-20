/**
 * Custom routes for trending content
 */

export default {
  routes: [
    {
      method: 'GET',
      path: '/trendings/active',
      handler: 'trending.findActive',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/trendings/platform/:platform',
      handler: 'trending.findByPlatform',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'PUT',
      path: '/trendings/bulk-update',
      handler: 'trending.bulkUpdate',
      config: {
        auth: false, // You may want to add authentication for bot access
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'DELETE',
      path: '/trendings/cleanup',
      handler: 'trending.cleanup',
      config: {
        auth: false, // You may want to add authentication for cleanup
        policies: [],
        middlewares: [],
      },
    },
  ],
};
