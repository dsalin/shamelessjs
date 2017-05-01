# Shameless.js - simple website scraper for NodeJS

It might appear as a 'another' webpage parser/scraper/whatever you want to call it. However, `Shameless.js`
aims to provide a complete tool for scraping not just individual pages, but complete websites.

**Important Note:** Shameless is still in development and not fully tested yet.

## Table of contents

- [Basic Usage](#basic-usage)
- [Scrape em all!](#scrape-em-all!)
    - [Webpage Scraper](#webpage-scraper)
    - [Wesite Scraper](#wesite-scraper)
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
const mediumScraper = new Shameless.WebpageScraper('cnn')
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

### Webpage Scraper

### Website Scraper

## Transformers

Yea, we have those as well.

## Some Important Details

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

## Future

A list of planned features to be added in future versions:
    * `DNS Friendly` requests
    * `Timeout` between requests(partially done)
