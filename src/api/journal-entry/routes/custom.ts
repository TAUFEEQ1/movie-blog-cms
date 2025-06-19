/**
 * Custom routes for journal-entry TMDB integration
 */

export default {
  routes: [
    {
      method: 'GET',
      path: '/journal-entries/tmdb/search',
      handler: 'journal-entry.search',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/journal-entries/tmdb/details/:type/:id',
      handler: 'journal-entry.getDetails',
      config: {
        auth: false,
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
