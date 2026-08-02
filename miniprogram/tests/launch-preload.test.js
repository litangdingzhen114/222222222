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
const preloadCacheJs = fs.readFileSync(
  path.join(root, "miniprogram/utils/preloadCache.js"),
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
assert(launchJs.includes('label: "直播"'), "launch page should show live preload stage");
assert(launchJs.includes('label: "服务"'), "launch page should show service preload stage");
assert(launchJs.includes("imageLimit: 32"), "launch page should preload more critical images");
assert(launchJs.includes("imageConcurrency: 3"), "launch page should preload images with bounded concurrency");
assert(launchJs.includes("assetBudget"), "launch page should cap preload work by a time budget");
assert(launchJs.includes("wx.switchTab"), "launch page should enter the home tab");
assert(launchJs.includes("MIN_SHOW_TIME"), "launch page should avoid a flash-only loading state");
assert(launchWxml.includes("progress-bar"), "launch page should show visible loading progress");
assert(
  launchWxml.includes("brand-wordmark") &&
    launchWxml.includes("route-preview") &&
    launchWxml.includes("launch-lines"),
  "launch page should use a polished branded loading composition",
);
assert(
  !launchWxml.includes(">首<") && !launchWxml.includes("grid-icon"),
  "launch page should not show leftover large character icon blocks",
);
assert(
  !launchWxml.includes("{{item.label}}"),
  "launch route dots should not render text labels under the nodes",
);
assert(
  launchJs.includes("欢迎来到海林村") &&
    launchJs.includes("山风已经吹到村口") &&
    launchWxml.includes("山水、田园、村咖和村树"),
  "launch page should use visitor-facing welcome copy instead of technical loading text",
);
assert(
  !launchJs.includes("正在准备首页内容") &&
    !launchJs.includes("正在预热图片资源") &&
    !launchWxml.includes("正在预加载"),
  "launch page should not expose technical preload wording to visitors",
);
assert(
  launchWxss.includes("@keyframes lineScan") &&
    launchWxss.includes("route-node") &&
    launchWxss.includes("progress-sub"),
  "launch page should include refined motion and preload states",
);
assert(
  launchWxml.includes("/assets/launch/launch-bg.jpg"),
  "launch page should use a bundled lightweight background",
);
assert(
  launchWxml.includes("launch-bg-fallback") && launchWxss.includes("launch-bg-fallback"),
  "launch page should show a CSS fallback while the image is loading",
);
const launchBgPath = path.join(root, "miniprogram/assets/launch/launch-bg.jpg");
assert(fs.existsSync(launchBgPath), "launch bundled background should exist");
assert(
  fs.statSync(launchBgPath).size < 80 * 1024,
  "launch bundled background should stay small enough for fast first paint",
);
assert(preloadJs.includes("loadHomeData"), "preload utility should fetch home data");
assert(preloadJs.includes("loadMapPoints"), "preload utility should warm map data");
assert(preloadJs.includes("loadProducts"), "preload utility should warm product data");
assert(preloadJs.includes("loadLives"), "preload utility should warm live data");
assert(preloadJs.includes("loadSpots"), "preload utility should warm spot data");
assert(preloadJs.includes("loadRoutes"), "preload utility should warm route data");
assert(preloadJs.includes("loadFoods"), "preload utility should warm food data");
assert(preloadJs.includes("LOCAL_PRELOAD_IMAGE_URLS"), "preload utility should include bundled asset list");
assert(
  preloadJs.includes("/assets/live/hailin-village-live.gif"),
  "preload utility should warm the lightweight live gif",
);
assert(preloadJs.includes("runLimited"), "preload utility should avoid unbounded image warmup");
assert(preloadJs.includes("assetBudget"), "preload utility should avoid blocking launch too long");
assert(
  preloadJs.includes("setContentPreloadCacheBatch"),
  "preload utility should cache side-channel content for subsequent pages",
);
assert(preloadJs.includes("wx.getImageInfo"), "preload utility should warm first-screen images");
assert(preloadJs.includes("HOME_PRELOAD_CACHE_KEY"), "preload utility should cache home data");
assert(
  preloadCacheJs.includes("CONTENT_PRELOAD_CACHE_KEY") &&
    preloadCacheJs.includes("DEFAULT_CONTENT_CACHE_MAX_AGE = 90 * 1000"),
  "content preload cache should be short-lived so admin edits can still refresh quickly",
);
assert(homeJs.includes("getHomePreloadCache"), "home page should read preloaded home cache");
assert(homeJs.includes("keepCurrent"), "home page should avoid replacing cache with fallback");

console.log("launch preload page ok");
