/**
* Simple coloured logger
* 
* @class
*/
const chalk = require('chalk')

class Logger {
  constructor() {}

  static green( ...params ) {
    console.log(chalk.green.apply(this, params))
  }

  static yellow( ...params ) {
    console.log(chalk.yellow.apply(this, params))
  }

  static blue( ...params ) {
    console.log(chalk.blue.apply(this, params))
  }

  static cyan( ...params ) {
    console.log(chalk.cyan.apply(this, params))
  }

  static red( ...params ) {
    console.log(chalk.red.apply(this, params))
  }
}

module.exports = Logger
