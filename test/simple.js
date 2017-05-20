/**
* Simple example of scraping CNN Website
*/
(async function () {
  // taken from /test/simple.js
  const Shameless = require('../src/Shameless.class').default

  // initialize scraper that starts scraping from '#intl_homepage1-zone-1' node
  const cnnParser = new Shameless.WebpageScraper('medium')
    .addElementParser(['.promo-title', '.promo-subtitle'], (elem, info) => ({
      __name__: 'Main/Subtitle Title',
      value: elem.text().trim()
    }))

  // get contents
  const data = await cnnParser.scrape('https://medium.com/')
  console.log(data)
})()
