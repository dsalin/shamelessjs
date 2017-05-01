'use strict'
const bluebird = require('bluebird')

/**
* Basic class to abstract the parsing of independent
* elements or group of elements with the single parser function
*
* Note: parser function should return data object or 'false' in order
* to be correctly understood by the Resource main parsing routine
*/
class ElementParser {
  // constructor
  constructor( selectors, parser ) {
    this.selectors = selectors
    this.parser = parser
  }

  static create( selectors, parser ) {
    return new ElementParser(selectors, parser)
  }

  /**
  * Checks whether this parser supports the provided element
  * and can parse it
  */
  supports( elem ) {
    return this.selectors.some(selector => elem.is(selector))
  }

  parse( elem, info ) {
    return this.parser(elem, info)
  }
}

module.exports = ElementParser
