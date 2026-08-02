const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..", "..");
const appConfig = require("../app.json");

const launchDir = path.join(root, "miniprogram/pages/launch");
const launchJs = fs.readFileSync(path.join(launchDir, "launch.js"), "utf8");
const launchWxml = fs.readFileSync(path.join(launchDir, "launch.wxml"), "utf8");
const launchWxss = fs.readFileSync(path.join(launchDir, "launch.wxss"), "utf8");
const preloadJs = fs.readFileSync(
  path.join(root, "miniprogram/utils/preload.js"),
  "utf8",
);
const homeJs = fs.readFileSync(
  path.join(root, "miniprogram/pages/home/home.js"),
  "utf8",
);

assert.strictEqual(
  appConfig.pages[0],
  "pages/launch/launch",
  "launch page should be the first app entry",
);
assert(launchJs.includes("warmCriticalResources"), "launch page should warm critical resources");
assert(launchJs.includes("wx.switchTab"), "launch page should enter the home tab");
assert(launchJs.includes("MIN_SHOW_TIME"), "launch page should avoid a flash-only loading state");
assert(launchWxml.includes("progress-bar"), "launch page should show visible loading progress");
assert(launchWxss.includes("launch-bg"), "launch page should use a visual branded background");
assert(preloadJs.includes("loadHomeData"), "preload utility should fetch home data");
assert(preloadJs.includes("loadMapPoints"), "preload utility should warm map data");
assert(preloadJs.includes("loadProducts"), "preload utility should warm product data");
assert(preloadJs.includes("wx.getImageInfo"), "preload utility should warm first-screen images");
assert(preloadJs.includes("HOME_PRELOAD_CACHE_KEY"), "preload utility should cache home data");
assert(homeJs.includes("getHomePreloadCache"), "home page should read preloaded home cache");
assert(homeJs.includes("keepCurrent"), "home page should avoid replacing cache with fallback");

console.log("launch preload page ok");
