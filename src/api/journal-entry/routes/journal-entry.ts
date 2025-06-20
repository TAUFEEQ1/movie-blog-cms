/**
 * journal-entry router
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::journal-entry.journal-entry', {
  config: {
    find: {
      middlewares: [],
    },
    findOne: {
      middlewares: [],
    },
    create: {
      middlewares: [],
    },
    update: {
      middlewares: [],
    },
    delete: {
      middlewares: [],
    },
  },
});
