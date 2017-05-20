# Shameless.js - simple website scraper for NodeJS

![Shameless.js Img](https://github.com/dsalin/shamelessjs/blob/master/shameless.jpeg)

It might appear as a 'another' webpage parser/scraper/whatever you want to call it. However, `Shameless.js`
aims to provide a complete tool for scraping not just individual pages, but complete websites.

**Important Note:** Shameless is still in development and not fully tested yet.

## Table of contents

- [Basic Usage](#basic-usage)
- [Scrape em all!](#scrape-em-all)
    - [Webpage Scraper](#webpage-scraper)
    - [Wesite Scraper](#wesite-scraper)
    - [Shameless Object](#shameless-object)
- [Transformers](#transformers)
- [Template Parsers](#template-parsers)
- [Some Important Details](#some-important-details)
- [Future](#future)

## Basic Usage

Lets take a simple example by getting Promo Title and Subtitle of Medium main page:

```js
// taken from /test/simple.js
const Shameless = require('../src/lib/Shameless.class').default

// initialize scraper that starts scraping from '#intl_homepage1-zone-1' node
const mediumScraper = new Shameless.WebpageScraper('medium-index')
  .addElementParser(['.promo-title', '.promo-subtitle'], (elem, info) => ({
    name: 'Main/Subtitle Title',
    value: elem.text().trim()
  }))

// get contents
const data = await mediumScraper.scrape('https://medium.com/')
console.log(data)
```

What you will see is something like this:

```js
{ 'og:description': 'Welcome to Medium, a place to read, write, and interact with the stories that matter most to you. Every day, thousands of voices read, write, and share important stories on Medium.',
  'og:title': 'Medium – Read, write and share stories that matter',
  'og:url': 'https://medium.com/',
  'og:site_name': 'Medium',
  'twitter:description': 'Welcome to Medium, a place to read, write, and interact with the stories that matter most to you. Every day, thousands of voices read, write, and share important stories on Medium.',
  'twitter:site': '@Medium',
  'general:description': 'Welcome to Medium, a place to read, write, and interact with the stories that matter most to you. Every day, thousands of voices read, write, and share important stories on Medium.',
  title: 'Medium – Read, write and share stories that matter',
  lang: [],
  status: 'ok',
  page_size: '~509kb',
  resolved_url: 'https://medium.com/',
  contentType: 'text/html; charset=utf-8',
  url: 'https://medium.com/',
  content:
   [ { name: 'Main/Subtitle Title',
       value: 'Stories that move with you.' },
     { name: 'Main/Subtitle Title',
       value: 'An app designed for readers on the go.' } ] }
```

As you can see, we have page's **metadata** as well as the **`content`**.
`Content` is an array of the parsed results, according to rules you have specified in `mediumScraper.addElementParser`.

## Scrape em all!

So, before going into the detail of how particular things work, lets just scrape Medium once more!
This might seem a bit long, but bare with me here, it is very intuitive.
Now we will grab author name, avatar, short summary about the writer and the title of the post:

```js
  // taken from /test/scrape-em.js
  const Shameless = require('../src/Shameless.class').default

  // scraper for individual post page
  const scraper = new Shameless.WebpageScraper('medium-post')
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

    // no ads here, just a good article :D
    const result = await scraper.scrape('medium-post', 'https://medium.com/@the1mills/a-better-mutex-for-node-js-4b4897fd9f11')
    console.log(result.content)
```

And this is the desired output:

```js
[ { name: 'Writer Avatar Image',
    value: 'https://cdn-images-1.medium.com/fit/c/60/60/0*Q4vMIJQlz1dXen9K.jpeg' },
  { name: 'Writer Name', value: 'Alex Mills' },
  { name: 'Writer Summary',
    value: 'Programmer. Soccer, bicycle, and 90\'s hip hop enthusiast. Likes movies about music, stand-up comedy. Pronounces LaTeX latex and Technics technicks.' },
  { name: 'Writer Summary', value: 'Jan 28' },
  { name: 'Post Title', value: 'A better mutex for Node.js' } ]
```

Note that all the meta tags are preserved in the `result` object, similar to first example.

**Great**, now that we have seen some examples, it is time to get into details and more advanced use cases.

### Webpage Scraper

`Shameless` has 2 types of scrapers: `Webpage Scraper (Shameless.WebpageScraper)` and `Website Scraper (Shameless.WebsiteScraper)`.
`Webpage Scraper` just scrapes one url with the predefined rules. Let us take a simple example from the beginning of
this doc:

```js
// taken from /test/simple.js
const Shameless = require('../src/lib/Shameless.class').default

// initialize scraper that starts scraping from '#intl_homepage1-zone-1' node
const mediumScraper = new Shameless.WebpageScraper('medium-index')
  .addElementParser(['.promo-title', '.promo-subtitle'], (elem, info) => ({
    name: 'Main/Subtitle Title',
    value: elem.text().trim()
  }))

// get contents
const data = await mediumScraper.scrape('https://medium.com/')
console.log(data)
```

Here we import `Shameless` and create a `WebpageScraper`, giving it a name (Reason why you should give a name is
discussed later in **Website Scraper** section. So, for the simple case, you may omit it).

And the result is: 

```js
{ 'og:description': 'Welcome to Medium, a place to read, write, and interact with the stories that matter most to you. Every day, thousands of voices read, write, and share important stories on Medium.',
  'og:title': 'Medium – Read, write and share stories that matter',
  'og:url': 'https://medium.com/',
  'og:site_name': 'Medium',
  'twitter:description': 'Welcome to Medium, a place to read, write, and interact with the stories that matter most to you. Every day, thousands of voices read, write, and share important stories on Medium.',
  'twitter:site': '@Medium',
  'general:description': 'Welcome to Medium, a place to read, write, and interact with the stories that matter most to you. Every day, thousands of voices read, write, and share important stories on Medium.',
  title: 'Medium – Read, write and share stories that matter',
  lang: [],
  status: 'ok',
  page_size: '~509kb',
  resolved_url: 'https://medium.com/',
  contentType: 'text/html; charset=utf-8',
  url: 'https://medium.com/',
  content:
   [ { name: 'Main/Subtitle Title',
       value: 'Stories that move with you.' },
     { name: 'Main/Subtitle Title',
       value: 'An app designed for readers on the go.' } ] }
```

**By default**, `WebpageScraper` will not parse the `body` tag of the page. It will only return some **meta info** about it,
with an empty `content` field. Like this (again, from our very first example):

```js
{
  'og:description': 'Welcome to Medium, a place to read ...',
  'og:title': 'Medium – Read, write and share stories that matter',
  'og:url': 'https://medium.com/',
  'og:site_name': 'Medium',
  'twitter:description': 'Welcome to Medium, a place to read ...',
  'twitter:site': '@Medium',
  'general:description': 'Welcome to Medium, a place to read ...',
  title: 'Medium – Read, write and share stories that matter',
  lang: [],
  status: 'ok',
  page_size: '~509kb',
  resolved_url: 'https://medium.com/',
  contentType: 'text/html; charset=utf-8',
  url: 'https://medium.com/',
  content: [] 
}
```

Now lets dive deeper into how and what you can configure with `WebpageParser`.

#### new WebpageParser( name, options )

**name**(`string`) - name of the resource you parse with this parser<br/>
**options**(`object`) - config object


**Options** object is very important and contains the following fields:

**`rootNode`** (string): css selector of the node from which parsing should start<br/>
**`excluded`** (array[string]): array of css selectors of elements that should be ignored while parsing<br/>
**`finalNodes`** (array[string]): array of css selectors that should not be inspected further. Children of that html element will not be parsed individually if their parent matches at least one of provided selectors<br/>
**`timeout`** (number - in Milliseconds): delay before starting the request<br/>
**`getNextPaginatedPageURL`** (function): function that is responsible for fetching url of the next pagination in order to continue parsing the page<br/>
**`fallback`** (WebsiteParser): a parser that will be called if the current one cannot parse the DOM element. This model is useful for defining template parsers and extend them when you need.<br/>

```js
  /*
  * Full example of all possible options
  */
  new Shameless.WebpageScraper('default', {
    rootNode: '.article-body', // start parsing from this node
    finalNodes: ['blockquote', 'img'], // do not continue parsing children of these nodes

    // fetch title manually by providing the selector and parse function that
    // prepends data array with result of its execution
    selectors: [new Selector('postTitle', { css_selector: '#postTitle', _return: 'cheerio' })],
    // this function will have `postTitle` value inside its data parameter
    // `cheerio` field is a cheerio object for this element, so that you can
    // fetch info more easily
    afterFetchFunc: function (data) {
      if ( data['postTitle'] ) 
        return utils.fetchText(data['postTitle'][0])
    },

    // func to find next paginated page URL when resource is multipage
    // or return FALSE when no next page found
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

    // what scraper to use on elements for which current
    // scraper did not provide `elementParser` (useful for generic scrapers)
    fallback: fallbackScraper,
    timeout: 0
  })
```

This was long, I have to admit that. However, it is extremely important to have in place, since all other functionalities of **`Shameless`** are based on **`WebpageScraper`** and, essentially, are just extensions of it.

### Website Scraper

This type of scraper is taking advantage of **`WebpageScraper`** with some additional options.
Essentially, **`WebsiteScraper`** just takes several **`WebpageScrapers`** and applies them to the website as a whole, not just individual pages. Therefore, you can scrape the whole website if you provide necessary configuration.

First of all, lets have some quick example of that before we proceed to the details.
This time we'll scrape `iogames.network`, since its content is server-side generated, so we don't have
any possible problems with `js` generated content:

```js
const fs = require('fs')
const Shameless = require('../src/Shameless.class').default

// ----------- RESOURCES -------------
const websiteScraper = new Shameless.WebsiteScraper('iogames-site')

// Provide your own way of extracting anchor links from the pages
// This links will be used to crawl other pages on the website
websiteScraper.__anchorElementParser__ = {
  selector: ['h3.title'],
  parserFunc: (elem, info) => ({
    __name__: Shameless.WebsiteScraper.ANCHOR_TAG_PARSER_PREFIX,
    value: `http://iogames.network/games?game=${elem.text().trim().toLowerCase().replace('.', '')}`
  })
}

const iogamesGame = new Shameless.WebpageScraper('iogames-game', {
  // renderBeforeProcess: true,
  rootNode: 'body',
  exclude: [
    'script',
    'footer',
    '.featured'
  ],

  timeout: 1000
})

.addElementParser(['p.desc'], (elem, info) => ({
  __name__: 'desc-text',
  value: elem.text().trim()
}))

.addElementParser(['h1.title'], (elem, info) => ({
  __name__: 'Game Title',
  value: elem.text().trim()
}))

.addElementParser(['.promo-img img'], (elem, info) => ({
  __name__: 'Game Img',
  value: elem.attr('src').trim()
}))

websiteScraper.addWebpageScraper(/^http:\/\/iogames.network\/?$/, new Shameless.WebpageScraper('index'))
websiteScraper.addWebpageScraper(/^http:\/\/iogames.network\/games\?game=/, iogamesGame)

await websiteScraper.scrape('http://iogames.network', {
  maxDepthLevel: 2,
  maxPages: 5
})
console.log('Result: ', websiteScraper.__tmp_result__)
fs.writeFileSync('./result.json', JSON.stringify(websiteScraper.__tmp_result__, null, 2))
```

Here, we parse the `index` page of `iogames.network` and provide a custom link extracting function.<br/>
This function just parses the necessary elements on the page to get links in order to parse other pages that belong to
this website. By default, all the **`anchor`** tags that belong to this domain are taken. Provide your own function if
you want to overwrite this.

#### WebsiteParser API

**`Shameless.WebsiteScraper(name)`** - constructor<br/>
**`name`**(string): name of the parser (will come in handy when discussing **Transformers**)<br/>

**`Shameless.WebsiteScraper.prototype.addWebpageScraper(pageRegx, scraper)`**<br/>
Add a new scraper to the collection of scrapers.<br/>
**`pageRegx`**(RegExp): regular expression to match page url with page parser
**`scraper`**(Shameless.WebpageScraper): regular webpage scraper discussed above<br/>

**`Shameless.WebsiteScraper.prototype.scrape(url, options)`**<br/>
**`url`**(string): URL address of the web page to scrape(index page)<br/>
**`options`**(Object): options object to further customize the scraping behaviour<br/>

Currently, only two options are supported:<br/>
**`maxDepthLevel`**(Number): how deep should the scraper parse the website(starting from 1)<br/>
**`maxPages`**(Number): how many pages should be scraped<br/>

### Shameless Object

Coming soon...

## Transformers

Yea, we have those as well.

## Some Important Details

### Level at a time

Shameless.js operates on an idea of **Level at a time** scraping. This means while Shameless scrapes
resources in parallel, it **never scrapes them in parallel at different depth levels of a website structure**.

For example, your website has the folliwing structure:

    | index page
    | - news
    | ----- news article 1
    | ----- news article 2
    | - products
    | ----- product 1
    | ----- product 2

This structure clearly has 3 levels: index(root), news & products, individual news and product pages.

Therefore, Shameless will firstly scrape `index -> news & products (in parallel) -> individual new and product pages (in
parallel)`. This simple structure is chosen to safely enforce `maxPages` and `maxDepthLevel` options on a
`WebsiteScraper` class.

### Actual Page rendering

**Currently**, `Shameless` does not execute the **JavaScript** code on the page, which means that **any content rendered
by JS on the client side will not be visible to Shameless**, and, apparently, will not be parsed.

This problem is planned to be fixed in the next update with support of `Phantom` or similar projects. For now you can try an
**unstable** option of setting **`renderBeforeProcess: true`** on `WebisteParser` config object. This method uses
`Phantom` internally, so make sure you have that in place.

```js
  /*
  * Example setting Phantom page rendering
  */

  new Shameless.WebpageScraper('default', {

    // this is the option to set
    renderBeforeProcess: true,

    rootNode: 'body',
    exclude: [
      'script',
      'footer',
    ],

    timeout: 0
  })
```

## Future

A list of planned features to be added in future versions:

    - `DNS Friendly` requests
    - `Timeout` between requests(partially done)
