# Shameless.js - simple website scraper for NodeJS

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

Lets take a simple example by getting latest CNN News article info:

```js
// taken from /test/simple.js
const Shameless = require('../src/lib/Shameless.class').default

// initialize scraper that starts scraping from '#intl_homepage1-zone-1' node
const mediumScraper = new Shameless.WebpageScraper('medium-index')
  .addElementParser(['.promo-title', '.promo-subtitle'], (elem, info) => ({
    __name__: 'Main/Subtitle Title',
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
   [ { __name__: 'Main/Subtitle Title',
       value: 'Stories that move with you.' },
     { __name__: 'Main/Subtitle Title',
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
      // no ads here, just a good article :D
      .scrape('medium-post', 'https://medium.com/@the1mills/a-better-mutex-for-node-js-4b4897fd9f11')
      .exec()

    console.log(result[0].content)
  } catch (err) {
    console.log(err)
  }
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

Note that all the meta tags are preserved on the `result` object, similar to first example.

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
    __name__: 'Main/Subtitle Title',
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
   [ { __name__: 'Main/Subtitle Title',
       value: 'Stories that move with you.' },
     { __name__: 'Main/Subtitle Title',
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

**name**(`string`) - name of the resource you parse with this parser
*options**(`object`) - config object

**Options** object is very important and contains the following fields:

    - `rootNode` (string): css selector of the node from which parsing should start 
    - `excluded` (array[string]): array of css selectors of elements that should be ignored while parsing
    - `finalNodes` (array[string]): array of css selectors that should not be inspected further. Children of that html element will not be parsed individually if their parent matches at least one of provided selectors
    - `timeout` (number - in Milliseconds): delay before starting the request
    - `getNextPaginatedPageURL` (function): function that is responsible for fetching url of the next pagination in order to continue parsing the page
    - `fallback` (WebsiteParser): a parser that will be called if the current one cannot parse the DOM element. This model is useful for defining template parsers and extend them when you need.


### Website Scraper

### Shameless Object

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