const URI = require('urijs');

function convUrlToAbs(baseURI, url) {
  const _url = new URI(url);

  if (_url.is('absolute')) {
    return url;
  }
  return _url.absoluteTo(baseURI).toString();
}

module.exports = convUrlToAbs;
