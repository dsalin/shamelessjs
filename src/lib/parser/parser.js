'use strict'

const util = require('util')
const request = require('request')
const _ = require('lodash')
const Promise = require('bluebird')
const cheerio = require('cheerio')
const validator = require('validator')

// custom Error object
const ParserError = require('./parser-error')
const Selector = require('./selector')
const PhantomRender = require('../phantom/phantom-render')

// default time limit for data
// recieving and parsing
const TIME_LIMIT_DEFAULT = 30000
// default maximumtime limit for data
const MAX_TIME_LIMIT = 30000

// default data size of the page (kb)
const DATA_SIZE_DEFAULT = 1000
// default maximum data size of the page (kb)
const MAX_DATA_SIZE = 4000

// default number of request redirects
const NUM_OF_REDIRECTS_DEFAULT = 5
// maximum number of request redirects
const MAX_NUM_OF_REDIRECTS = 10

// Settings for request making ONLY
// Does not contain internal module settings
const REQUEST_DEFAULTS = {
  timeout  : TIME_LIMIT_DEFAULT,
  method   : 'GET',
  encoding : 'utf8',
  maxRedirects : NUM_OF_REDIRECTS_DEFAULT
}

// Internal module settings
// Not passed to request
const SETTINGS = {
  // maximum response size (in kb)
  maxDataSize : DATA_SIZE_DEFAULT,
  timeLimit   : TIME_LIMIT_DEFAULT,
  expectResponseTypeNames : 'all'
}

/**
 * Parser constructor.
 * Multiple parsers with different settings can be created
 * to extract different data sets.
 *
 * @constructor
*/
function Parser( options ) {
  let _options = {}

  // shallow copy of default settings
  this.settings        = util._extend({}, SETTINGS)
  this.requestDefaults = util._extend({}, REQUEST_DEFAULTS)
  // temporary data obj, mainly used for restoring settings,
  // if some should be applied for one request only
  this.tmp  = {}

  if ( options ) {
    // set global fetch options before sending any request
    // whether to use default selectors or not
    _options.defaultSelectors = options.defaultSelectors
    // whether or not to fetch just the html content of the page
    this.rawData = options.rawData  || null
    this.noStats = options.noStats  || null
    this.cheerio = options.cheerio  || null
    this.settings.returnBuffer = options.returnBuffer  || null
  }

  if ( _options.defaultSelectors !== false )
    _options.defaultSelectors = true

  if ( this.returnBuffer )
    this.requestDefaults.encoding = null

  if ( !_options.defaultSelectors )
    // no default selectors
    this.selectors = []
  else
    // copy default selectors
    this.selectors = Selector.DEFAULT.slice()

  // add passed custom options
  this.setup(options)
}

// convenience method for creating Parsers
Parser.create = function ( options ) {
  return new Parser(options)
}

/**
* Configures Parser object according to
* options passed in CLIENT request
*
* @param {object} options
*
* @return {null}
*/
Parser.prototype.setup = function ( options ) {
  let self = this
    , defaults = {}
    , requestSettings = {}
    , selector = {}

  // options may be empty
  if ( !options || !Object.keys(options).length )
    return

  for ( let option in options ) {
    // skip if no value
    if ( !options[option] )
      continue

    switch ( option ) {
      case 'followRedirects':
        requestSettings['maxRedirects'] = options[option]
        break
      case 'expectResponseTypeNames':
        defaults['expectResponseTypeNames'] = options[option]
        break
      case 'timeout':
        // set them equal until strict separation needed
        defaults['timeLimit'] = options[option]
        requestSettings['timeout'] = options[option]
        break
      case 'maxDataSize':
        defaults[option] = options[option]
        break
      case 'css_selector':
        selector[option] = options[option]
        break
      case '_return':
        selector[option] = options[option]
        break
      default:
        break
    } // switch
  } // for end

  // set default settings, if present
  if ( Object.keys(defaults).length )
    self.setSettings(defaults)

  // set request settings, if present
  if ( Object.keys(requestSettings).length )
    self.setRequestDefaults(requestSettings)

  // add selector, if present
  if ( Object.keys(selector).length )
    self.extendSelectors('custom', selector)
}

// main parser object
// TODO: agree on whether using or not using promises
Parser.prototype.fetchpage = function( url ) {
  // settings
  let TIME_LIMIT             = this.settings.timeLimit
    , ENCODING               = this.requestDefaults.encoding
    , MAX_DATA_SIZE          = this.settings.maxDataSize
    , REQUEST_DEFAULTS_LOCAL = this.requestDefaults
      // bind getMeta to current this obj
    , getMetaSelf            = Parser.prototype.getMeta.bind(this)
    // return raw data as Buffer
    , RETURN_BUFFER          = this.settings.returnBuffer
    , buffers                = []
    , self                   = this

  return new Promise(function (resolve, reject) {
    // defaults
    var size = 0
      , html = ''
      , error = false
      , meta = {}
      , _response
      , timeOut

    url = prefixURLwithProtocol(url)
    // check for valid url
    if ( !url || !validator.isURL(url) ) {
      error = new ParserError.Unknown()
      return reject(error)
    }

    // Controll the timing
    timeOut = setTimeout(function () {
      error = new ParserError.Timeout()
      // close sream if response's already recieved
      // otherwise, response timeout error will be fired
      if ( _response )
        _response.destroy()
    }, TIME_LIMIT)

    request( url, REQUEST_DEFAULTS_LOCAL )
      // response arrives, without actual html content
      .on('response',function (response) {
        _response = response

        // Check headers
        switch (response.statusCode) {
          case 200:
            break
          case 404:
            error = new ParserError._404()
            response.destroy()
            return
          case 403:
            error = new ParserError.Unknown()
            response.destroy()
            return
          default:
            error = new ParserError.Unknown()
            response.destroy()
            return
        }

        if ( !self.checkResponseType(response.headers['content-type']) ) {
          error = new ParserError.Mismatch()
          response.destroy()
          return
        }

        // handle response body
        response.on('data',function (chunk) {
          if ( !RETURN_BUFFER ) {
            chunk = chunk.toString( ENCODING )
            html  += chunk
          } else
            buffers.push(chunk)

          size  += toKiloBytes(chunk)

          if ( size > MAX_DATA_SIZE ) {
            error = new ParserError.TooLarge()
            response.destroy()
            return
          }
        })
      }) // request.on('response') end
      .on('close', function (err) {
        clearTimeout(timeOut)

        self.restore()
        return reject(error)
      })
      .on('error', function (err) {
        clearTimeout(timeOut)

        switch (err.code) {
          case 'ETIMEDOUT':
            error = new ParserError.Timeout()
            break
          default:
            error = new ParserError.Unknown()
            break
        }

        self.restore()
        return reject(error)
      })
      // all data is fetched or data limit error
      .on('end', function () {
        // proceed to 'close' event
        if ( error ) return

        // check if page's custom info needs to be fetched
        if ( !self.rawData ) {
          meta = getMetaSelf(html, self.cheerio)
          // check if cheerio threw an error
          if ( !meta ) {
            error = new ParserError.Unknown()
            clearTimeout(timeOut)
            return reject(error)
          }
        }
        else {
          if ( RETURN_BUFFER )
            meta.raw = Buffer.concat(buffers)
          else
            // get only html content
            meta.raw = html
        }

        // if stats are needed
        if ( !self.noStats ) {
          meta.status = 'ok'
          meta.page_size = '~' + Math.round(size) + 'kb'
          meta.resolved_url = _response.request.href
        }

        meta.contentType = _response.headers['content-type']
        clearTimeout(timeOut)

        // restore prev state, if singular actions exist
        self.restore()
        return resolve(meta)
      })
  }) // Promise
}

Parser.prototype.fetchRenderedPage = function ( url ) {
      // bind getMeta to current this obj
  let getMetaSelf = Parser.prototype.getMeta.bind(this)
    , self        = this

  return new Promise((resolve, reject) => {
    // defaults
    let meta = {}

    url = prefixURLwithProtocol(url)
    // check for valid url
    if ( !url || !validator.isURL(url) ) {
      error = new ParserError.Unknown()
      return reject(error)
    }

    PhantomRender(url)
      .then(html => {
        // check if page's custom info needs to be fetched
        if ( !self.rawData ) {
          meta = getMetaSelf(html, self.cheerio)
          // check if cheerio threw an error
          if ( !meta ) {
            error = new ParserError.Unknown()
            return reject(error)
          }
        }
        else meta.raw = html

        // if stats are needed
        if ( !self.noStats ) {
          meta.status = 'ok'
          meta.page_size = '~' + Math.round(toKiloBytes(html)) + 'kb'
          meta.resolved_url = url
        }

        // restore prev state, if singular actions exist
        self.restore()
        return resolve(meta)
      })
      .catch(err => reject(err))
  })
}

/**
* Sets request settings
*
* @param {obj} settings
*   Format :
*   { settings_name : settings_value }
*   ex. :
*     { timeout : 3000 }
*
* @return {function}
*   fetchpage func for chaining
*/
Parser.prototype.setRequestDefaults = function ( settings ) {
  if ( typeof settings !== "object" )
    throw new Error('Settings type should be an object.')

  for ( let set in settings ) {
    if ( !settings.hasOwnProperty(set) )
      continue

    // timeout should not be larger than global time limit
    if ( set === 'timeout' && settings.timeout > this.settings.timeLimit )
      this.settings.timeLimit = settings.timeout
    // check num of redirects
    if ( set === 'maxRedirects' && (settings[set] < 1 || settings[set] > MAX_NUM_OF_REDIRECTS) ) {
      this.requestDefaults[set] = NUM_OF_REDIRECTS_DEFAULT
      continue
    }

    this.requestDefaults[set] = settings[set]
  }

  return this
}

/**
* Removes a setting from requestDefaults settings obj
*
* @param {string} name
*   Setting name to be removed
*/
Parser.prototype.removeRequestDefaults = function ( name ) {
  if ( this.requestDefaults[name] ) {
    switch (name) {
      // these properties should not be deleted
      case 'timeout':
        this.requestDefaults.timeout = this.settings.timeLimit
        break
      // all `deletable` properties
      default:
        delete this.requestDefaults[name]
        break
    }
  }

  return this
}

/**
* Sets internal settings for the module
*
* @param {obj} settings
*   Format :
*   { settings_name : settings_value }
*   ex. :
*     { maxDataSize : 300 }
*
* @return {function}
*   fetchpage func for chaining
*/
Parser.prototype.setSettings = function ( settings ) {
  if ( typeof settings !== "object" )
    throw new Error('Settings type should be an object.')

  for ( let set in settings ) {
    if ( !settings.hasOwnProperty(set) )
      continue

    if ( set == 'timeLimit' ) {
      // check boundaries
      if ( settings[set] < 0 || settings[set] > MAX_TIME_LIMIT )
        this.requestDefaults.timeLimit = TIME_LIMIT_DEFAULT
      // timeout should not be larger than global time limit
      if ( settings[set] < this.requestDefaults.timeout )
        this.requestDefaults.timeout = settings[set]
    }

    // check maxDataSize boundaries
    if ( set === 'maxDataSize' && (settings[set] < 0 || settings[set] > MAX_DATA_SIZE) ) {
      this.requestDefaults[set] = DATA_SIZE_DEFAULT
      continue
    }

    // check maxDataSize boundaries
    if ( set === 'expectResponseTypeNames'  ) {
      this.settings.expectResponseTypeNames = setResponseType(settings[set])
      continue
    }

    // check maxDataSize boundaries
    if ( set === 'returnBuffer'  )
      this.setRequestDefaults({ encoding: null })

    this.settings[set] = settings[set]
  }

  return this
}

/**
* Removes particular setting from fetchpage.settings completely.
*
* @param {string} name
*   Setting name to be removed
*/
Parser.prototype.removeSetting = function ( name ) {
  if ( this.settings[name] ) {
    switch (name) {
      // these properties should not be deleted
      case 'maxDataSize':
        this.settings.maxDataSize = DATA_SIZE_DEFAULT
        break
       case 'timeLimit':
        this.settings.timeLimit = TIME_LIMIT_DEFAULT
         break
      // all `deletable` properties
      default:
        delete this.settings[name]
        break
    }
  }

  return this
}

/**
* Resets all the settings to their initial state
* and removes those that are not required by default
*/
Parser.prototype.resetSettings = function () {
  let def = ['maxDataSize', 'timeLimit', 'expectResponseTypeNames']
  // reset required settings
  this.settings.maxDataSize = DATA_SIZE_DEFAULT
  this.settings.timeLimit   = TIME_LIMIT_DEFAULT
  this.settings.expectResponseTypeNames  = 'all'

  // remove all applied settings, except required
  for ( let setting in this.settings ) {
    // skip required
    if ( def.indexOf(setting) !== -1 )
      continue

    delete this.settings[setting]
  }

  return this
}

/**
* Resets all the request settings to their initial state
* and removes those that are not required by default
*/
Parser.prototype.resetRequestDefaults = function () {
  let def = ['timeout', 'method', 'encoding', 'maxRedirects']
  // reset required settings
  this.requestDefaults.timeout      = TIME_LIMIT_DEFAULT
  this.requestDefaults.method       = REQUEST_DEFAULTS.method
  this.requestDefaults.encoding     = REQUEST_DEFAULTS.encoding
  this.requestDefaults.maxRedirects = REQUEST_DEFAULTS.maxRedirects

  // remove all applied settings, except required
  for ( let setting in this.requestDefaults ) {
    // skip required
    if ( def.indexOf(setting) !== -1 )
      continue

    delete this.requestDefaults[setting]
  }

  return this
}

/**
* Check wither selector with given name exists
*
* @param {string} name
*   Selector group name
*
* @return {false/int}
*  False if no such Selector, index otherwise
*/
Parser.prototype.findSelector = function (name) {
  let len = this.selectors.length

  for ( let i = 0; i < len; i += 1 ) {
    if ( this.selectors[i].name === name )
      return i
  }

  return false
}

/**
* Adds properties to existing selectors
* by checking selector's name or
* adds a new selector based on the options given
*
* @param {string} name
*  Selector group name
*
* @param {obj} options
*   Options object to extend/create a selector
*
* @return {null}
*/
Parser.prototype.extendSelectors = function ( name, options ) {
  let self = this, option
  let index = self.findSelector(name)

  if ( index !== false ) {
     for ( option in options )
       self.selectors[index][option] = options[option]
  }
  // create a new Selector
  else {
    // _property attr is set only in 'Meta' parsers
    if ( _.isObject(options) && options._property )
      self.selectors.push( new Selector.Meta(name, options) )
    else
      self.selectors.push( new Selector(name, options) )
  }

  return this
}

/**
* Removes selector by name provided,
* or removes a part of the selector if 'options' param provided
*
* @param {string} name (required)
*   Selector group name
*
* @param {obj} options (optional)
*   Narrowed options to remove from selctor
*
* @return {boolean/func}
*   False if no such selector,
*   this otherwise
*/
Parser.prototype.removeSelectors = function (name, options) {
  let index = this.findSelector(name)
  if ( index === false )
    return false

  // if remove only some of the prop
  if ( options ) {
    _.each(options, function (option) {
      delete this.selectors[index][option]
    })
  }
  // remove the whole selector
  else
    this.selectors.splice(index, 1)

  return this
}

/**
* Checks `content-type` of data returned by the response aacording to the
* `expectResponseTypeNames  property (default: `all`)
*
* @param {string} type
*   Content-type string retuned by response
*
* @return {boolean}
*   True if returned contetn-type matches the specified type
*   False otherwise
*/
Parser.prototype.checkResponseType = function ( type ) {
  // match all the types
  if ( this.settings.expectResponseTypeNames === 'all' )
    return true

  return this.settings.expectResponseTypeNames.some( a => type.indexOf(a) !== -1 )
}

/**
* Restore previous state of the Parser if
* singular actions were defined
*/
Parser.prototype.restore = function () {
  let settings = this.settings

  if ( settings.expectResponseTypeSingular ) {
    this.settings.expectResponseTypeNames = this.tmp.expectResponseTypesLast.slice()
    this.settings.expectResponseTypeSingular = false
    delete this.tmp.expectResponseTypesLast
  }
}

Parser.prototype.expectResponseType = function ( type, once = false ) {
  let typeNames = this.settings.expectResponseTypeNames

  // indicates whether this specific response type check
  // should be done for one response only
  this.settings.expectResponseTypeSingular = once

  if ( once )
    // backup data for restoring
    this.tmp.expectResponseTypesLast =
      ( _.isArray(typeNames) ) ? typeNames.slice() : typeNames

  this.settings.expectResponseTypeNames = setResponseType(type)
  return this
}

/**
* Used to check for specific response type for the SPECIFIC REQUEST,
* meaning that for subsequent request old settings will be restored
* To expect response data type for all request of this Parser, use
* setSettings({ expectResponseTypeNames : ['whatever'] }) instead
*
* @param {string} type
*   String representing expected response content-type
*/
Parser.prototype.expectResponseTypeOnce = function ( type ) {
  this.expectResponseType(type, true)
  return this
}


// Convenience alias to the fetchpage func
Parser.prototype.fetch = Parser.prototype.fetchpage

/**
* Gets meta information required in
* fetchpage.selectors and returns info obj
*
* @param {string} html
*   HTML string (response body) to be parsed
*
* @return {obj}
*   Object with all required info
*/
Parser.prototype.getMeta = function( html, includeCheerio = false ) {
  let selectors = this.selectors
    , len       = this.selectors.length
    , info      = {}
    , dataName  = ''
    , i         = 0
    , j         = 0
    , data
    , tmp
    , selectorNum
    , cssSelectors
    , selector
    , $

  // check parsing
  try {
    $ = cheerio.load(html, { normalizeWhitespace : true })
  } catch (e) {
    return false
  }

  if ( includeCheerio ) info.__cheerio__ = $

  // iterate through attached selectors
  for ( ; i < len; i += 1 ) {
    selector     = selectors[i]
    cssSelectors = selector.cssSelectors

    // single cssSelector for Selector object
    if ( _.isString(cssSelectors) && !info[selector.name] ) {
      data = $(cssSelectors)
      info[selector.name] = []
      data.each(function (i, elem) {
        if ( tmp = getGeneralData($(this), selector._return) )
          info[selector.name].push( tmp )
      })

      if ( info[selector.name].length === 1 )
        info[selector.name] = info[selector.name][0]
    }
    // Multiple Css selectors for currently processed selector
    else {
      selectorNum  = selector.cssSelectors.length
      const prefix = selector.name + ':'

      for ( j = 0; j < selectorNum; j += 1 ) {
        // General Selector used
        if ( !selector.isMeta() ) {
          // do not override data
          if ( info[selector.name] ) continue

          data           = $(cssSelectors[j])
          dataName       = selector.name + '_' + j
          info[dataName] = []

          data.each(function (i, elem) {
            if ( tmp = getGeneralData($(this), selector._return) )
              info[dataName].push( tmp )
          })
        }
        // Meta Selector used
        else {
          dataName = Object.keys(cssSelectors[j])[0]
          if ( data = getMetaData($, cssSelectors[j][dataName], selector._return) )
            info[prefix + dataName] = data
        }
      }
    }
  } // outer for

  return info
}

/************* HELPER METHODS **************/

function getMetaData( $, selector, _return ) {
  var val = ( _return === 'text' )
            ? $(selector).text()
            : $(selector).attr(_return)

  return (val) ? trimText( val ) : null
}

function getGeneralData( elem, _return ) {
  if ( _return === 'html' )
    return elem.html()

  else if ( _return === 'cheerio' )
    return elem

  var val =  ( _return === 'text' )
             ? elem.text()
             : elem.attr(_return)

  return (val) ? trimText( val ) : null
}

// Groups of content-type names for convenience
const CONTENT_TYPE_GROUPS = {
  video : [
    'video/x-flv',
    'video/mp4',
    'application/x-mpegURL',
    'video/MP2T',
    'video/3gpp',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-ms-wmv'
  ],
  xml : [
    'text/xml',
    'application/xml'
  ],
  image : [
    'image/bmp',
    'image/cis-cod',
    'image/gif',
    'image/ief',
    'image/jpeg',
    'image/png',
    // JPEG file interchange format
    'image/pipeg',
    'image/svg+xml',
    'image/tiff',
    'image/x-cmu-raster',
    'image/x-cmu-raster',
    'image/x-cmu-raster',
    'image/x-portable-anymap',
    'image/x-portable-bitmap',
    'image/x-portable-graymap',
    'image/x-portable-graymap',
    'image/x-rgb',
    'image/x-xbitmap',
    'image/x-xpixmap'
  ],
  text : [
    'text/css',
    'text/html',
    'text/plain',
    'text/richtext',
    'text/webviewhtml',
    'text/x-component'
  ],
  json : [
    'application/json',
    'application/javascript'
  ]
}

// NOTE: Experimental feature
function setResponseType( type ) {
  let result = []

  // if array of expected types returned =>
  // get all of the types and merge them into single arr
  if ( Array.isArray(type) ) {
    type.forEach( t => {
      result = result.concat(setResponseType(t))
    })

    return result
  }

  if ( typeof type === 'string' ) {
    // convenience aliases for the response type
    switch ( type ) {
      case 'video':
        return CONTENT_TYPE_GROUPS.video
      case 'image':
        return CONTENT_TYPE_GROUPS.image
      case 'text':
        return CONTENT_TYPE_GROUPS.text
      case 'xml':
        return CONTENT_TYPE_GROUPS.xml
      case 'json':
        return CONTENT_TYPE_GROUPS.json
      case 'all':
        return 'all'
      default:
        return [type]
    }
  }
  // Error on invalid type
  throw new Error('setResponseType: Invalid type passed')
}

function trimText( str ) {
  return str.replace(/^\s\s*/, '').replace(/\s\s*$/, '')
}

// Returns string size rounded in KB
function toKiloBytes( str ) {
  return Buffer.byteLength(str, 'utf8') / 1024
}

// Checks whether Content-Type header
// contains 'text/html' value
function isHtmlResponse( header ) {
  return header.match(/text\/html/) !== null
}

const PROTOCOL_CHECK_REGEX = /^https?:\/\//i
/**
* Takes url string and prefixes it with `http` if not present
* or if auto-detect mode (`//` in front).
*/
function prefixURLwithProtocol( url ) {
  if ( !url ) return false

  url = url.trim()
  // prefix with 'http://' if no protocol present
  if ( !PROTOCOL_CHECK_REGEX.test(url) ) {
    // add 'http:' if url is in auto-detect protocol format
    if ( url.indexOf('//') === 0 )
      return 'http:' + url
    return 'http://' + url
  }

  return url
}

module.exports = Parser
