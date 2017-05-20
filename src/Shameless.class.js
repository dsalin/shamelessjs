/**
* General class that aggregates all functionality
* provided in order to parse websites
* 
* @class @index
*/

const _ = require('lodash')

const Logger = require('./lib/Logger.class')
const WebsiteScraper = require('./lib/WebsiteScraper.class')
const WebpageScraper = require('./lib/WebpageScraper.class')
const Formatter = require('./lib/Formatter.class')

// -------- Setup Constants ---------
const DNS_FRIENDLY = true
const DETAILED_LOGS = false
const DEFAULT_FILE_PATH = './'

class Shameless {
  constructor( options = {} ) {
    this._formatters = {}
    // collection of Website/Webpage Parsers (Resources)
    this._resources = {}
    this._templates = {}
    this.defaultResource = null

    // place to store the tmp result of whatever
    // operation was performed
    this.__raw_cache__ = null
    // used to save tmp results of formatters,
    // since they can be executed in sequence
    this.__format_cache__ = null
    // cache of required sequence of operations
    this.__tmp_operations__ = {
      scrape: [],
      format: []
    }

    this.setup(options)
  }

  setup ( options ) {
    const {
      dnsFriendly = DNS_FRIENDLY,
      detailedLogs = DETAILED_LOGS,
      filePath = DEFAULT_FILE_PATH
    } = options
  }

  async exec() {
    const { scrape, format } = this.__tmp_operations__
    let tmp

    if ( !scrape.length )
      throw new Error('[Shameless] No Scrapers to execute')

    // scrape all resources in parallel
    const _scraped = await Promise.all(_.map(scrape, s => this._scrape(s.rname, s.url)))

    // flatten all values in case arrays were passed to scrape
    const scraped = []
    for ( let i = 0; i < _scraped.length; i += 1 ) {
      tmp = _scraped[i]

      if ( !_.isArray(tmp) ) {
        scraped.push(tmp)
        continue
      }

      for ( let j = 0; j < tmp.length; j += 1 )
        scraped.push(tmp[j])
    }

    if ( !format.length ) return scraped
    // apply a pipeline of transformers
    const result = _.map(scraped, s => format.reduce((prev, curr) => this.applyFormatter(curr, prev), s))

    // clear all unnecessary cache
    this.clearCache()
    return result
  }

  scrape( rname, url ) {
    if ( !this._resources[rname] )
      throw new Error(`Resource with the name '${rname}' does not exist`)

    this.__tmp_operations__.scrape.push({ rname, url })
    return this
  }

  async _scrape( rname, url ) {
    if ( _.isArray(url) )
      return await Promise.all(_.map(url, u => this._scrape(rname, u)))

    return await this._resources[rname].scrape(url)
  }

  applyFormatter( formatter, data ) {
    // formatter object is passed
    if ( _.isObject(formatter) && !_.isString(formatter) )
      return formatter.format(data)

    // formatter is a string => find it in saved formatter collection
    if ( !this._formatters[formatter] )
      throw new Error(`Formatter with the name '${formatter} does not exist`)

    return this._formatters[formatter].format(data)
  }

  format( ...formatters ) {
    this.__tmp_operations__.format = formatters
    return this
  }

  // get the contents of the last scrape operation
  get value() {
    return this.__raw_cache__
  }

  // get the contents of the last scrape operation
  get formatted() {
    return this.__format_cache__
  }

  clearCache() {
    this.__raw_cache__ = null
    this.__format_cache__ = null
    this.__tmp_operations__ = {
      scrape: [],
      format: []
    }
  }

  addResource( parser ) {
    if ( _.isArray(parser) )
      _.forEach(parser, p => this._resources[p.name] = p)
    else this._resources[parser.name] = parser

    return this
  }

  addFormatter( formatter ) {
    this._formatters[formatter.name] = formatter
    return this
  }
}

Shameless.WebpageScraper = WebpageScraper
Shameless.WebsiteScraper = WebsiteScraper
Shameless.Formatter = Formatter
Shameless.prototype.parse = Shameless.prototype.scrape

module.exports = {
  default: Shameless,
  WebsiteScraper,
  WebpageScraper,
  Formatter
}
