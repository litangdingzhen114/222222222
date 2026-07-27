const assert = require('assert');

const apiPath = require.resolve('../services/api');

function loadApi(wxMock) {
  delete require.cache[apiPath];
  global.wx = wxMock;
  return require('../services/api');
}

function createWxMock(platform, storageValue, tokenValue = '') {
  let lastRequest = null;
  return {
    getSystemInfoSync() {
      return { platform };
    },
    getStorageSync(key) {
      if (key === 'hailin-access-token') return tokenValue;
      return storageValue || '';
    },
    request(options) {
      lastRequest = options;
      options.success({
        statusCode: 200,
        data: {
          data: { ok: true }
        }
      });
    },
    lastRequest() {
      return lastRequest;
    }
  };
}

(async () => {
  const devWx = createWxMock('devtools', '');
  let api = loadApi(devWx);
  assert.strictEqual(api.resolveApiBaseUrl(), 'http://127.0.0.1:8787');
  assert.strictEqual(api.serviceModeText(), '本地后端已连接');
  assert.strictEqual(api.mediaUrl('/media/hailin-live.mp4'), 'http://127.0.0.1:8787/media/hailin-live.mp4');
  assert.deepStrictEqual(await api.request('/api/check'), { ok: true });
  assert.strictEqual(devWx.lastRequest().url, 'http://127.0.0.1:8787/api/check');
  assert.strictEqual(devWx.lastRequest().header.Authorization, undefined);

  const tokenWx = createWxMock('devtools', '', 'access-token-for-test');
  api = loadApi(tokenWx);
  assert.deepStrictEqual(await api.request('/api/secure'), { ok: true });
  assert.strictEqual(tokenWx.lastRequest().header.Authorization, 'Bearer access-token-for-test');

  const overrideWx = createWxMock('devtools', 'http://192.168.1.8:8787');
  api = loadApi(overrideWx);
  assert.strictEqual(api.resolveApiBaseUrl(), 'http://192.168.1.8:8787');

  const deviceWx = createWxMock('ios', '');
  api = loadApi(deviceWx);
  assert.strictEqual(api.resolveApiBaseUrl(), 'https://www.hailin.store');

  delete global.wx;
  console.log('api service environment selection ok');
})().catch((error) => {
  delete global.wx;
  console.error(error);
  process.exit(1);
});
