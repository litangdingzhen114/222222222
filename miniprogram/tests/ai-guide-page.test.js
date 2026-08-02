const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..", "..");
const pageBase = path.join(root, "miniprogram/pages/ai-guide/ai-guide");

["js", "wxml", "wxss", "json"].forEach((ext) => {
  assert(fs.existsSync(`${pageBase}.${ext}`), `ai-guide.${ext} should exist`);
});

const aiGuideJs = fs.readFileSync(`${pageBase}.js`, "utf8");
const aiGuideWxml = fs.readFileSync(`${pageBase}.wxml`, "utf8");
const aiGuideWxss = fs.readFileSync(`${pageBase}.wxss`, "utf8");

assert(
  aiGuideJs.includes('assistantAvatarUrl: "/assets/icons/ai.png"'),
  "assistant chat avatar should use the AI guide icon asset",
);
assert(
  aiGuideJs.includes('userAvatarUrl: "/assets/avatar/default-avatar.jpg"'),
  "visitor chat avatar should use the compressed custom avatar asset",
);
assert(
  aiGuideWxml.includes('class="avatar-img"') &&
    aiGuideWxml.includes('src="{{item.role === \'user\' ? userAvatarUrl : assistantAvatarUrl}}"') &&
    aiGuideWxml.includes('binderror="onAvatarError"'),
  "ai chat should render image avatars with a fallback handler",
);
assert(
  aiGuideWxss.includes(".avatar-img") &&
    aiGuideWxss.includes("border-radius: 50%") &&
    aiGuideWxss.includes("overflow: hidden"),
  "ai chat avatar styles should crop image avatars cleanly",
);
assert(
  fs.existsSync(path.join(root, "miniprogram/assets/avatar/default-avatar.jpg")),
  "custom visitor avatar asset should exist",
);
assert(
  fs.existsSync(path.join(root, "miniprogram/assets/icons/ai.png")),
  "assistant avatar asset should exist",
);

console.log("ai guide page avatar coverage ok");
