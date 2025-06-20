/**
 * trending router
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::trending.trending', {
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
    }
  }
});
