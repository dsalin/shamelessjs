/**
* Formatting Class that takes an output from
* scraper and converts it to a variety of formats,
* such as: pdf, xml, txt, etc.
* 
* @class
*/

const Logger = require('./Logger.class')

class Formatter {
  // constructor  
  constructor( name, func ) {
    this.name = name
    this._transformFunc = func
  }

  format ( input ) {
    Logger.green(`${this.name}: Started transforming`)
    const result = this._transformFunc(input)
    Logger.green(`${this.name}: Finished transforming`)
    return result
  }
}

module.exports = Formatter
