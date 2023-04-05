/**
 * game service
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreService('api::game.game', ({strapi}) => ({
  async populate (params) {
    console.log('populating')

  }
}));
