/**
 * Custom routes for journal-entry TMDB integration
 */

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/journal-entries/search',
      handler: 'journal-entry.search',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/journal-entries/details/:type/:id',
      handler: 'journal-entry.getDetails',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/journal-entries/create-with-tmdb',
      handler: 'journal-entry.createWithTMDB',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
