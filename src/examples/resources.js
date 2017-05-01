'use strict;'

const util = require('util')
const Promise = require('bluebird')
const url = require('url')
const escape = require('escape-html')
const sanitizeHtml = require('sanitize-html')
const cheerio = require('cheerio')

const Resource = require('./WebpageParser.class')
const Selector = require('./parser/selector')
const ElementParser = require('./element-parser')
const domains = require('./domains')
const fallbackResource = require('./fallback-resource')
const * as utils = require('./utils')

const BANNED_IMG_SRC = [ 'gravatar.com' ]
const ALLOWED_TAGS = [ 'strong', 'p', 'i', 'em', 'br', 'ul', 'li', 'ol' ]
const TEXT_TAGS = [ 'h1', 'h2', 'h3','h4', 'h5', 'p','ul','ol']
const REPL_GENIAL_GURU = /genial.guru/i
const CHAR_NUM_REGX = /[a-zA-Z0-9]+/i

const VIDEO_SELECTORS = [
  new Selector('og:player', {
    tag     : 'meta[property="og:video:url"]',
    _return : 'content'
  }),
  new Selector('twitter:player', {
    tag     : 'meta[name="twitter:player"]',
    _return : 'content'
  }),
  new Selector('og:video', {
    tag     : 'meta[property="og:video"]',
    _return : 'content'
  })
]

let badabun = Resource.create('badabun', {
    domain: domains.badabun,
    rootNode: '.post-body',
    finalNodes: ['blockquote', 'img'],
    lang: 'es',
    fallback: fallbackResource
  })

  .addElementParser(TEXT_TAGS.concat('span'), function (elem, info) {
    // if no characters present (no words otherwise), ignore the text
    // i.e do not save text with only numbers and punctuation
    let NO_ALPHA_CHARS = /[a-zA-Z]/g
    if ( !NO_ALPHA_CHARS.test(elem.text()) ) return false

    let identifiers = ["Enlaces patrocinados","Recomendados","<br","SUSCRIBIRTE","COMPARTE"]
    return utils.fetchText(elem, undefined, identifiers, "b")
  })


let camaragabo = Resource.create('camaragabo', {
    domain: domains.camaragabo,
    rootNode: '.post-body',
    finalNodes: ['blockquote', 'img', 'span'],
    lang: 'es',
    fallback: fallbackResource
  })

  .addElementParser(TEXT_TAGS.concat('span'), function (elem, info) {
    let identifiers = ["Anuncios","Enlaces patrocinados","Recomendados","<br","SUSCRIBIRTE","COMPARTE"]
    return utils.fetchText(elem, undefined, identifiers, "b")
  })

let cribeo = Resource.create('cribeo', {
    domain: domains.cribeo,
    rootNode: '.story-squeeze',
    excluded: [ '.modal-login' ],
    finalNodes: ['blockquote', 'img', 'h1'],
    lang: 'es',
    fallback: fallbackResource
  })

  .addElementParser(TEXT_TAGS.concat('span'), function (elem, info) {
    // do not save if no numbers and characters present
    if ( !CHAR_NUM_REGX.test(elem.text()) ) return
    return utils.fetchText(elem, [".title"], ["Enlaces de inter"])
  })

let buzzfeed = Resource.create('buzzfeed', {
    domain: domains.buzzfeed,
    rootNode: 'div.bf_dom.c',
    excluded: [
      '.bf_dom.hiden',
      '#buzz_header',
      '.sub_buzz_content__mp4',
      '.js-inline-promo',
      '.buzz-topic-links',
      '.bottom_shares'
    ],
    finalNodes: ['blockquote', 'img'],
    lang: 'en',
    fallback: fallbackResource
  })

  .addElementParser(['img'], function (elem, info) {
    let src = elem.attr('rel:bf_image_src')
    if ( !src || !utils.isAllowedImgDomain(src, info.url) ) return false

    // in case image url is relative
    if ( utils.isRelativeUrl(src) && info.url )
      src = url.resolve(resolvedUrl, src)

    return {
      type: 'image',
      url: encodeURI(src)
    }
  })

  .addElementParser(TEXT_TAGS.concat('.buzz_superlist_number'), function (elem, info) {
    let identifiers = ["View this image","Enter your email"]
    let exclude = [".sub_buzz_grid_source_via", ".article_caption_w_attr", ".print"]
    return utils.fetchText(elem, exclude, identifiers)
  })

  .addElementParser(['.video-embed-big'], function (elem, info) {
    let video
    try {
      // since JSON.parse can throw error
      video = JSON.parse(elem.attr('rel:bf_bucket_data'));
    } catch ( e ) {
      return false
    }

    let videoUrl = video.video ? video.video.url : video.progload_video.url
    if ( !videoUrl ) return false

    if ( videoUrl.indexOf('//') === 0 ) 
      videoUrl = 'http:' + videoUrl

    if ( utils.isVideoDomain(videoUrl) ) {
      let embed = escape(videoUrl.replace('http://', 'https://'))
      let iframe='<iframe src="'+ embed +'" width="100%" height="400px" frameborder="0" scrolling="no"></iframe>'

      return { 
        type: 'html',
        video: encodeURI(videoUrl),
        content: iframe
      }
    }
    else return false
  })

let recreoviral = Resource.create('recreoviral', {
    domain: domains.recreoviral,
    rootNode: '.entry-content',
    finalNodes: ['blockquote', 'img'],
    lang: 'es',
    fallback: fallbackResource
  })

let genialGuru = Resource.create('genial.guru', {
    domain: domains.genialGuru,
    rootNode: '#js-article-content',
    excluded: ['.article__share', '.adme-img-copyright'],
    finalNodes: ['blockquote', 'img'],
    lang: 'es',
    fallback: fallbackResource
  })

  .addElementParser(TEXT_TAGS, function (elem, info) {
    return utils.fetchText(elem, ['.article__share'], ["a gustarte"])
  })

let okchicas = Resource.create('okchicas', {
    domain: domains.okchicas,
    rootNode: '.entry-content',
    excluded: ['.article__share', '.adme-img-copyright'],
    finalNodes: ['blockquote', 'img'],
    lang: 'es',
    fallback: fallbackResource
  })

  .addElementParser(TEXT_TAGS, function (elem, info) {
    return utils.fetchText(elem, undefined, ["data_ad_region"])
  })

let upsocl = Resource.create('upsocl', {
    domain: domains.upsocl,
    rootNode: '.single-texto',
    finalNodes: ['blockquote', 'img'],
    lang: 'es',
    fallback: fallbackResource
  })

let unilad = Resource.create('unilad', {
    domain: domains.unilad,
    rootNode: 'div[itemprop="articleBody"]',
    finalNodes: ['blockquote', 'img'],
    lang: 'en',
    fallback: fallbackResource
  })

let distractify = Resource.create('distractify', {
    domain: domains.distractify,
    rootNode: '.article__content',
    finalNodes: ['blockquote', 'img'],
    lang: 'en',
    fallback: fallbackResource
  })

  .addElementParser(TEXT_TAGS, function (elem, info) {
    return utils.fetchText(elem, undefined, ['sub'])
  })

let boredpanda = Resource.create('boredpanda', {
    domain: domains.boredpanda,
    excluded: [
      '.comment-user-avatar',
      '.post-author',
      '.comment-author-image',
      '.newsletter-form',
      '.post-bottom-meta-links',
      '.open-list-footer',
      '.open-list-comments',
      '.open-list-recent-items',
      '.open-list-pagination',
      '.add-post-short',
      '.append-open-list',
      '#add-new-image',
      '.single-top-ad'
    ],
    rootNode: '.post-content',
    finalNodes: ['blockquote', 'img'],
    lang: 'en',
    fallback: fallbackResource
  })

  .addElementParser(TEXT_TAGS, function (elem, info) {
    return utils.fetchText(elem, ['.title', '.comment-block', '.add-post-short'], ['submission form'])
  })

/**
* Note: not sure whether to fetch
* .entry-sub-title content or not.
*/
let catholic = Resource.create('catholic', {
    domain: domains.catholic,
    excluded: ['.ts-fab-wrapper'],
    rootNode: '.entry-text',
    finalNodes: ['blockquote', 'img'],
    lang: 'es',
    fallback: fallbackResource
  })

  .addElementParser(TEXT_TAGS, function (elem, info) {
    let exclude = ['Anuncios','Enlaces patrocinados','Recomendados','<br', 'SUSCRIBIRTE', 'COMPARTE']
    return utils.fetchText(elem, ['.ts-fab-wrapper'], exclude)
  })

let diply = Resource.create('diply', {
    domain: domains.diply,
    rootNode: '.article-body',
    finalNodes: ['blockquote', 'img'],
    // fetch title manually by providing the selector and parse function that
    // prepends data array with result of its execution
    selectors: [new Selector('postTitle', { css_selector: '#postTitle', _return: 'cheerio' })],
    afterFetchFunc: function (data) {
      if ( data['postTitle'] ) 
        return utils.fetchText(data['postTitle'][0])
    },
    getNextPaginatedPageURL: function () {
      let button = this.$('#bot-next')

      // just regular page, without pagination => quit
      if ( !button ) return false

      let url = button.attr('href') 
      let text = button.attr('alt')

      // cancel if the info is missing or leading to the next post
      if ( !text || text.toLowerCase().trim().indexOf('next post') >= 0 || !url ) 
        return false

      return url
    },
    lang: 'en',
    fallback: fallbackResource
  })

  .addElementParser(['img'], function (elem, info) {
    let src = elem.attr('srcset') || elem.attr('src')
    if ( !src || !utils.isAllowedImgDomain(src, info.url) ) return false

    // in case image url is relative
    if ( utils.isRelativeUrl(src) && info.url )
      src = url.resolve(resolvedUrl, src)

    return {
      type: 'image',
      url: encodeURI(src)
    }
  })

  .addElementParser(TEXT_TAGS, function (elem, info) {
    let exclude = ['ADVERTISEMENT', 'PUBLICIDAD']
    return utils.fetchText(elem, ['.ad-pad-sm', '.center-da'], exclude)
  })


/**
* Remove some adds that are present at
* the bottom.
*/
let dudecomedy = Resource.create('dudecomedy', {
    domain: domains.dudecomedy,
    rootNode: '#content-main',
    excluded: ['.mvp-related-posts', '.mashsb-container', '.mashsb-box', '#rcjsload_32a899', '#rev-flicker', '.rc-wc'],
    finalNodes: ['blockquote', 'img'],
    lang: 'en',
    fallback: fallbackResource
  })

  .addElementParser(TEXT_TAGS, function (elem, info) {
    return utils.fetchText(elem, ['.mvp-related-posts'])
  })

let viralnova = Resource.create('viralnova', {
    domain: domains.viralnova,
    excluded: ['.article-bottom', '.ad-refresh'],
    rootNode: '.post-box-detail',
    finalNodes: ['blockquote', 'img'],
    lang: 'en',
    fallback: fallbackResource
  })

  .addElementParser(TEXT_TAGS, function (elem, info) {
    return utils.fetchText(elem, ['.caption'], ['posted by'])
  })

let brightside = Resource.create('brightside', {
    domain: domains.brightside,
    rootNode: 'article.article',
    finalNodes: ['blockquote', 'img'],
    lang: 'en',
    fallback: fallbackResource
  })

  .addElementParser(TEXT_TAGS, function (elem, info) {
    return utils.fetchText(elem, ['.article__share', '.adme-img-copyright'])
  })

  .addElementParser(['.js-youtube-iframe-loader'], function (elem, info) {
    let link = elem.attr('data-video-id')
    if ( !link ) return false

    let videoUrl = 'https://www.youtube.com/watch?v=' + link
    let embed = escape(videoUrl.replace('http://', 'https://'))
    let iframe='<iframe src="'+ embed +'" width="100%" height="400px" frameborder="0" scrolling="no"></iframe>'

    return {
      type: 'html',
      video: link,
      content: iframe  
    }
  })

let debryanshowmx = Resource.create('debryanshowmx', {
    domain: domains.debryanshowmx,
    rootNode: '.post-body',
    finalNodes: ['blockquote', 'img', 'span'],
    lang: 'es',
    fallback: fallbackResource
  })

  .addElementParser(TEXT_TAGS.concat(['span']), function (elem, info) {
    let exclude = ['Anuncios', 'Enlaces patrocinados', 'Recomendados', '<br','SUSCRIBIRTE', 'COMPARTE', 'COMPÁRTELO']
    return utils.fetchText(elem, undefined, exclude, 'b')
  })

let lavozdelmuro = Resource.create('lavozdelmuro', {
    domain: domains.lavozdelmuro,
    rootNode: '.contentContainer',
    finalNodes: ['blockquote', 'img', 'span'],
    excluded: ['.adsbygoogle', '.authorAvatar'],
    selectors: [new Selector('videoWrapper', { css_selector: '.videoWrapper>iframe', _return: 'cheerio' })],
    afterFetchFunc: function (data, info) {
      if ( !data['videoWrapper'] || !data['videoWrapper'].length ) return false
      let elem = data['videoWrapper'][0]
      let src = elem.attribs['src'] || elem.attribs['data-src']

      // in case image url is relative
      if ( utils.isRelativeUrl(src) && info.url )
        src = url.resolve(info.url, src)

      if ( src.indexOf('//') === 0 ) 
        src = 'http:' + src

      let iframe='<iframe src="'+ escape(src.replace('http:', 'https:')) 
        +'" width="100%" height="400px" frameborder="0" scrolling="no"></iframe>'

      return { 
        type: 'html',
        video: encodeURI(src),
        content: iframe
      }
    },
    lang: 'es',
    fallback: fallbackResource
  })

// consult about blockquotes in http://sobadsogood.com/2016/01/29/10-most-liked-facebook-posts-week/
let sobadsogood = Resource.create('sobadsogood', {
    domain: domains.sobadsogood,
    rootNode: '.story-body',
    finalNodes: ['blockquote', 'img', 'span', '.fb-post'],
    lang: 'en',
    fallback: fallbackResource
  })

let littlethings = Resource.create('littlethings', {
    domain: domains.littlethings,
    // rootNode: '.mainContentIntro',
    rootNode: '.post-media',
    finalNodes: ['blockquote', 'img', 'span'],
    excluded: [
      '#lt_postcontent_ad', 
      'div[id*="google_ads_iframe"]',
      '.facebook-share-above-video',
      '#single_social_buttons_holder',
      'img.ratio',
      '.articleDetails',
      '.post-title',
      '.pinterest-icon',
      '.lt_logo',
      'img.lt-logo'
    ],
    lang: 'en',
    fallback: fallbackResource
  })

  /**
  * In this source video embed link is places inside the js code right 
  * at the end of the player html
  */
  .addElementParser(['.video-container script'], function (elem, info) {
    let reg = /<iframe\s*src=[\"\'](.*?)[\"\']/i
    let src = reg.exec(elem.text())

    // exit if no embed url found
    if ( !src || src.length < 1 ) return false
    src = src[1]

    // in case url is relative
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

  .addElementParser(['.recipe-conclusion'], function (elem, info) {
    return utils.fetchText(elem, undefined, [], 'b')
  })

// With pagination
let paraloscuriosos = Resource.create('paraloscuriosos', {
    domain: domains.paraloscuriosos,
    rootNode: '.article-page-content',
    finalNodes: ['blockquote', 'img', 'span', '.fb-post'],
    lang: 'es',
    getNextPaginatedPageURL: function () {
      let next = this.$('.articles-pagination .next a')
      if ( !next ) return false
      return next.attr('href') 
    },
    fallback: fallbackResource
  })

let vozprofeta = Resource.create('vozprofeta', {
    domain: domains.vozprofeta,
    rootNode: '.post-body',
    finalNodes: ['blockquote', 'img'],
    excluded: [
      '#adsense-1',
      '.uk-article-title + div img'
    ],
    lang: 'es',
    fallback: fallbackResource
  })

  .addElementParser(['span'], function (elem, info) {
    // do not parse `span` children of `span`
    if ( elem.parents('span').length ) return false
    return utils.fetchText(elem, undefined, [], 'b')
  })

  .addElementParser(['img'], utils.excludeCoverImage)

// Video Resources
let youtube = Resource.create('youtube', {
    domain: domains.youtube,
    selectors: VIDEO_SELECTORS,
    afterFetchFunc: utils.videoParse,
    traverseDOM: false
})

let vimeo = Resource.create('vimeo', {
    domain: domains.vimeo,
    selectors: VIDEO_SELECTORS,
    afterFetchFunc: utils.videoParse, 
    traverseDOM: false
})

let dailymotion = Resource.create('dailymotion', {
    domain: domains.dailymotion,
    selectors: VIDEO_SELECTORS,
    afterFetchFunc: utils.videoParse, 
    traverseDOM: false
})

export default [ 
  badabun,
  camaragabo,
  cribeo,
  youtube,
  vimeo,
  dailymotion,
  buzzfeed,
  recreoviral,
  genialGuru,
  okchicas,
  upsocl,
  unilad,
  distractify,
  boredpanda,
  catholic,
  diply,
  dudecomedy,
  viralnova,
  brightside,
  debryanshowmx,
  lavozdelmuro,
  sobadsogood,
  littlethings,
  paraloscuriosos,
  vozprofeta
]
