/**
 * Custom routes for user-rating API
 */

export default {
  routes: [
    {
      method: 'POST',
      path: '/user-ratings/rate',
      handler: 'user-rating.rate',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/user-ratings/my-rating/:tmdb_id/:content_type/:media_type',
      handler: 'user-rating.getMyRating',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/user-ratings/notable',
      handler: 'user-rating.getNotable',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/user-ratings/unfavorable',
      handler: 'user-rating.getUnfavorable',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/user-ratings/watchlist',
      handler: 'user-rating.getWatchlist',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/user-ratings/my-ratings',
      handler: 'user-rating.getMyRatings',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'DELETE',
      path: '/user-ratings/remove/:tmdb_id/:content_type/:media_type',
      handler: 'user-rating.removeRating',
      config: {
        policies: [],
        middlewares: [],
      },
    }
  ],
};
