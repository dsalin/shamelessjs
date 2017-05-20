var system = require('system')
var fs = require('fs')
var page   = require('webpage').create()

var url = system.args[1]

// page.settings.userAgent = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2490.86 Safari/537.36'
// page.settings.userAgent = 'Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/37.0.2049.0 Safari/537.36';

// for some reason, this setting is the most stable
page.settings.userAgent = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Safari/537.36 PhantomJS/1.9.0'

//  page.onLoadFinished = function() {
//   page.render('export.png')
//   fs.write('1.html', page.content, 'w')
//   console.log(page.content)
//   phantom.exit()
// };

// render the page, and run the callback function
page.open(url, status => {
  if ( status === 'fail' ) exitWithError()
  // page.content is the source
  console.log(page.content)
  // need to call phantom.exit() to prevent from hanging
  phantom.exit()
})

page.onError(err => console.log("Error", err))
phantom.onError(err => console.log("Error", err))

function exitWithError() {
  console.log("ERROR")
  phantom.exit()
}
