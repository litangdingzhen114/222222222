const CONTENT_PRELOAD_CACHE_KEY = "hailin_content_preload_cache";
const DEFAULT_CONTENT_CACHE_MAX_AGE = 90 * 1000;

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
    // Preload cache is only an optimization.
  }
}

function getContentPreloadCache(key, maxAge = DEFAULT_CONTENT_CACHE_MAX_AGE) {
  const cache = storageGet(CONTENT_PRELOAD_CACHE_KEY) || {};
  const entry = cache[key];
  if (!entry || !entry.cachedAt || !entry.data) return null;
  if (Date.now() - Number(entry.cachedAt) > maxAge) return null;
  return entry.data;
}

function setContentPreloadCache(key, data) {
  if (!key || !data) return;
  const cache = storageGet(CONTENT_PRELOAD_CACHE_KEY) || {};
  storageSet(CONTENT_PRELOAD_CACHE_KEY, {
    ...cache,
    [key]: {
      data,
      cachedAt: Date.now(),
    },
  });
}

function setContentPreloadCacheBatch(entries) {
  if (!entries || typeof entries !== "object") return;
  const cache = storageGet(CONTENT_PRELOAD_CACHE_KEY) || {};
  const cachedAt = Date.now();
  Object.keys(entries).forEach((key) => {
    const data = entries[key];
    if (!data) return;
    cache[key] = {
      data,
      cachedAt,
    };
  });
  storageSet(CONTENT_PRELOAD_CACHE_KEY, cache);
}

module.exports = {
  CONTENT_PRELOAD_CACHE_KEY,
  DEFAULT_CONTENT_CACHE_MAX_AGE,
  getContentPreloadCache,
  setContentPreloadCache,
  setContentPreloadCacheBatch,
};
