'use strict;'

const util = require('util')
const Promise = require('bluebird')
const url = require('url')
const escape = require('escape-html')
const sanitizeHtml = require('sanitize-html')
const cheerio = require('cheerio')

const Resource = require('./WebpageParser.class')
const ElementParser = require('./element-parser')
const domains = require('./domains')
const utils = require('./utils')

const BANNED_IMG_SRC = [ 'gravatar.com' ]
const ALLOWED_TAGS = ['strong', 'p', 'i', 'em', 'br', 'ul', 'li', 'ol']
const TEXT_TAGS = ['h1', 'h2', 'h3', 'h4', 'h5', 'p', 'ul', 'ol']

let fallbackResource = Resource.create('fallback', {
    domain: false, // default
    rootNode: 'body',
    finalNodes: ['blockquote', 'img']
  })

  .addElementParser(['img'], function (elem, info) {
    // if has no 'src' or 'data-src' attr
    let src = elem.attr('src') || elem.attr('data-src')
    if ( !src || !utils.isAllowedImgDomain(src, info.url) ) return false

    // in case image url is relative
    if ( utils.isRelativeUrl(src) && info.url )
      src = url.resolve(info.url, src)

    if ( src.indexOf('//') === 0 ) src = 'http:' + src
    // discard tracking pixel
    if ( src.indexOf('//pixel.') !== -1 ) return false

    return {
      type: 'image',
      url: encodeURI(src)
    }
  })

  .addElementParser(['iframe'], function (elem, info) {
    let src = elem.attr('src') || elem.attr('data-src')
    // in case image url is relative
    if ( utils.isRelativeUrl(src) && info.url )
      src = url.resolve(info.url, src)

    let iframe='<iframe src="'+ escape(src.replace('http:', 'https:')) 
      +'" width="100%" height="400px" frameborder="0" scrolling="no"></iframe>'

    return { 
      type: 'html',
      video: encodeURI(src),
      content: iframe
    }
  })

  .addElementParser(['blockquote', '.tumblr-post'], function (elem, info) {
    if ( utils.hasClass(elem, ['twitter-tweet', 'instagram-media', 'tumblr-post', 'bf-tweet']) ) {
      let script = elem.next()
      if ( !script.is('script') ) script = null

      let $ = cheerio.load("<div id='dummy'></div>")
      $("#dummy").append(elem);

      if ( script ) {
        $("#dummy").append(script);
        return { 
          type: "html",
          content: $("#dummy").html()
        }
      }
      else {
        let html = $('#dummy').html()

        if ( elem.hasClass('instagram-media') )
          script = '<script async defer src="//platform.instagram.com/en_US/embeds.js"></script>'
        else {
          html = html.replace('bf-tweet', 'twitter-tweet')
          script = '<script src="//platform.twitter.com/widgets.js" async="" charset="utf-8"></script>'
        }
        html = html + script

        return { 
          type: 'html',
          content: html
        }
      }
    } // if hasClass
    
    else {
      let text = sanitizeHtml(elem.html(), { allowedTags: ALLOWED_TAGS }).trim()
      if ( text ) return {
          type: "text",
          content: "<blockquote>" + text + "</blockquote>"
        }

      else return false
    }
  })

  .addElementParser(['.fb-post'], function (elem, info) {
    return '<div id="fb-root"></div><script>(function(d, s, id) {  var js, fjs = d.getElementsByTagName(s)[0];  if (d.getElementById(id)) return;  js = d.createElement(s); js.id = id;  js.src = "//connect.facebook.net/en_GB/sdk.js#xfbml=1&version=v2.3";  fjs.parentNode.insertBefore(js, fjs);}(document, "script", "facebook-jssdk"));</script><div class="fb-post" data-href="'+ elem.attr('data-href') +'" data-width="500"><div class="fb-xfbml-parse-ignore">';
  })

  .addElementParser(TEXT_TAGS, function (elem, info) {
    return utils.fetchText(elem)
  })

module.exports = fallbackResource
