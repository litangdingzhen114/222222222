const {
  getLocalHomeFallback,
  loadHomeData,
  loadMapPoints,
  loadProducts,
} = require("../services/content");

const HOME_PRELOAD_CACHE_KEY = "hailin_home_preload_cache";
const PRELOAD_META_KEY = "hailin_preload_meta";
const DEFAULT_HOME_CACHE_MAX_AGE = 10 * 60 * 1000;

function hasWxStorage() {
  return (
    typeof wx !== "undefined" &&
    wx &&
    typeof wx.getStorageSync === "function" &&
    typeof wx.setStorageSync === "function"
  );
}

function storageGet(key) {
  if (!hasWxStorage()) return null;
  try {
    return wx.getStorageSync(key) || null;
  } catch (error) {
    return null;
  }
}

function storageSet(key, value) {
  if (!hasWxStorage()) return;
  try {
    wx.setStorageSync(key, value);
  } catch (error) {
    // Preload cache is an optimization. Storage failures should never block app start.
  }
}

function withTimeout(promise, timeoutMs, fallbackValue) {
  let timer = null;
  return Promise.race([
    promise,
    new Promise((resolve) => {
      timer = setTimeout(() => resolve(fallbackValue), timeoutMs);
    }),
  ]).then((value) => {
    if (timer) clearTimeout(timer);
    return value;
  });
}

function setHomePreloadCache(data) {
  if (!data) return;
  storageSet(HOME_PRELOAD_CACHE_KEY, {
    data,
    cachedAt: Date.now(),
  });
}

function getHomePreloadCache(maxAge = DEFAULT_HOME_CACHE_MAX_AGE) {
  const cached = storageGet(HOME_PRELOAD_CACHE_KEY);
  if (!cached || !cached.data || !cached.cachedAt) return null;
  if (Date.now() - Number(cached.cachedAt) > maxAge) return null;
  return cached.data;
}

function getPreloadMeta() {
  return storageGet(PRELOAD_META_KEY) || null;
}

function rememberPreloadMeta(meta) {
  storageSet(PRELOAD_META_KEY, {
    ...meta,
    finishedAt: Date.now(),
  });
}

function pushImageUrl(set, item, field = "imageUrl") {
  const url = item && String(item[field] || "").trim();
  if (/^https?:\/\//i.test(url)) set.add(url);
}

function collectHomeImageUrls(homeData) {
  const source = homeData || getLocalHomeFallback();
  const urls = new Set();

  (source.banners || []).slice(0, 2).forEach((item) => pushImageUrl(urls, item));
  (source.itineraries || []).slice(0, 1).forEach((item) => pushImageUrl(urls, item));
  (source.hotRecommends || []).slice(0, 2).forEach((item) => pushImageUrl(urls, item));
  (source.products || []).slice(0, 3).forEach((item) => pushImageUrl(urls, item));
  (source.corridor || []).slice(0, 2).forEach((item) => pushImageUrl(urls, item));

  return Array.from(urls);
}

function warmImage(url, timeoutMs = 1400) {
  if (
    !url ||
    typeof wx === "undefined" ||
    !wx ||
    typeof wx.getImageInfo !== "function"
  ) {
    return Promise.resolve(false);
  }

  return withTimeout(
    new Promise((resolve) => {
      wx.getImageInfo({
        src: url,
        success: () => resolve(true),
        fail: () => resolve(false),
      });
    }),
    timeoutMs,
    false,
  );
}

function warmImages(urls, limit = 6, timeoutMs = 1400) {
  return Promise.all((urls || []).slice(0, limit).map((url) => warmImage(url, timeoutMs)));
}

function warmCriticalResources(options = {}) {
  const startedAt = Date.now();
  const dataTimeout = options.dataTimeout || 2600;
  const imageLimit = options.imageLimit || 6;
  const imageTimeout = options.imageTimeout || 1400;

  const homePromise = withTimeout(loadHomeData(), dataTimeout, null).then((home) => {
    const readyHome = home || getLocalHomeFallback();
    setHomePreloadCache(readyHome);
    return readyHome;
  });

  const sideDataPromise = Promise.allSettled([
    withTimeout(loadMapPoints(), dataTimeout, null),
    withTimeout(loadProducts(), dataTimeout, null),
  ]);

  return homePromise
    .then((home) =>
      Promise.allSettled([
        warmImages(collectHomeImageUrls(home), imageLimit, imageTimeout),
        sideDataPromise,
      ]).then((results) => ({
        homeReady: Boolean(home),
        imageCount: collectHomeImageUrls(home).slice(0, imageLimit).length,
        elapsed: Date.now() - startedAt,
        results,
      })),
    )
    .then((meta) => {
      rememberPreloadMeta(meta);
      return meta;
    })
    .catch((error) => {
      const meta = {
        homeReady: false,
        imageCount: 0,
        elapsed: Date.now() - startedAt,
        error: error && error.message ? error.message : "preload failed",
      };
      rememberPreloadMeta(meta);
      return meta;
    });
}

module.exports = {
  HOME_PRELOAD_CACHE_KEY,
  PRELOAD_META_KEY,
  collectHomeImageUrls,
  getHomePreloadCache,
  getPreloadMeta,
  setHomePreloadCache,
  warmCriticalResources,
  warmImage,
};
