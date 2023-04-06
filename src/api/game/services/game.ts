/**
 * game service
 */

const axios = require('axios');
const slugify = require('slugify');
import { factories } from '@strapi/strapi';
import { format } from 'fecha'

function cleanArray (arr) {
  const cleaned = arr.map(item => item.trim())
                     .filter(item => item !== '/')
                     .filter(item => item !== '-')
                     .filter(item => item !== '')

  return cleaned
}

function cleanDate (string) {
  return string.split("'")
}

function handleOperationalSystems (worksOn) {
  const availableOs = []
  const atts = Object.keys(worksOn)
  atts.forEach(os => {
    if (worksOn[os]) {
      availableOs.push(os)
    }
  })

  return availableOs
}

async function getGameInfo (slug) {
  const jsdom = require('jsdom')
  const {JSDOM} = jsdom
  const body = await axios.get(`https://www.gog.com/${slug}`)
  const dom = new JSDOM(body.data)

  const description = dom.window.document.querySelector('.description')

  return {
    rating: 'FREE',
    shortDescription: description.textContent.slice(0,160),
    description: description.innerHTML,
  }
}

async function getByName (name, entity) {
  const found = await strapi.entityService.findMany(`api::${entity}.${entity}`, {
    filters: {name: name,}
  });

  return found.length ? found[0] : null
}

async function create (name, entity) {
  const item = await getByName(name, entity)

  if (!item) {
    await strapi.entityService.create(`api::${entity}.${entity}`, {
          data: {
            name: name,
            slug: slugify(name, { lower: true })
          },
        });

  }
}

async function getManyToManyData (products) {
  const developers = {}
  const publishers = {}
  const categories = {}
  const platforms = {}

  for (const product of products) {
    const {genres, developer, publisher,  supportedOperatingSystems} = product

    genres?.forEach(genre =>
      categories[genre] = true
    )
    supportedOperatingSystems.forEach(item => {
      platforms[item] = true
    })
    developers[developer] = true
    publishers[publisher] = true
  }

  return {developers, publishers, categories, platforms}
}

async function createManyToManyData(products) {
  const {developers, publishers, categories, platforms} = await getManyToManyData(products)

  return Promise.all([
    ...Object.keys(publishers).map(publisher => create(publisher, 'publisher')),
    ...Object.keys(categories).map(category => create(category, 'category')),
    ...Object.keys(developers).map(developer => create(developer, 'developer')),
    ...Object.keys(platforms).map(platform => create(platform, 'platform'))
  ])

}

async function getRelations(list, entity) {
  const relations = await Promise.all(list.map(async item => {
    const related = await getByName(item, entity)
    return related?.id
  }))

  return relations
}

async function getRelation (name, entity) {
  const publisher = await getByName(name, entity)

  return [publisher?.id]
}

async function compileGameData (product, productData) {
  const data = {
    name: product.title,
    slug: product.slug,
    short_description: productData?.shortDescription || '',
    description: productData?.description || '',
    price: product.price.amount,
    release_date: product.releaseDate ? format(new Date(product.releaseDate), 'isoDate') : null,
    rating: productData?.rating || 'FREE',
    category: {
      connect: await getRelations(product.genres, 'category')
    },
    platform: {connect: await getRelations(product.supportedOperatingSystems, 'platform')},
    developer: {connect: await getRelation(product.developer, 'developer')},
    publisher: {connect: await getRelation(product.publisher, 'publisher')},
  }

  return data
}

async function createGames(products) {
  await Promise.all(products?.map(async product => {
    const item = await getByName(product.title, 'game')

    if (!item) {
      const gameData = product.url ? await getGameInfo(product.url) : null

      const game = await strapi.entityService.create(`api::game.game`, {
        data: await compileGameData(product, gameData),
      });
      return game
    }
  }))
}

export default factories.createCoreService('api::game.game', ({strapi}) => ({
  async populate (params) {
    console.log('populating')
    const gogApiUrl = `https://www.gog.com/games/ajax/filtered?mediaType=game&page=1&sort=popularity`
    const {data: {products}} = await axios.get(gogApiUrl)

    await createGames([products[7], products[8], products[9], products[10], products[11], products[12]])

    console.log('/populating')
  }
}));
