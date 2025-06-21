/**
 * Custom routes for journal-entry TMDB integration
 */

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/journal-entries/tmdb/search',
      handler: 'journal-entry.search',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/journal-entries/tmdb/details/:type/:id',
      handler: 'journal-entry.getDetails',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/journal-entries/tmdb/trailer/:type/:id',
      handler: 'journal-entry.getTrailer',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/journal-entries/tmdb/create',
      handler: 'journal-entry.createFromTMDB',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
