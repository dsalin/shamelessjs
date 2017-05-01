'use strict'
const path = require('path')
const childProcess = require('child_process')
const Promise = require('bluebird')

const PATH = path.join(__dirname, 'print-page.js')
const EXEC_FILE_OPTIONS = {
  timeout : 30000,
  maxBuffer : 5000*1024
}

function getPhantomPath() {
  return new Promise((resolve, reject) => {
    childProcess.exec('which phantomjs', (err, stdout, stderr) =>
      err ? reject(err) : resolve(stdout.trim())
    )  
  })
}

async function phantomRender( url ) {
  let args = [ 
    PATH,
    url,
    // "--ignore-ssl-errors=true",
    // "--ssl-protocol=any"
  ]

  const phantomPath = await getPhantomPath()

  return new Promise((resolve, reject) => {
    childProcess.execFile(phantomPath, args, EXEC_FILE_OPTIONS, (err, stdout, stderr) => {
      if (err || stdout.indexOf("ERROR") != -1 )
        return reject("Could not render the page")

      return resolve(stdout)
    })
  })
}

module.exports = {
  phantomRender, getPhantomPath
}
