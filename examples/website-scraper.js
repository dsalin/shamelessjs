/**
* Async func used to call await at top level
*/

(async function() {
  const fs = require('fs')
  const Shameless = require('../src/Shameless.class').default

  // ----------- RESOURCES -------------
  const websiteScraper = new Shameless.WebsiteScraper('iogames-site')

  // Provide your own way of extracting anchor links from the pages
  // This links will be used to crawl other pages on the website
  websiteScraper.__anchorElementParser__ = {
    selector: ['h3.title'],
    parserFunc: (elem, info) => ({
      __name__: Shameless.WebsiteScraper.ANCHOR_TAG_PARSER_PREFIX,
      value: `http://iogames.network/games?game=${elem.text().trim().toLowerCase().replace('.', '')}`
    })
  }

  const iogamesGame = new Shameless.WebpageScraper('iogames-game', {
    // renderBeforeProcess: true,
    rootNode: 'body',
    exclude: [
      'script',
      'footer',
      '.featured'
    ],

    timeout: 1000
  })

  .addElementParser(['p.desc'], (elem, info) => ({
    __name__: 'desc-text',
    value: elem.text().trim()
  }))

  .addElementParser(['h1.title'], (elem, info) => ({
    __name__: 'Game Title',
    value: elem.text().trim()
  }))

  .addElementParser(['.promo-img img'], (elem, info) => ({
    __name__: 'Game Img',
    value: elem.attr('src').trim()
  }))


  websiteScraper.addWebpageScraper(/^http:\/\/iogames.network\/?$/, new Shameless.WebpageScraper('home'))
  websiteScraper.addWebpageScraper(/^http:\/\/iogames.network\/games\?game=/, iogamesGame)

  await websiteScraper.scrape('http://iogames.network', {
    maxDepthLevel: 2,
    maxPages: 5
  })
  console.log('Result: ', websiteScraper.__tmp_result__)
  fs.writeFileSync('./result.json', JSON.stringify(websiteScraper.__tmp_result__, null, 2))
})()

process.on('unhandledRejection', (err, p) => {
  console.log('An unhandledRejection occurred');
  console.log(`Rejected Promise:`, p);
  console.log(`Rejection: ${err}`);
});
