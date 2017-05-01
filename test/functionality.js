/**
* Async func used to call await at top level
*/

(async function() {
  const Shameless = require('../src/lib/Shameless.class').default

  // create base object for further config
  const shame = new Shameless({ dnsFriendly: true })

  // ----------- RESOURCES -------------

  const iogames = new Shameless.WebpageScraper('index', {
    // renderBeforeProcess: true,
    rootNode: 'body',
    exclude: [
      'script',
      'footer',
      '.featured'
    ],

    timeout: 0
  })

  // .addElementParser(['p.desc'], (elem, info) => {
  //   return {
  //     __name__: 'desc-text',
  //     value: elem.text().trim()
  //   }
  // })

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

  shame.addResource([iogames, iogamesGame])

  // ---------------------------------------

  // --------- FORMATTERS --------------

  shame
    .addFormatter(new Shameless.Formatter('empty', input => input.content.map(c => c.value)))
    .addFormatter(new Shameless.Formatter('strip', input => input.map(c => c.slice(0, 20))))

  // ---------------------------------------

  // parse the webpage you've configured
  // try {
  //   console.log(await shame
  //     .scrape('index', ['http://localhost:3000', 'http://localhost:3000/games?game=slitherio'])
  //     .scrape('iogames-game', 'http://localhost:3000/games?game=agario')
  //     .format('empty', 'strip')
  //     .exec())
  // } catch (err) {
  //   console.log("ERR:", err)
  // }

  const websiteScraper = new Shameless.WebsiteScraper('iogames-site')

  // Provide your own way of extracting anchor links from the pages
  // This links will be used to crawl other pages on the website
  websiteScraper.__anchorElementParser__ = {
    selector: ['h3.title'],
    parserFunc: (elem, info) => ({
      __name__: Shameless.WebsiteScraper.ANCHOR_TAG_PARSER_PREFIX,
      value: `http://localhost:3000/games?game=${elem.text().trim().toLowerCase().replace('.', '')}`
    })
  }

  websiteScraper.addWebpageScraper(/^http:\/\/localhost:3000\/?$/, iogames)
  websiteScraper.addWebpageScraper(/^http:\/\/localhost:3000\/games\?game=/, iogamesGame)
  await websiteScraper.scrape('http://localhost:3000', {
    maxDepthLevel: 2,
    maxPages: 5
  })

  console.log(websiteScraper.__tmp_result__.map(r => r.resolved_url))
})()

process.on('unhandledRejection', (err, p) => {
  console.log('An unhandledRejection occurred');
  console.log(`Rejected Promise:`, p);
  console.log(`Rejection: ${err}`);
});
