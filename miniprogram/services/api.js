const serviceConfig = require('../config/service');

function hasBackend() {
  return Boolean(serviceConfig.apiBaseUrl && serviceConfig.apiBaseUrl.trim());
}

function joinUrl(baseUrl, endpoint) {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${cleanBase}${cleanEndpoint}`;
}

function normalizePayload(response) {
  if (!response) return null;
  if (response.data && response.data.data) return response.data.data;
  if (response.data) return response.data;
  return response;
}

function request(endpoint, options = {}) {
  if (!hasBackend()) {
    return Promise.reject(new Error('Backend is not configured'));
  }

  const method = options.method || 'GET';
  const data = options.data || {};
  const url = joinUrl(serviceConfig.apiBaseUrl, endpoint);

  return new Promise((resolve, reject) => {
    wx.request({
      url,
      method,
      data,
      timeout: serviceConfig.requestTimeout,
      header: {
        'content-type': 'application/json'
      },
      success(result) {
        if (result.statusCode >= 200 && result.statusCode < 300) {
          resolve(normalizePayload(result));
          return;
        }
        reject(new Error(`Request failed with status ${result.statusCode}`));
      },
      fail(error) {
        reject(error);
      }
    });
  });
}

function serviceModeText() {
  return hasBackend() ? '真实服务已连接' : '本地内容兜底';
}

module.exports = {
  hasBackend,
  request,
  serviceModeText,
  serviceConfig
};
