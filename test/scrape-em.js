/**
* Scrape Medium once more!
*/
(async function () {
  // taken from /test/simple.js
  const Shameless = require('../src/Shameless.class').default

  // init Shameless object for more complicated use
  const shame = new Shameless

  // initialize scraper that starts scraping from '#intl_homepage1-zone-1' node
  shame.addResource(
    // our scraper defined in the first example
    new Shameless.WebpageScraper('medium-index')
      .addElementParser(['.promo-title', '.promo-subtitle'], (elem, info) => ({
        __name__: 'Main/Subtitle Title',
        value: elem.text().trim()
      }))
  )
  .addResource(
    // scraper for individual post page
    new Shameless.WebpageScraper('medium-post')
      .addElementParser(['.postMetaLockup .avatar-image'], (elem, info) => ({
        name: 'Writer Avatar Image',
        value: elem.attr('src').trim()
      }))

      .addElementParser(['.postMetaLockup .u-flex1 a.link'], (elem, info) => ({
        name: 'Writer Name',
        value: elem.text().trim()
      }))

      .addElementParser(['.postMetaLockup div.postMetaInline'], (elem, info) => ({
        name: 'Writer Summary',
        value: elem.text().trim()
      }))

      .addElementParser(['h1.graf'], (elem, info) => ({
        name: 'Post Title',
        value: elem.text().trim()
      }))
  )

  try {
    const result = await shame
      // .scrape('medium-index', 'https://medium.com/')
      // no ads here, just a good article :D
      .scrape('medium-post', 'https://medium.com/@the1mills/a-better-mutex-for-node-js-4b4897fd9f11')
      .exec()

    console.log(result[0].content)
  } catch (err) {
    console.log(err)
  }
})()
