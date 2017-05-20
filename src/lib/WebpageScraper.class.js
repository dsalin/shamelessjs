'use strict'

const URL = require('url')
const Promise = require('bluebird')
const _ = require('lodash')

const Parser = require('./parser/parser')
const Selector = require('./parser/selector')
const ElementParser = require('./element-parser')
const Settings = require('./settings')
const Translator = require('./translate')
const utils = require('./utils')

const REPL_SPACE = /\s+/g

/**
* Default constructor
* Necessary fields for options:
*   1. name - name of the WebpageParser
*   2. domain - the domain address of the resource to fetch data from
*   3. rootNode - the node at which to start DFS traversing
*   4. elementParsers - [ElementParser] - an object that parses specific
*     html elements with provided parser function
*     Format: {
*       selectors: ['a', '.fb-post', 'p' ...], - any css selector
*         (will be applied to .is('selector') function when checking)
*       parser: function( elem ) {} - parses supported element from elements array
*     }
*   5. selectors - Selector objects for the general Parser object to get page content
*
* @constructor
*/
class WebpageScraper {
  // constructor
  constructor( name, options = {} ) {
    this.name     = name
    this.rootNode = options.rootNode || 'body'

    // supported tags'/selectors names + parsers for
    // each of this tags/selectors
    this.elementParsers = options.elementParsers || []
    this.withMetaInfo   = options.withMetaInfo || true
    this.excluded       = options.excluded || []
    this.fallback       = options.fallback || null
    this.traverseDOM    = true
    this.lang           = options.lang || false
    this.timeout        = options.timeout || 0
    // HTML Nodes at which parsing shall stop
    this.finalNodes     = options.finalNodes || []
    // is called on self.data after Parser fetched the document
    this.afterFetchFunc = options.afterFetchFunc || null

    // use phantom renderer before getting any content from the page
    this.renderBeforeProcess = options.renderBeforeProcess || false

    // func to find next paginated page URL when resource is multipage
    // or return FALSE when no next page found
    this.getNextPaginatedPageURL = options.getNextPaginatedPageURL || null

    // used when Parser initial fetch with
    // custom selectors is enough
    if ( options.traverseDOM === false )
      this.traverseDOM = false

    // setup Parser obj for info retrieval
    // with default meta selectors, page stats and cheerio
    this.parser = Parser.create({
      defaultSelectors: this.withMetaInfo,
      noStats: false,
      cheerio: true,
      // rawData: true
    })
    .setRequestDefaults({ headers: Settings.DEFAULT_PARSER_HEADERS })

    this.parser.selectors = this.parser.selectors.concat(options.selectors || [])
    this.data = null
  }

  /*
  * Fetches the content of resource pages and parses them
  * according to specified parser function,
  * returning the resulting data object
  *
  * @return {obj}
  *   Object with parsed data
  */
  fetch( url, translate = false ) {
    let self = this
    self.url = url

    if ( !url && !_.isString(url) )
      throw new Error('[WebpageScraper] No url provided')

    return new Promise((resolve, reject) => {
      if ( self.timeout > 0 ) setTimeout(() => {
        if ( !self.renderBeforeProcess ) {
          // get page parsed content
          self.parser.fetch( self.url )
            .then(result => {
              self.parse(result)
              return resolve(self.data);
            })
            .catch(err => reject(err))
        }
        // rendering is required
        else {
          self.parser.fetchRenderedPage(self.url)
            .then(result => {
              // sync function
              self.parse(result)
              return resolve(self.data);
            })
            .catch(err => reject(err))
        }
      }, self.timeout)

      else {
        if ( !self.renderBeforeProcess ) {
          // get page parsed content
          self.parser.fetch( self.url )
            .then(result => {
              self.parse(result)
              return resolve(self.data);
            })
            .catch(err => reject(err))
        }
        // rendering is required
        else {
          self.parser.fetchRenderedPage(self.url)
            .then(result => {
              // sync function
              self.parse(result)
              return resolve(self.data);
            })
            .catch(err => reject(err))
        }
      }
    })
  }

  /**
  * Traverse the DOM in DFS manner starting
  * from the root element and apply
  * parsers to each node according to supported tags/elements
  */
  traverse( $, curr, level ) {
    let self = this
    let children = curr.children()
    let tmp

    // do not continue if element is invisible or excluded
    if ( self.isExcluded(curr) ) return

    // all the parsers that support this particular element
    let parsers = self.elementParsers.filter(parser => parser.supports(curr))
    // use fallback resource if current one does not have necessary parsers
    if ( !parsers.length && self.fallback )
      parsers = self.fallback.elementParsers.filter(parser => parser.supports(curr))

    // apply these parsers to curr html element
    if ( parsers.length ) {
      tmp = parsers.map(parser => parser.parse($(curr), self.$))
        .filter(Boolean) // since all functions return data obj or false

      if ( tmp.length ) self.data.content.push(tmp)
    }

    // do not continue on leaf and if is final Node
    if ( !children || utils.isElement(curr, self.finalNodes) ) return

    ++level // track the current DOM level

    // traverse the children recursively using DFS
    children.each( (i, child) => self.traverse($, $(child), level) )
  }

  parse( data ) {
    let $       = data.__cheerio__
    let current = $(this.rootNode).first()

    this.$ = $ // make it available for plugins
    this.data = {}

    // Meta data (copy all)
    Object.keys(data).forEach(k => {
      if ( k !== '__cheerio__' )
        this.data[k] = data[k]
    })

    // this.data.image   = encodeURI(data.image)
    this.data.url     = encodeURI(data.resolved_url)
    this.data.content = []

    if ( this.afterFetchFunc )
      this.data.content.push(this.afterFetchFunc(data, { url: this.data.url }))

    // apply filters using DFS
    if ( this.traverseDOM && $ && current )
      this.traverse($, current, 0)

    // remove empty arrays
    this.data.content = _.flatten(this.data.content.filter(Boolean))
  }

  static elemIsInvisible( elem ) {
    let style = elem.attr('style')

    if ( elem.css('display') !== 'none' || !style ) return false
    return style.replace(REPL_SPACE, '').indexOf('display:none') !== -1
  }

  isExcluded( elem ) {
    return this.excluded.some(e => elem.is(e))
  }

  // recursive function to parse paginated pages
  paginatePages( url, translate, content = null ) {
    let self = this

    return new Promise(function (resolve, reject) {
      // not the first call (recursive)
      if ( content ) {
        // resolve the url if relative
        url = URL.resolve(self.data.url, url)
        self.fetch(url, translate)  
          .then(data => {
            content.content = content.content.concat(data.content)
            url = self.getNextPaginatedPageURL()

            // stop if no more pages
            if ( !url ) return resolve(content)
            return resolve(self.paginatePages(url, translate, content))
          })
          .catch(err => reject(err))
      } 
      // fetch the first page (first call)
      else {
        self.fetch(url, translate) 
          .then(data => {
            content = data
            url = self.getNextPaginatedPageURL()

            // stop if no more pages
            if ( !url ) return resolve(content)
            return resolve(self.paginatePages(url, translate, content))
          })
          .catch(err => reject(err))
      }
    })
  }

  isPagination() {
    return typeof this.getNextPaginatedPageURL === 'function'
  }

  addSelector( name, options ) {
    this.parser.selectors.push(new Selector(name, options))
    return this
  }

  addElementParser( selectors, parser ) {
    this.elementParsers.push(ElementParser.create(selectors, parser))
    return this
  }

  // -------------- Convenience Methods -------------
  static create( name, options ) {
    return new WebpageParser(name, options)
  }
}

// convenience alias
WebpageScraper.prototype.scrape = WebpageScraper.prototype.fetch

module.exports = WebpageScraper
