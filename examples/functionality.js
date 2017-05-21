/**
* Async func used to call await at top level
*/

(async function() {
  const Shameless = require('../src/Shameless.class').default
  // create base object for further config
  const shame = new Shameless

  // ----------- RESOURCES -------------

  const iogames = new Shameless.WebpageScraper('index')
    .addelementparser(['h3.title'], (elem, info) => ({
      __name__: 'index game title',
      value: elem.text().trim()
    }))

  const iogamesGame = new Shameless.WebpageScraper('iogames-game')
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

  // Formatters just take your input and produce output in a pipelined fashion
  shame
    .addFormatter(new Shameless.Formatter('empty', input => input.content.map(c => c.value)))
    .addFormatter(new Shameless.Formatter('strip', input => input.map(c => c.slice(0, 20))))

  // parse the webpage you've configured
  try {
    console.log(await shame
      .scrape('index', ['http://iogames.network', 'http://iogames.network/games?game=slitherio'])
      .scrape('iogames-game', 'http://iogames.network/games?game=agario')

      // Formatters just take your input and produce output in a pipelined fashion
      // Therefore, empty filter will execute, produce an output and pass this output to `strip` filter
      .format('empty', 'strip')
      .exec())
  } catch (err) {
    console.log("ERR:", err)
  }
})()

process.on('unhandledRejection', (err, p) => {
  console.log('An unhandledRejection occurred');
  console.log(`Rejected Promise:`, p);
  console.log(`Rejection: ${err}`);
});
