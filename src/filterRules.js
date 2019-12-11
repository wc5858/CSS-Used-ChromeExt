/* global chrome */

// this module is used to filter rules
// by testing the dom and its children one by one.
// each testing is wrapped by a settimeout timmer to make it async
// because the testing can be a long time if too many.

var debugMode = process.env.NODE_ENV!=='production';
const cssHelper = require('./cssHelper');

// may match accoding to interaction
const PseudoClass = '((-(webkit|moz|ms|o)-)?(full-screen|fullscreen))|-o-prefocus|active|checked|disabled|empty|enabled|focus|hover|in-range|invalid|link|out-of-range|target|valid|visited',
  PseudoElement = '((-(webkit|moz|ms|o)-)?(focus-inner|input-placeholder|placeholder|selection|resizer|scrollbar(-(button|thumb|corner|track(-piece)?))?))|-ms-(clear|reveal|expand)|-moz-(focusring)|-webkit-(details-marker)|after|before|first-letter|first-line',
  MaxPossiblePseudoLength=30,
  REG0=new RegExp('^(:(' + PseudoClass + ')|::?(' + PseudoElement + '))+$', ''),
  REG1=new RegExp('( |^)(:(' + PseudoClass + ')|::?(' + PseudoElement + '))+( |$)', 'ig'),
  REG2=new RegExp('\\((:(' + PseudoClass + ')|::?(' + PseudoElement + '))+\\)', 'ig'),
  REG3=new RegExp('(:(' + PseudoClass + ')|::?(' + PseudoElement + '))+', 'ig');

function filterRules($0, objCss, taskTimerRecord, getInnerStyle) {
  var promises = [];
  var matched = [];
  var keyFramUsed = [];
  var fontFaceUsed = [];

  var domlist = [$0];
  Array.prototype.forEach.call($0.querySelectorAll('*'), function (e) {
    domlist.push(e);
  });

  return new Promise(function (resolve, reject) {
    // loop every dom
    objCss.normRule.forEach(function (rule, idx) {
      promises.push(new Promise(function (res, rej) {
        var timer = setTimeout(function () {
          // if (idx % 1000 === 0) {
          //   chrome.runtime.sendMessage({
          //     dom: domlist.length - 1,
          //     rule: objCss.normRule.length,
          //     rulenow: idx
          //   });
          // }

          if (typeof rule === 'string') {
            res(rule);
            return;
          } else {
            var selMatched = [];
            var arrSel = [...rule.selectors];
            arrSel.forEach(function (sel) {
              if (selMatched.indexOf(sel) !== -1) {
                return;
              }
              // these pseudo class/elements can apply to any ele
              // but wont apply now 
              // eg. :active{xxx}
              // only works when clicked on and actived
              if (sel.length < MaxPossiblePseudoLength && sel.match(REG0)){
                selMatched.push(sel);
              } else {
                let count = [];
                let replacedSel = sel.replace(REG1, ' * ')
                  .replace(REG2, '(*)')
                  .replace(REG3, '');
                // try {
                //   if ($0.matches(sel) || $0.querySelectorAll(sel).length !== 0) {
                //     selMatched.push(sel);
                //   }
                // } catch (e) {
                //   count.push(sel);
                //   count.push(e);
                // }
                try {
                  if ($0.matches(replacedSel) || (getInnerStyle && $0.querySelectorAll(replacedSel).length !== 0)) {
                    selMatched.push(sel);
                  }
                } catch (e) {
                  count.push(replacedSel);
                  count.push(e);
                }
                if (count.length === 4 && debugMode) {
                  if (count[2] === count[0]) {
                    count = count.slice(0, 2);
                  }
                  console.log(count);
                }
              }
            });
            if (selMatched.length !== 0) {
              var cssText = selMatched.filter(function (v, i, self) {
                return self.indexOf(v) === i;
              }).join(',');
              cssText += ('{' + cssHelper.normRuleNodeToText(rule) + '}');
              res(cssText);
              rule.nodes.forEach(function (ele, idx) {
                if (ele.prop && ele.prop.match(/^(-(webkit|moz|ms|o)-)?animation(-name)?$/i) !== null) {
                  keyFramUsed = keyFramUsed.concat(ele.value.split(/ *, */).map(function (ele) {
                    return ele.split(' ')[0];
                  }));
                };
              });
              let fontfamilyOfRule = cssHelper.textToCss(cssText);
              if (fontfamilyOfRule.cssRules[0] && fontfamilyOfRule.cssRules[0].style.fontFamily) {
                fontFaceUsed = fontFaceUsed.concat(fontfamilyOfRule.cssRules[0].style.fontFamily.split(', '));
              }
              return;
            }
          }
          res("");
        }, 0);
        taskTimerRecord.push(timer);
      }));
    });

    Promise.all(promises).then(function (result) {
      keyFramUsed = keyFramUsed.filter(function (v, i, self) {
        return self.indexOf(v) === i;
      });
      fontFaceUsed = fontFaceUsed.filter(function (v, i, self) {
        return self.indexOf(v) === i;
      });
      result.forEach(function (ele) {
        // typeof ele:string
        if (ele.length > 0) {
          matched.push(ele);
        }
      });
      var frameCommentMarkUsed = false;
      keyFramUsed.forEach(function (ele) {
        objCss.keyFram.forEach(function (e) {
          if (ele === e.params) {
            if (!frameCommentMarkUsed) {
              matched.push('/*! CSS Used keyframes */');
              frameCommentMarkUsed = true;
            }
            matched.push(cssHelper.keyFramNodeToText(e));
          }
        })
      });
      var fontCommentMarkUsed = false;
      fontFaceUsed.forEach(function (ele) {
        objCss.fontFace.forEach(function (e) {
          e.nodes.forEach(function (n) {
            if (n.prop === 'font-family' && ele.replace(/^(['"])?(.*)\1$/, '$2') === n.value.replace(/^(['"])?(.*)\1$/, '$2')) {
              if (!fontCommentMarkUsed) {
                matched.push('/*! CSS Used fontfaces */');
                fontCommentMarkUsed = true;
              }
              matched.push(cssHelper.fontFaceNodeToText(e));
            }
          })

        })
      });
      resolve(matched);
    }).catch(function (err) {
      reject(err);
    });
  });
}

module.exports = filterRules;