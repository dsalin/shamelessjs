var chai = require('chai')
// var chaiHttp = require('chai-http')
var Shameless = require('../src/Shameless.class').default
const assert = chai.assert

describe('Construction', function() {
  describe('Shameless Construction', function() {
    it('Should return object of type Shameless', function () {
      assert.instanceOf(new Shameless, Shameless)
    })
  })
  describe('WebsiteScraper Construction', function() {
    it('Should return object of type Shameless.WebsiteScraper', function () {
      const websiteScraper = new Shameless.WebsiteScraper('iogames-site')
      assert.instanceOf(websiteScraper, Shameless.WebsiteScraper)
    })
  })
  describe('WebpageScraper Construction', function() {
    it('Should return object of type Shameless.WebpageScraper', function () {
      const parser = new Shameless.WebpageScraper('example')
      assert.instanceOf(parser, Shameless.WebpageScraper)
    })
  })
})
