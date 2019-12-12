const traversalCSSRuleList = require("./traversalCSSRuleList");
const cssHelper = require("./cssHelper");

function generateRulesAll(doc, sheetsRules) {
  return sheetsRules
    .map(i => traversalCSSRuleList(doc, i))
    .reduce(
      (objCss, ele) => {
        cssHelper.mergeobjCss(objCss, ele);
        return objCss;
      },
      {
        normRule: [],
        fontFace: [],
        keyFram: []
      }
    );
}

module.exports = generateRulesAll;
