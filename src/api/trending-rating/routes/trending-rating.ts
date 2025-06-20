/**
 * trending-rating router
 */

export default {
  routes: [
    {
      method: 'GET',
      path: '/trending-ratings',
      handler: 'trending-rating.find',
    },
    {
      method: 'GET',
      path: '/trending-ratings/:id',
      handler: 'trending-rating.findOne',
    },
    {
      method: 'POST',
      path: '/trending-ratings',
      handler: 'trending-rating.create',
    },
    {
      method: 'PUT',
      path: '/trending-ratings/:id',
      handler: 'trending-rating.update',
    },
    {
      method: 'DELETE',
      path: '/trending-ratings/:id',
      handler: 'trending-rating.delete',
    },
  ],
};
