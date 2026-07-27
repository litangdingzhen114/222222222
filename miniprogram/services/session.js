const {
  clearAuthSession,
  getAccessToken,
  getRefreshToken,
  request,
  saveAuthSession
} = require('./api');

let loginPromise = null;

function wxLogin() {
  return new Promise((resolve, reject) => {
    if (typeof wx === 'undefined' || !wx || typeof wx.login !== 'function') {
      reject(new Error('wx.login is not available'));
      return;
    }
    wx.login({
      success(result) {
        if (result && result.code) {
          resolve(result.code);
          return;
        }
        reject(new Error('wx.login did not return code'));
      },
      fail: reject
    });
  });
}

function loginWithWechat(profile = {}) {
  if (loginPromise) return loginPromise;
  loginPromise = wxLogin()
    .then((code) => request('/api/v1/auth/wechat-login', {
      method: 'POST',
      data: {
        code,
        nickname: profile.nickname,
        avatarUrl: profile.avatarUrl
      }
    }))
    .then((session) => {
      saveAuthSession(session);
      return session;
    })
    .finally(() => {
      loginPromise = null;
    });
  return loginPromise;
}

function ensureSession(profile = {}) {
  if (getAccessToken()) {
    return Promise.resolve({ accessToken: getAccessToken(), cached: true });
  }
  return loginWithWechat(profile);
}

function refreshSession() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return Promise.reject(new Error('missing refresh token'));
  return request('/api/v1/auth/refresh', {
    method: 'POST',
    data: { refreshToken }
  }).then((session) => {
    saveAuthSession(session);
    return session;
  });
}

function logoutSession() {
  const refreshToken = getRefreshToken();
  clearAuthSession();
  if (!refreshToken) return Promise.resolve({ ok: true });
  return request('/api/v1/auth/logout', {
    method: 'POST',
    data: { refreshToken }
  }).catch(() => ({ ok: true }));
}

module.exports = {
  ensureSession,
  loginWithWechat,
  logoutSession,
  refreshSession
};
