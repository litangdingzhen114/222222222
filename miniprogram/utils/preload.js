const {
  getLocalHomeFallback,
  loadHomeData,
  loadFoods,
  loadLives,
  loadMapPoints,
  loadProducts,
  loadRoutes,
  loadSpots,
} = require("../services/content");
const { setContentPreloadCacheBatch } = require("./preloadCache");

const HOME_PRELOAD_CACHE_KEY = "hailin_home_preload_cache";
const PRELOAD_META_KEY = "hailin_preload_meta";
const DEFAULT_HOME_CACHE_MAX_AGE = 10 * 60 * 1000;
const LOCAL_PRELOAD_IMAGE_URLS = [
  "/assets/launch/launch-bg.jpg",
  "/assets/live/hailin-village-live.gif",
  "/assets/tabbar/home.png",
  "/assets/tabbar/home-active.png",
  "/assets/tabbar/map.png",
  "/assets/tabbar/map-active.png",
  "/assets/tabbar/food.png",
  "/assets/tabbar/food-active.png",
  "/assets/tabbar/mine.png",
  "/assets/tabbar/mine-active.png",
  "/assets/map/marker-scenic.png",
  "/assets/map/marker-station.png",
  "/assets/map/marker-food.png",
  "/assets/map/marker-stay.png",
  "/assets/map/marker-market.png",
  "/assets/map/marker-service.png",
  "/assets/map/marker-parking.png",
  "/assets/map/marker-toilet.png",
  "/assets/map/marker-live.png",
  "/assets/icons/commerce.png",
  "/assets/icons/live.png",
  "/assets/icons/map-food.png",
  "/assets/icons/stay.png",
  "/assets/icons/ai.png",
  "/assets/icons/village-tree.png",
  "/assets/icons/routes.png",
  "/assets/icons/booking.png",
  "/assets/icons/toilet.png",
  "/assets/icons/ar.png",
  "/assets/avatar/default-avatar.jpg",
  "/assets/section/route.png",
  "/assets/section/service.png",
  "/assets/section/hot.png",
  "https://www.hailin.store/assets/photos/ai-village-gate.jpg",
  "https://www.hailin.store/assets/photos/ai-chenrongkao-tree.jpg",
  "https://www.hailin.store/assets/photos/ai-map-tianpu-station.jpg",
  "https://www.hailin.store/assets/photos/ai-map-hailin-creek.jpg",
  "https://www.hailin.store/assets/photos/ai-xunye-cafe.jpg",
  "https://www.hailin.store/assets/photos/ai-overseas-cafe.jpg",
  "https://www.hailin.store/assets/photos/ricefish-paddy.jpg",
  "https://www.hailin.store/assets/photos/ricefish-drying.jpg",
  "https://www.hailin.store/assets/photos/ai-product-native-chicken.jpg",
  "https://www.hailin.store/assets/photos/ai-product-native-eggs.jpg",
  "https://www.hailin.store/assets/photos/ai-product-black-pork.jpg",
  "https://www.hailin.store/assets/photos/ai-product-honey.jpg",
  "/assets/scenes/hailin-creek-waterfall.jpg",
  "/assets/scenes/hailin-creek-ripple.jpg",
  "/assets/scenes/village-gate.png",
  "/assets/products/fish-key.png",
  "/assets/products/oujiang-postcard.png",
  "/assets/products/stone-sachet.png",
];

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
  pushImageCandidate(set, url);
}

function pushImageCandidate(set, url) {
  const value = String(url || "").trim();
  if (/^(https?:\/\/|\/assets\/)/i.test(value)) set.add(value);
}

function collectImageUrlsFromItems(items, fields = ["imageUrl", "coverUrl"]) {
  const urls = new Set();
  (items || []).forEach((item) => {
    fields.forEach((field) => pushImageUrl(urls, item, field));
    if (Array.isArray(item && item.imageUrls)) {
      item.imageUrls.forEach((url) => pushImageCandidate(urls, url));
    }
    if (Array.isArray(item && item.images)) {
      item.images.forEach((url) => pushImageCandidate(urls, url));
    }
  });
  return Array.from(urls);
}

function collectHomeImageUrls(homeData) {
  const source = homeData || getLocalHomeFallback();
  const urls = new Set();

  (source.banners || [])
    .slice(0, 3)
    .forEach((item) => pushImageUrl(urls, item));
  (source.itineraries || [])
    .slice(0, 2)
    .forEach((item) => pushImageUrl(urls, item));
  (source.hotRecommends || [])
    .slice(0, 4)
    .forEach((item) => pushImageUrl(urls, item));
  (source.products || [])
    .slice(0, 6)
    .forEach((item) => pushImageUrl(urls, item));
  (source.corridor || [])
    .slice(0, 3)
    .forEach((item) => pushImageUrl(urls, item));

  return Array.from(urls);
}

function collectCriticalImageUrls(homeData, sideData = {}) {
  const urls = new Set(LOCAL_PRELOAD_IMAGE_URLS);
  collectHomeImageUrls(homeData).forEach((url) => pushImageCandidate(urls, url));
  collectImageUrlsFromItems(sideData.mapPoints || [], ["imageUrl"])
    .slice(0, 8)
    .forEach((url) => pushImageCandidate(urls, url));
  collectImageUrlsFromItems(sideData.products || [], ["imageUrl"])
    .slice(0, 8)
    .forEach((url) => pushImageCandidate(urls, url));
  collectImageUrlsFromItems(sideData.spots || [], ["coverUrl", "imageUrl"])
    .slice(0, 6)
    .forEach((url) => pushImageCandidate(urls, url));
  collectImageUrlsFromItems(sideData.routes || [], ["imageUrl"])
    .slice(0, 4)
    .forEach((url) => pushImageCandidate(urls, url));
  collectImageUrlsFromItems(sideData.lives || [], ["coverUrl", "imageUrl"])
    .slice(0, 4)
    .forEach((url) => pushImageCandidate(urls, url));
  collectImageUrlsFromItems(sideData.foods || [], ["imageUrl"])
    .slice(0, 4)
    .forEach((url) => pushImageCandidate(urls, url));
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

function runLimited(items, limit, worker) {
  const list = items || [];
  const concurrency = Math.max(1, Number(limit) || 1);
  let cursor = 0;
  const results = [];

  function next() {
    if (cursor >= list.length) return Promise.resolve();
    const index = cursor;
    cursor += 1;
    return Promise.resolve(worker(list[index], index))
      .then((result) => {
        results[index] = result;
      })
      .catch(() => {
        results[index] = false;
      })
      .then(next);
  }

  return Promise.all(
    Array.from({ length: Math.min(concurrency, list.length) }, next),
  ).then(() => results);
}

function warmImages(urls, limit = 20, timeoutMs = 1200, concurrency = 3) {
  const uniqueUrls = Array.from(new Set(urls || [])).slice(0, limit);
  return runLimited(uniqueUrls, concurrency, (url) => warmImage(url, timeoutMs));
}

function warmSideData(dataTimeout) {
  const loaders = {
    mapPoints: loadMapPoints,
    products: loadProducts,
    lives: loadLives,
    spots: loadSpots,
    routes: loadRoutes,
    foods: loadFoods,
  };
  const entries = Object.keys(loaders).map((key) =>
    withTimeout(loaders[key](), dataTimeout, null).then((data) => [key, data]),
  );
  return Promise.allSettled(entries).then((results) => {
    const sideData = {};
    results.forEach((result) => {
      if (result.status !== "fulfilled") return;
      const [key, data] = result.value;
      if (!data) return;
      sideData[key] = data;
    });
    setContentPreloadCacheBatch(sideData);
    return sideData;
  });
}

function warmCriticalResources(options = {}) {
  const startedAt = Date.now();
  const dataTimeout = options.dataTimeout || 2600;
  const imageLimit = options.imageLimit || 32;
  const imageTimeout = options.imageTimeout || 1200;
  const imageConcurrency = options.imageConcurrency || 3;
  const assetBudget = options.assetBudget || 2200;

  const homePromise = withTimeout(loadHomeData(), dataTimeout, null).then((home) => {
    const readyHome = home || getLocalHomeFallback();
    setHomePreloadCache(readyHome);
    return readyHome;
  });

  const sideDataPromise = warmSideData(dataTimeout);

  return homePromise
    .then((home) =>
      sideDataPromise.then((sideData) => {
        const imageUrls = collectCriticalImageUrls(home, sideData);
        return withTimeout(
          warmImages(imageUrls, imageLimit, imageTimeout, imageConcurrency),
          assetBudget,
          [],
        ).then((imageResults) => ({
          homeReady: Boolean(home),
          sideDataKeys: Object.keys(sideData),
          imageCount: imageUrls.slice(0, imageLimit).length,
          imageSuccessCount: (imageResults || []).filter(Boolean).length,
          elapsed: Date.now() - startedAt,
        }));
      }),
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
  collectCriticalImageUrls,
  collectHomeImageUrls,
  getHomePreloadCache,
  getPreloadMeta,
  setHomePreloadCache,
  warmCriticalResources,
  warmImage,
};
