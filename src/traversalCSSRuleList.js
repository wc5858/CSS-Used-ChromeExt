const cssHelper = require("./cssHelper");

function traversalCSSRuleList(doc, cssNodeArr) {
  const objCss = {
    normRule: [],
    keyFram: [],
    fontFace: []
  };

  if (cssNodeArr === undefined || cssNodeArr.length === 0) {
    return objCss;
  } else if (cssNodeArr.length > 0) {
    // annotion where the CSS rule from
    let strMediaText = "";
    if (cssNodeArr.media && cssNodeArr.media.length > 0) {
      strMediaText = `; media=${cssNodeArr.media.mediaText} `;
    }
    if (cssNodeArr.href === doc.location.href) {
      objCss.normRule.push(`/*! CSS Used from: Embedded ${strMediaText}*/`);
    } else if (cssNodeArr.href && !cssNodeArr.parentHref) {
      objCss.normRule.push(
        `/*! CSS Used from: ${cssNodeArr.href} ${strMediaText}*/`
      );
    }
  }
  const result = cssNodeArr.map(CSSRuleListItem => {
    const res = {
      normRule: [],
      keyFram: [],
      fontFace: []
    };
    if (
      CSSRuleListItem.type === "atrule" &&
      CSSRuleListItem.name.match(/^(-(webkit|moz|ms|o)-)?keyframes$/)
    ) {
      // CSSKeyframesRule
      res.keyFram.push(CSSRuleListItem);
      return res;
    }
    if (
      CSSRuleListItem.type === "atrule" &&
      CSSRuleListItem.name === "font-face"
    ) {
      // CSSFontFaceRule
      res.fontFace.push(CSSRuleListItem);
      return res;
    }
    if (CSSRuleListItem.type === "atrule" && CSSRuleListItem.name === "media") {
      // CSSMediaRule
      res.normRule.push("\n@media " + CSSRuleListItem.params + "{");
      cssHelper.mergeobjCss(
        res,
        traversalCSSRuleList(doc, CSSRuleListItem.nodes)
      );
      res.normRule.push("}");
      return res;
    }
    if (CSSRuleListItem.type === "rule" && CSSRuleListItem.selector !== "") {
      // the normal "CSSStyleRule"
      res.normRule.push(CSSRuleListItem);
    }
    return res;
  });

  result.forEach(function(ele) {
    cssHelper.mergeobjCss(objCss, ele);
  });
  if (cssNodeArr.media && cssNodeArr.media.length > 0) {
    objCss.normRule.splice(1, 0, `@media ${cssNodeArr.media.mediaText}{`);
    objCss.normRule.push("}");
  }
  return objCss;
}

module.exports = traversalCSSRuleList;
