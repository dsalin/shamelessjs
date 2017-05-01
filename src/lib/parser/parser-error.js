const util = require('util')

function ParserError( options ) {
  options = options || {}
  
  this.error   = options.type    || 'Unknown'
  this.message = options.message || 'Unexpected error'
  this.status  = options.status  || 500
}

util.inherits(ParserError, Error)

// default name for all ParseError errors
ParserError.prototype.name = 'ParserError'

// Ovirride
ParserError.prototype.toString = function () {
  return "{\n  error : " + this.error + ",\n  message : " + this.message + "\n}"
}

ParserError.prototype.toJSON = function () {
  var obj = {
    error : this.error,
    message : this.message
  }
  return obj
}

// Convenience Methods for ParserError construction
ParserError.Unknown = function () {
  var options = { 
    status: 400
  }

  ParserError.call(this, options)
}

util.inherits(ParserError.Unknown, ParserError)

ParserError.TooLarge = function () {
  var options = { 
    type    : 'TooLarge', 
    message : 'Resource is too large to be parsed.' 
  }
  
  ParserError.call(this,options)
}

util.inherits(ParserError.TooLarge, ParserError)

ParserError.Timeout = function () {
  var options = {
    type : 'Timeout', 
    message : 'Request timed out to origin server'
  }
  
  ParserError.call(this,options)
}

util.inherits(ParserError.Timeout, ParserError)

ParserError.Mismatch = function () {
  var options = {
    type : 'Mismatch', 
    message : 'Requested resource is not of a desired type.'
  }
  
  ParserError.call(this,options)
}

util.inherits(ParserError.Mismatch, ParserError)

ParserError._404 = function () {
  var options = {
    type : '404',
    message : 'Page not found'
  }
  
  ParserError.call(this,options)
}

util.inherits(ParserError._404, ParserError)

// Custom Error object for internal use
ParserError.Custom = function ( name, msg, status = 500 ) {
  var options = {
    type : name,
    message : msg,
    status : status
  }
  
  ParserError.call(this,options)
}

util.inherits(ParserError.Custom, ParserError)

module.exports = ParserError
