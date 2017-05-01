/**
* Simple example of scraping CNN Website
*/
(async function () {
  // taken from /test/simple.js
  const Shameless = require('../src/lib/Shameless.class').default

  // initialize scraper that starts scraping from '#intl_homepage1-zone-1' node
  const cnnParser = new Shameless.WebpageScraper('cnn')
    .addElementParser(['.promo-title', '.promo-subtitle'], (elem, info) => ({
      __name__: 'Main/Subtitle Title',
      value: elem.text().trim()
    }))

  // get contents
  const data = await cnnParser.scrape('https://medium.com/')
  console.log(data)
})()

process.on('unhandledRejection', (err, p) => {
  console.log('An unhandledRejection occurred')
  console.log(`Rejected Promise:`, p)
  console.log(`Rejection: ${err}`)
})
