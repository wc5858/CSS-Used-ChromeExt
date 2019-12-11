/* global chrome */
const isutf8 = require('is-utf8');
const convUrlToAbs = require('./convUrlToAbs');

function makeRequest(url) {
  var result = {};
  result.url = url;
  // console.log({
  //   status: 'Getting : ' + url
  // });
  return new Promise(function (resolve, reject) {
    var xhr = new XMLHttpRequest();
    xhr.responseType = 'arraybuffer';
    xhr.open('get', url);
    xhr.onload = function () {
      if ((this.status >= 200 && this.status < 300) || (url.match(/^file:\/\/\//) !== null)) {
        var decoder;
        if (isutf8(new Uint8Array(xhr.response))) {
          decoder = new TextDecoder('UTF-8');
        } else {
          decoder = new TextDecoder('gbk');
        };
        result.cssraw = decoder.decode(xhr.response)
          .replace(/url\((['"]?)(.*?)\1\)/g, function (a, p1, p2) {
            return `url(${p1}${convUrlToAbs(url, p2)}${p1})`;
          });
        result.status = this.status;
        result.statusText = this.statusText;
        resolve(result);
        // console.log({
        //   status: 'Parsing : ' + url
        // });
      } else {
        result.cssraw = "";
        result.status = this.status;
        result.statusText = this.statusText;
        resolve(result);
      }
    };
    xhr.onerror = function (e) {
      console.log('Fail to get: ' + url);
      result.cssraw = "";
      result.status = this.status;
      result.statusText = this.statusText;
      resolve(result);
    };
    xhr.send();
  });
}

function convLinkToText(links) {
  var promises = [];
  return new Promise(function (resolve, reject) {
    if (links.length === 0) {
      resolve([]);
    } else {
      for (var i = 0; i < links.length; i++) {
        promises.push(makeRequest(links[i]));
      };
      Promise.all(promises).then(function (result) {
        resolve(result);
      }).catch(function (err) {
        reject(err);
      });
    }
  });
}

module.exports = convLinkToText;