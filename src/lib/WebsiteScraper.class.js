/**
* Class for aggregating WebpageScrapers and
* parsing web content as a whole.
* In addition, provides broader settings functionality.
*
* Parser initially fetches the index page and gradually
* travels to all the pages on the website, for which the
* Webpage Parser is provided and its url is successfully tested
* by the regular expression, attached to Webpage Parser.
* 
* @class
*/

const SHAMELESS_ANCHOR_TAG_PARSER_PREFIX = '__SHAMELESS_ANCHOR_TAG__'

/*
* Element Parser used to decorate supplied user parsers for crawling purposes.
* This parser determines how Shameless should get list of links from a page in
* order to continue the crawling process.
*/
const anchorElementParser = {
  selector: ['a'],
  parserFunc: (elem, info) => ({
    __name__: SHAMELESS_ANCHOR_TAG_PARSER_PREFIX,
    value: elem.attr('href').trim()
  })
}

class WebsiteScraper {
  constructor( name = 'default' ) {
    this.name = name
    this.__pageScrapers__ = {}
    this.__pageRegx__ = {}
    this.__anchorElementParser__ = anchorElementParser

    // TODO: not sure if this is a good idea, probably not :D
    this.__visited__ = []
    this.__tmp_result__ = []
    this.__scrape_count__ = 0
  }

  clearCache() {
    this.__visited__ = []
    this.__tmp_result__ = []
    this.__scrape_count__ = 0
  }

  async scrape ( url, options = {}, depth = 0 ) {
    console.log('Scrape: depth:', depth, 'pages: ', this.__scrape_count__, options, url)
    const {
      maxPages = Number.POSITIVE_INFINITY,
      maxDepthLevel = Number.POSITIVE_INFINITY
    } = options

    let tmpScraper, scraper

    // index page is being parsed, i.e parsing just started
    if ( depth === 0 ) {
      this.clearCache()
      // check for the index page (starting point for scrape/crawl)
      scraper = this.__pageScrapers__['index']
      if ( !scraper ) throw new Error(`[${this.name}] No Scraper for index page found`)
    }
    else {
      scraper = this.getPageScraper(url)
      if ( !scraper ) throw new Error(`[${this.name}] No Scraper for page ${url} found`)
    }

    const scrapeResult = await scraper.scrape(url)
    this.__tmp_result__.push(scrapeResult)
    depth++, this.__scrape_count__++

    // check if we reached the scrape boundaries
    if ( depth >= maxDepthLevel || this.__scrape_count__ >= maxPages ) return

    // recursively start scraping other pages
    const links = WebsiteScraper.extractCrawlLinks(scrapeResult)
    const nextLevelData = []
    for ( let i = 0; i < links.length; i += 1 ) {
      if ( this.__scrape_count__ + i < maxPages ) {
        nextLevelData.push(this.scrape(links[i], options, depth))
      }
      else break
    }
    return await Promise.all(nextLevelData)
  }

  addWebpageScraper( regx, scraper, anchorElementParser = null ) {
    // augment index parser with anchor tags parser in order to
    // continue parsing the website
    WebsiteScraper.decorateWithAnchorParser(
      scraper, anchorElementParser || this.__anchorElementParser__
    )

    if ( scraper.name === 'index' ) {
      this.__pageScrapers__['index'] = scraper
      this.__pageRegx__['index'] = regx
    }
    else {
      this.__pageScrapers__[scraper.name] = scraper
      this.__pageRegx__[scraper.name] = regx
    }

    return this
  }

  getPageScraper( url ) {
    const regxNames = Object.keys(this.__pageRegx__)

    for ( let i = 0; i < regxNames.length; i += 1 )
      if ( this.__pageRegx__[regxNames[i]].test(url) )
        return this.__pageScrapers__[regxNames[i]]

    return null
  }

  static extractCrawlLinks({ content = null }) {
    // TODO: should this be an error?
    if ( !content )
      throw new Error(`[WebsiteScraper] No 'content' field in scraped result`)

    return content
      .filter(c => c.__name__ === SHAMELESS_ANCHOR_TAG_PARSER_PREFIX)
      .map(c => c.value)
  }

  // add Anchor Element parser to every supplied parser object
  static decorateWithAnchorParser( parser, { selector, parserFunc } ) {
    parser.addElementParser(selector, parserFunc)
  }

  static create( name, pageScrapers ) {
    return new WebsiteScraper(name, pageScrapers)
  }
}

// convenience alias
WebsiteScraper.prototype.fetch = WebsiteScraper.prototype.scrape
WebsiteScraper.ANCHOR_TAG_PARSER_PREFIX = SHAMELESS_ANCHOR_TAG_PARSER_PREFIX

module.exports = WebsiteScraper
