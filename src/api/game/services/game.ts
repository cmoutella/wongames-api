/**
 * game service
 */

const axios = require('axios');
const slugify = require('slugify');
import { factories } from '@strapi/strapi';

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
  const releaseDate = dom.window.document.querySelector('div[content-summary-section-id="productDetails"] > .details > div:nth-child(4) > div.details__content.table__row-content')
  const genre = dom.window.document.querySelector('div[content-summary-section-id="productDetails"] > .details > div:nth-child(1) > div.details__content.table__row-content')
  const company = dom.window.document.querySelector('div[content-summary-section-id="productDetails"] > .details > div:nth-child(5) > div.details__content.table__row-content')

  const companies = cleanArray(company.textContent.split('\n'))
  const publisher = companies[companies.length - 1]
  const developer = companies.filter(i => i !== publisher)

  return {
    rating: 'FREE',
    shortDescription: description.textContent.slice(0,160),
    description: description.innerHTML,
    releaseDate: (cleanDate(releaseDate.textContent)[1]),
    genres: cleanArray(genre.textContent.split('\n')),
    publisher: publisher,
    developer: developer
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
    const productData = product
    if (productData?.url) {
      let {genres, publisher, developer} = await getGameInfo(productData.url)

      genres?.forEach(genre =>
        categories[genre] = true
      )
      developer && developer.forEach(dev => {
        developers[dev] = true
      })
      publishers[publisher] = true
    }

    if (productData?.worksOn) {
      const os = handleOperationalSystems(productData.worksOn)
      os && os.forEach(item => {
        platforms[item] = true
      })
    }
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


export default factories.createCoreService('api::game.game', ({strapi}) => ({
  async populate (params) {
    console.log('populating')
    const gogApiUrl = `https://menu.gog.com/v1/store/configuration?locale=en-US&currency=BRL&country=BR`
    const products = []
    const {data} = await axios.get(gogApiUrl)

    for (const category in data) {
      let cat = data[category]
      if (!!cat.products) {
        cat.products.forEach(product => products.push(product))
      }
    }

    await createManyToManyData([products[0], products[1], products[2], products[3], products[4], products[5], , products[6]])

    console.log('/populating')
  }
}));
