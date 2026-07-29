const serviceConfig = require("../config/service");

const API_BASE_OVERRIDE_KEY = "hailin-api-base-url";
const ACCESS_TOKEN_KEY = "hailin-access-token";
const REFRESH_TOKEN_KEY = "hailin-refresh-token";
const USER_PROFILE_KEY = "hailin-user-profile";

function safeWxCall(methodName, fallback) {
  try {
    if (
      typeof wx === "undefined" ||
      !wx ||
      typeof wx[methodName] !== "function"
    ) {
      return fallback;
    }
    return wx[methodName]();
  } catch (error) {
    return fallback;
  }
}

function isDevtools() {
  const info = safeWxCall("getSystemInfoSync", {});
  return info && info.platform === "devtools";
}

function storageApiBaseUrl() {
  try {
    if (
      typeof wx === "undefined" ||
      !wx ||
      typeof wx.getStorageSync !== "function"
    ) {
      return "";
    }
    return String(wx.getStorageSync(API_BASE_OVERRIDE_KEY) || "").trim();
  } catch (error) {
    return "";
  }
}

function storageGet(key) {
  try {
    if (
      typeof wx === "undefined" ||
      !wx ||
      typeof wx.getStorageSync !== "function"
    ) {
      return "";
    }
    return wx.getStorageSync(key) || "";
  } catch (error) {
    return "";
  }
}

function storageSet(key, value) {
  try {
    if (
      typeof wx !== "undefined" &&
      wx &&
      typeof wx.setStorageSync === "function"
    ) {
      wx.setStorageSync(key, value);
    }
  } catch (error) {
    // Storage failures should not break public content fallback.
  }
}

function storageRemove(key) {
  try {
    if (
      typeof wx !== "undefined" &&
      wx &&
      typeof wx.removeStorageSync === "function"
    ) {
      wx.removeStorageSync(key);
    }
  } catch (error) {
    // Ignore storage cleanup failures in devtools mocks.
  }
}

function resolveApiBaseUrl() {
  const overrideUrl = storageApiBaseUrl();
  if (overrideUrl) return overrideUrl;
  if (
    isDevtools() &&
    serviceConfig.useDevApiInDevtools &&
    serviceConfig.devApiBaseUrl
  )
    return serviceConfig.devApiBaseUrl;
  return serviceConfig.apiBaseUrl || "";
}

function hasBackend() {
  return Boolean(resolveApiBaseUrl().trim());
}

function joinUrl(baseUrl, endpoint) {
  const cleanBase = baseUrl.replace(/\/+$/, "");
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${cleanBase}${cleanEndpoint}`;
}

function mediaUrl(pathname) {
  const baseUrl = resolveApiBaseUrl();
  if (!baseUrl) return "";
  return joinUrl(baseUrl, pathname);
}

function normalizePayload(response) {
  if (!response) return null;
  if (response.data && response.data.data) return response.data.data;
  if (response.data) return response.data;
  return response;
}

function request(endpoint, options = {}) {
  if (!hasBackend()) {
    return Promise.reject(new Error("Backend is not configured"));
  }

  const method = options.method || "GET";
  const data = options.data || {};
  const url = joinUrl(resolveApiBaseUrl(), endpoint);
  const token = getAccessToken();
  const header = {
    "content-type": "application/json",
    ...(options.header || {}),
  };
  if (token) header.Authorization = `Bearer ${token}`;

  return new Promise((resolve, reject) => {
    wx.request({
      url,
      method,
      data,
      timeout: options.timeout || serviceConfig.requestTimeout,
      header,
      success(result) {
        if (result.statusCode >= 200 && result.statusCode < 300) {
          resolve(normalizePayload(result));
          return;
        }
        reject(new Error(`Request failed with status ${result.statusCode}`));
      },
      fail(error) {
        reject(error);
      },
    });
  });
}

function getAccessToken() {
  return String(storageGet(ACCESS_TOKEN_KEY) || "").trim();
}

function getRefreshToken() {
  return String(storageGet(REFRESH_TOKEN_KEY) || "").trim();
}

function saveAuthSession(session) {
  if (!session) return;
  if (session.accessToken) storageSet(ACCESS_TOKEN_KEY, session.accessToken);
  if (session.refreshToken) storageSet(REFRESH_TOKEN_KEY, session.refreshToken);
  if (session.user) storageSet(USER_PROFILE_KEY, session.user);
}

function clearAuthSession() {
  storageRemove(ACCESS_TOKEN_KEY);
  storageRemove(REFRESH_TOKEN_KEY);
  storageRemove(USER_PROFILE_KEY);
}

function serviceModeText() {
  const overrideUrl = storageApiBaseUrl();
  if (overrideUrl) {
    return overrideUrl === serviceConfig.devApiBaseUrl
      ? "本地后端已连接"
      : "自定义服务已连接";
  }
  const baseUrl = resolveApiBaseUrl();
  if (!baseUrl) return "内容预览模式";
  return baseUrl === serviceConfig.devApiBaseUrl
    ? "本地后端已连接"
    : "线上服务已连接";
}

module.exports = {
  hasBackend,
  resolveApiBaseUrl,
  mediaUrl,
  request,
  getAccessToken,
  getRefreshToken,
  saveAuthSession,
  clearAuthSession,
  serviceModeText,
  serviceConfig,
};
