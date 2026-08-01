const assert = require("assert");

const apiPath = require.resolve("../services/api");

function loadApi(wxMock) {
  delete require.cache[apiPath];
  global.wx = wxMock;
  return require("../services/api");
}

function createWxMock(platform, storageValue, tokenValue = "") {
  let lastRequest = null;
  return {
    getSystemInfoSync() {
      return { platform };
    },
    getStorageSync(key) {
      if (key === "hailin-access-token") return tokenValue;
      return storageValue || "";
    },
    request(options) {
      lastRequest = options;
      options.success({
        statusCode: 200,
        data: {
          data: { ok: true },
        },
      });
    },
    lastRequest() {
      return lastRequest;
    },
  };
}

function createRetryWxMock() {
  const requests = [];
  return {
    getSystemInfoSync() {
      return { platform: "devtools" };
    },
    getStorageSync(key) {
      if (key === "hailin-api-base-url") return "https://www.hailin.store";
      return "";
    },
    request(options) {
      requests.push(options);
      if (requests.length === 1) {
        options.fail(new Error("net::ERR_CONNECTION_CLOSED"));
        return;
      }
      options.success({
        statusCode: 200,
        data: {
          data: { ok: true, retried: true },
        },
      });
    },
    requests() {
      return requests;
    },
  };
}

(async () => {
  const devWx = createWxMock("devtools", "");
  let api = loadApi(devWx);
  assert.strictEqual(api.resolveApiBaseUrl(), "https://api.hailin.store");
  assert.strictEqual(api.serviceModeText(), "线上服务已连接");
  assert.strictEqual(
    api.mediaUrl("/media/hailin-live.mp4"),
    "https://api.hailin.store/media/hailin-live.mp4",
  );
  assert.deepStrictEqual(await api.request("/api/check"), { ok: true });
  assert.strictEqual(
    devWx.lastRequest().url,
    "https://api.hailin.store/api/check",
  );
  assert.strictEqual(devWx.lastRequest().timeout, 3000);
  assert.strictEqual(devWx.lastRequest().header.Authorization, undefined);

  await api.request("/api/slow", { timeout: 20000 });
  assert.strictEqual(devWx.lastRequest().timeout, 20000);

  const tokenWx = createWxMock("devtools", "", "access-token-for-test");
  api = loadApi(tokenWx);
  assert.deepStrictEqual(await api.request("/api/secure"), { ok: true });
  assert.strictEqual(
    tokenWx.lastRequest().header.Authorization,
    "Bearer access-token-for-test",
  );

  const overrideWx = createWxMock("devtools", "http://192.168.1.8:8787");
  api = loadApi(overrideWx);
  assert.strictEqual(api.resolveApiBaseUrl(), "http://192.168.1.8:8787");
  assert.strictEqual(api.serviceModeText(), "自定义服务已连接");

  const retryWx = createRetryWxMock();
  api = loadApi(retryWx);
  assert.deepStrictEqual(await api.request("/api/v1/ai-guide/chat"), {
    ok: true,
    retried: true,
  });
  assert.strictEqual(retryWx.requests().length, 2);
  assert.strictEqual(
    retryWx.requests()[0].url,
    "https://www.hailin.store/api/v1/ai-guide/chat",
  );
  assert.strictEqual(
    retryWx.requests()[1].url,
    "https://api.hailin.store/api/v1/ai-guide/chat",
  );

  const deviceWx = createWxMock("ios", "");
  api = loadApi(deviceWx);
  assert.strictEqual(api.resolveApiBaseUrl(), "https://api.hailin.store");

  delete global.wx;
  console.log("api service environment selection ok");
})().catch((error) => {
  delete global.wx;
  console.error(error);
  process.exit(1);
});
