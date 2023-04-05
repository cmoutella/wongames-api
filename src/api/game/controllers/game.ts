/**
 * game controller
 */

import { factories } from '@strapi/strapi'

export default factories.createCoreController('api::game.game', ({strapi}) => ({
  async populate(ctx) {
    try {
      await strapi.service('api::game.game').populate();
    } catch (err) {
      ctx.body = err;
    }
  },
}));
