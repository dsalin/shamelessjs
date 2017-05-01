import express from 'express'
import Joi from 'joi'
import parse from './lib/content-parser'
import * as utils from './lib/utils'

const app = express()

let urlCheck = Joi.string().uri()
let translateCheck = Joi.string().length(2)

app.get("/", function (req, res, next) {
  let url = req.query.url
  let translate = req.query.lang
  url = utils.prefixURLwithProtocol(url)

  // validation
  let checkUrl = Joi.validate(url, urlCheck)
  let checkTranslate = Joi.validate(translate, translateCheck)
  if ( checkUrl.error || checkTranslate.error )
    return next({ error: "Invalid URL or Language passed", status: 400 })

  parse(url, translate)
    .then( data => res.json(data) )
    .catch( err => next(err) )
})

app.use(function(err, req, res, next) {
  res.status(err.status || err.statusCode || 500).json(err)
})

export default app

if (require.main === module) {
  const port = process.env.PORT || 3000
  console.log(`Listening to http://127.0.0.1:${port}`)
  app.listen(port)

  process.on('SIGINT', () => process.exit(0))
  process.on('SIGTERM', () => process.exit(0))
  process.on('SIGQUIT', () => process.exit(0))  
}
