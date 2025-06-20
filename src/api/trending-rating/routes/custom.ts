/**
 * Custom routes for trending ratings
 */

export default {
  routes: [
    {
      method: 'POST',
      path: '/trending-ratings/rate',
      handler: 'trending-rating.rate',
      config: {
        auth: true,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/trending-ratings/my-rating/:tmdb_id/:type',
      handler: 'trending-rating.getMyRating',
      config: {
        auth: true,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/trending-ratings/notable',
      handler: 'trending-rating.getNotable',
      config: {
        auth: true,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/trending-ratings/unfavorable',
      handler: 'trending-rating.getUnfavorable',
      config: {
        auth: true,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/trending-ratings/my-ratings',
      handler: 'trending-rating.getMyRatings',
      config: {
        auth: true,
        policies: [],
        middlewares: [],
      },
    },
  ],
};
