/**
* General Util functions for Content parser
*/

const sanitizeHtml = require('sanitize-html')
const cheerio = require('cheerio')
const url = require('url')

const PROTOCOL_CHECK_REGEX = /^https?:\/\//i
const BANNED_IMG_SRC = [ 'gravatar.com' ]
const ALLOWED_TAGS = [ 'strong', 'p', 'i', 'em', 'br', 'ul', 'li', 'ol' ]
const VIDEO_DOMAINS = ['youtube.com', 'vimeo.com', 'dailymotion.com', 'worldstarhiphop.com']
const REPL_GENIAL_GURU = /genial.guru/i

const LETTERS_ONLY_REGX = /[a-zA-z]/g
const REPLACE_BREAKS_REGX = /\\n|<br\s+\/?>/g

/**
* Takes url string and prefixes it with `http` if not present
* or if auto-detect mode (`//` in front).
*/
const prefixURLwithProtocol = function( url ) {
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

// CONSIDER: relative urls (need to check or not ?)
const isAllowedImgDomain = function( imgUrl, resolvedUrl = false ) {
  if (imgUrl.indexOf('data:') === 0) return false
  return BANNED_IMG_SRC.every(ban => imgUrl.indexOf(ban) === -1)
}

// Simple check for URL being relative or absolute
const isRelativeUrl = function( url ) {
  if ( typeof url !== 'string' ) return false

  url = url.match(/^https?:\/\/|^\/\//i)
  if ( url ) url = url.filter(Boolean)

  return !url
}

const hasClass = function( elem, classes ) {
  return classes.some(cl => elem.hasClass(cl))
}

const isTextTag = function( elem, tags, additional = [] ) {
  tags = tags.concat(additional)
  return tags.some( tag => elem.is(tag) )
}

const isElement = function( elem, selectors ) {
  if ( !selectors.length ) return false
  return selectors.some( selector => elem.is(selector) )
}

const fetchText = function( elem, exclude = [], identifier = [], titletag = false ) {
  let title = false
  exclude.concat(['blockquote', 'li'])

  if ( isElement(elem, exclude) ) return false
  if ( titletag && elem.parents(titletag).length > 0 ) 
    title = true

  let html = elem.html().toLowerCase()
  if ( identifier.some( id => html.indexOf(id.toLowerCase()) !== -1 ) )
    return false

  //empty check
  let p = sanitizeHtml(elem.html(), { allowedTags: ALLOWED_TAGS });
  let text = p.replace(REPLACE_BREAKS_REGX, '').trim()
  if ( !text ) return false

  let $ = cheerio.load("<body></body>");
  $("body").append("<div id='dummy'></div>");
  $("#dummy").append(elem);

  text = sanitizeHtml($("#dummy").html(), { allowedTags: ALLOWED_TAGS })
    .replace(REPL_GENIAL_GURU,"Buenamente.com")
    .replace(REPLACE_BREAKS_REGX, '').trim()

  if ( text ) {
    if ( isElement(elem, ['h1', 'h2', 'h3']) || title )
      return {
        type: "text",
        content: "<h2>" + text + "</h2>"
      }

    if ( titletag ) text = "<p>" + text + "</p>"

    return {
      type: "text",
      content: text
     }
  }
  else return false
}

const textSearch = function( last, text ) {
  let a = text.replace(/<p\/?>/g, '')
  let y = last.search(a)
  let n = escapeRegExp(last).search(escapeRegExp(text))
  return (y > n) ? y : n;
}

function escapeRegExp(str) {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}

const videoParse = function( data ) {
  let og = isNonEmptyArray(data['og:player'])
  let twitter = isNonEmptyArray(data['twitter:player'])
  let daily = isNonEmptyArray(data['og:video'])

  let src = og || twitter || daily
  let iframe='<iframe src="'+ escape(src) +'" width="100%" height="400px" frameborder="0" scrolling="no"></iframe>'

  return {
    type: "html",
    video: encodeURI(src),
    content: iframe 
  }
}

const getDomain = function( sourceUrl ) {
  return url.parse(sourceUrl).hostname.replace('www.', '')
}

const isVideoDomain = function( url ) {
   return VIDEO_DOMAINS.indexOf(getDomain(url)) !== -1 
}

const excludeCoverImage = function( elem, info ) {
  // if has no 'src' or 'data-src' attr
  let src = elem.attr('src') || elem.attr('data-src')
  if ( !src || !isAllowedImgDomain(src, info.url) ) return false

  // in case image url is relative
  if ( isRelativeUrl(src) && info.url )
    src = url.resolve(info.url, src)

  if ( src.indexOf('//') === 0 ) src = 'http:' + src
  // discard tracking pixel
  if ( src.indexOf('//pixel.') !== -1 ) return false

  // exclude the cover image
  if ( src === info.img ) return false

  return {
    type: 'image',
    url: encodeURI(src)
  }
}

function isNonEmptyArray( arr ) {
  if ( Array.isArray(arr) && !arr.length )
    return false

  if ( !arr ) return false

  return arr
}

module.exports = {
  prefixURLwithProtocol,
  isAllowedImgDomain,
  isRelativeUrl,
  hasClass,
  isElement,
  isTextTag,
  fetchText,
  textSearch,
  videoParse,
  getDomain,
  isVideoDomain,
  excludeCoverImage
}
