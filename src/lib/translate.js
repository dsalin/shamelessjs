/**
* Class for automatic post text content translation
* with help of Yandex Translation API
*
* @class
*/

const Promise = require('bluebird')
const req = require('request')
const settings = require('./settings')

class Translator {
  constructor() {}

  /**
  * Translates the given data object to the specified 
  * language ( from English to Spanich or reverse, for now )
  * Yandex API supports auto language detection, but should
  * specify source - dest explicitly
  *
  * @param {obj} data obj
  * @param {string} lang
  *   format: 'src-dest', i.e: 'en-sp'
  *   or    : 'dest' - for auto-detection
  */
  static translate( what, lang = 'en-es' ) {
    let text = what.content.filter(item => item.type === 'text' )
      .map(item => item.content)
      .concat([what.description, what.title])
      .join(settings.MERGED_SECTIONS_SEPARATOR)

    let query = {
      url: settings.TRANSLATE_BASE_URL,
      form: {
        format: "text",
        key: settings.TRANSLATE_API_KEY,
        text: text,
        lang: lang
      },
      timeout: 20000,
      json: true
    }

    return new Promise((resolve, reject) => {
      req.post(query, (err, res, body) => {
        if ( err ) return reject(err)
        let j = 0
        body.text = body.text[0].split(settings.MERGED_SECTIONS_SEPARATOR)
        // put the translated text blocks to the resulting data obj
        for ( let i = 0, len = what.content.length; i < len; i += 1 ) {
          if ( what.content[i].type === 'text' ) {
            what.content[i].content = body.text[j]
            j++
          }
        } // end for
        what.description = body.text[j]
        what.title = body.text[++j]

        return resolve(what)
      })
    })
  } // end translate
}

module.exports = Translator
