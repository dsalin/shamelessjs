/**
* Main Hermanos parser method.
* Actually calls assigned Resourse objects' fetch method, which
* is responsible for both fetching the resourse as well as parsing it
* accordingly.
* 
* @function
*/

const url = require('url')
const bluebird = require('bluebird')

const Parser = require('./parser/parser')
const resources = require('./resources')
const fallbackResource = require('./fallback-resource')

function parseContent( sourceUrl, translate = false ) {
  return new Promise((resolve, reject) => {
    // fetch domain without 'www.' in front
    let domain = url.parse(sourceUrl).hostname.replace('www.', '')
    let resource = findResource(domain)

    // use fallback if no resource matched
    if ( !resource ) resource = fallbackResource

    // Paginated resource with multiple page to fetch
    if ( resource.isPagination() ) {
      resource.paginatePages(sourceUrl, translate)
        .then( data => resolve(data) )
        .catch( err => reject(err) )
    } 
    // Regular resource with single page to fetch
    else {
      resource.fetch(sourceUrl, translate)
        .then( data => resolve(data) )
        .catch( err => reject(err) )
    }
  })
}

function findResource( domain ) {
  for ( let i = 0, len = resources.length; i < len; i += 1 )
    if ( resources[i].domain.test(domain) )
      return resources[i]

  return false
}

module.exports = parseContent
