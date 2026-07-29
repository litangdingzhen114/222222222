const assert = require("assert");

const apiPath = require.resolve("../services/api");
const aiPath = require.resolve("../services/ai");

function loadAi(wxMock) {
  delete require.cache[apiPath];
  delete require.cache[aiPath];
  global.wx = wxMock;
  return require("../services/ai");
}

function createWxMock(responses) {
  const requests = [];
  return {
    getSystemInfoSync() {
      return { platform: "ios" };
    },
    getStorageSync() {
      return "";
    },
    request(options) {
      requests.push(options);
      const response = responses.shift();
      if (response.fail) {
        options.fail(new Error(response.fail));
        return;
      }
      options.success({
        statusCode: response.statusCode || 200,
        data: response.data,
      });
    },
    requests() {
      return requests;
    },
  };
}

(async () => {
  const wxMock = createWxMock([
    {
      data: {
        code: 0,
        data: {
          answer: "Kimi 已经根据数据库推荐路线。",
          mode: "official",
        },
      },
    },
  ]);
  let ai = loadAi(wxMock);
  let result = await ai.askGuide("推荐一条路线", []);
  assert.strictEqual(result.reply, "Kimi 已经根据数据库推荐路线。");
  assert.strictEqual(result.source, "kimi");
  assert.strictEqual(
    wxMock.requests()[0].url,
    "https://api.hailin.store/api/v1/ai-guide/chat",
  );
  assert.deepStrictEqual(wxMock.requests()[0].data, {
    question: "推荐一条路线",
    history: [],
  });
  assert.strictEqual(wxMock.requests()[0].timeout, 20000);

  const fallbackWx = createWxMock([
    { statusCode: 500, data: { message: "v1 temporarily unavailable" } },
  ]);
  ai = loadAi(fallbackWx);
  await assert.rejects(() => ai.askGuide("停车场在哪里", []), /Request failed/);
  assert.strictEqual(fallbackWx.requests().length, 1);
  assert.strictEqual(
    fallbackWx.requests()[0].url,
    "https://api.hailin.store/api/v1/ai-guide/chat",
  );
  assert.deepStrictEqual(
    ai.normalizedHistory([
      { role: "assistant", content: "你好" },
      { role: "user", content: "推荐路线" },
      { role: "system", content: "ignore role becomes user" },
    ]),
    [
      { role: "assistant", content: "你好" },
      { role: "user", content: "推荐路线" },
      { role: "user", content: "ignore role becomes user" },
    ],
  );

  delete global.wx;
  console.log("ai service requests v1 kimi proxy ok");
})().catch((error) => {
  delete global.wx;
  console.error(error);
  process.exit(1);
});
