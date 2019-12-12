const postcss = require("postcss");
const safe = require("postcss-safe-parser");

const convTextToRules = async ({ cssraw, href, media }) => {
  const res = await postcss().process(cssraw, {
    from: undefined,
    parser: safe
  });
  const { nodes } = res.root;
  nodes.href = href;
  nodes.media = media;
  return nodes;
};

module.exports = convTextToRules;
