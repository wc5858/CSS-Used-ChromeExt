/* global chrome*/
// chrome.runtime.sendMessage=function(){};
const filterRules = require('./filterRules');
const getStyleSheets = require('./getStyleSheets');
const convTextToRules = require('./convTextToRules');
const postTideCss = require('./postTideCss');
const generateRulesAll = require('./generateRulesAll');

const externalCssCache = {};
//to store timers of testing if a html element matches a rule selector.
let arrTimerOfTestingIfMatched = [];
const docRulesCache = {};

const getC = async ($0, getInnerStyle = true) => {
  arrTimerOfTestingIfMatched.forEach(function (ele) {
    clearTimeout(ele);
  });
  arrTimerOfTestingIfMatched = [];

  if ($0 === null || typeof $0 === 'undefined' || typeof $0.nodeName === 'undefined') {
    return {
      success: false,
      error: "Invalid input"
    };
  } else {
    if ($0.nodeName.match(/^<pseudo:/)) {
      return {
        success: false,
        error: "It's a pseudo element"
      };
    } else if ($0.nodeName === 'html' || $0.nodeName.match(/^#/)) {
      return {
        success: false,
        error: "Not for this element"
      };
    }
  }

  let isInSameOrigin = true;
  try {
    $0.ownerDocument.defaultView.parent.document
  } catch (e) {
    isInSameOrigin = false;
    // console.log(e);
  }

  if (isInSameOrigin) {
    // if same isInSameOrigin
    // $0 can be accessed from its parent context
    if ($0.ownerDocument.defaultView.parent.document !== document) {
      return {
        success: false,
        error: "Not in same origin"
      };
    }
  }

  const doc = $0.ownerDocument;

  try {
    let rules;
    if (docRulesCache[doc]) {
      rules = docRulesCache[doc];
    } else {
      const styleSheets = getStyleSheets(doc);
      const sheetsRules = await Promise.all(styleSheets.map(convTextToRules));
      rules = await generateRulesAll(doc, sheetsRules);
      docRulesCache[doc] = rules;
    }
    const filteredRules = await filterRules($0, rules, arrTimerOfTestingIfMatched, getInnerStyle);
    return {
      success: true,
      css: postTideCss(filteredRules)
    }
  } catch (error) {
    console.log(error)
    return {
      success: false,
      error: JSON.stringify(error)
    };
  }
}

module.exports = getC;