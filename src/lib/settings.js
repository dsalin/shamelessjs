/**
* All the general settings for Content Parser
*/
let settings = {}

settings.DEFAULT_PARSER_HEADERS = {
  'Pragma': 'no-cache',
  'Cache-Control': 'no-cache',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Upgrade-Insecure-Requests': '1',
  'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2490.86 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.8',
}

// ----- TRANSLATION ------
settings.TRANSLATE_BASE_URL = "https://translate.yandex.net/api/v1.5/tr.json/translate"
settings.TRANSLATE_API_KEY = "trnsl.1.1.20151228T001735Z.ed0f86caf81e4110.3d468734028740b9fc24aab61f1b48163b96cb34"
settings.MERGED_SECTIONS_SEPARATOR = '__||__'

module.exports = settings
