/**
 * Custom routes for coming-soon API
 */

export default {
  routes: [
    {
      method: 'GET',
      path: '/coming-soons/by-period/:period',
      handler: 'coming-soon.getByPeriod',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/coming-soons/most-anticipated',
      handler: 'coming-soon.getMostAnticipated',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/coming-soons/by-genre/:genre',
      handler: 'coming-soon.getByGenre',
      config: {
        policies: [],
        middlewares: [],
      },
    }
  ],
};
