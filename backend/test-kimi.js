const assert = require('assert');
const { spawn } = require('child_process');
const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');

const HOST = '127.0.0.1';
const BACKEND_PORT = 18878;
const TEST_KEY = 'test-kimi-key';
const TEST_MODEL = 'test-kimi-model';
const TEST_ADMIN_TOKEN = 'test-admin-config-token-32-chars';

function requestJson(url, options = {}) {
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  }).then(async (response) => ({
    status: response.status,
    body: await response.json()
  }));
}

async function waitForBackend(port = BACKEND_PORT) {
  const url = `http://${HOST}:${port}/health`;
  const deadline = Date.now() + 5000;
  let lastError = null;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 120));
  }

  throw lastError || new Error('Backend did not become ready');
}

function stopProcess(child) {
  return new Promise((resolve) => {
    if (!child || child.exitCode !== null || child.signalCode !== null) {
      resolve();
      return;
    }

    child.once('exit', resolve);
    child.kill();
  });
}

function closeServer(server) {
  return new Promise((resolve) => server.close(resolve));
}

async function startBackend(extraEnv) {
  const serverPath = path.join(__dirname, 'server.js');
  const storageDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hailin-kimi-test-'));
  const child = spawn(process.execPath, [serverPath], {
    cwd: path.resolve(__dirname, '..'),
    env: {
      ...process.env,
      HOST,
      STORAGE_DIR: storageDir,
      ...extraEnv
    },
    stdio: 'ignore'
  });
  child.storageDir = storageDir;
  return child;
}

async function stopBackend(child) {
  await stopProcess(child);
  if (child && child.storageDir) {
    fs.rmSync(child.storageDir, { recursive: true, force: true });
  }
}

async function runKimiProxyTest() {
  let capturedRequest = null;
  const kimiStub = http.createServer((req, res) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
    });
    req.on('end', () => {
      capturedRequest = {
        method: req.method,
        url: req.url,
        authorization: req.headers.authorization,
        body: JSON.parse(raw)
      };

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        choices: [
          { message: { content: 'Kimi stub reply' } }
        ]
      }));
    });
  });

  await new Promise((resolve) => kimiStub.listen(0, HOST, resolve));
  const kimiPort = kimiStub.address().port;
  const backend = await startBackend({
      PORT: String(BACKEND_PORT),
      KIMI_API_KEY: TEST_KEY,
      KIMI_BASE_URL: `http://${HOST}:${kimiPort}/v1`,
      KIMI_MODEL: TEST_MODEL
  });

  try {
    await waitForBackend();

    const result = await requestJson(`http://${HOST}:${BACKEND_PORT}/api/hailin/ai-guide`, {
      method: 'POST',
      body: JSON.stringify({
        message: '推荐一条半日路线',
        history: [{ role: 'user', content: '我想看瓯江和稻鱼田' }]
      })
    });

    assert.strictEqual(result.status, 200);
    assert.strictEqual(result.body.data.source, 'kimi');
    assert.strictEqual(result.body.data.reply, 'Kimi stub reply');
    assert.ok(capturedRequest, 'Kimi stub should receive a request');
    assert.strictEqual(capturedRequest.method, 'POST');
    assert.strictEqual(capturedRequest.url, '/v1/chat/completions');
    assert.strictEqual(capturedRequest.authorization, `Bearer ${TEST_KEY}`);
    assert.strictEqual(capturedRequest.body.model, TEST_MODEL);
    assert.ok(Array.isArray(capturedRequest.body.messages), 'messages should be an array');
    assert.ok(capturedRequest.body.messages.some((item) => item.role === 'system'));
    assert.ok(capturedRequest.body.messages.some((item) => item.role === 'user' && item.content.includes('半日路线')));

    const v1Result = await requestJson(`http://${HOST}:${BACKEND_PORT}/api/v1/ai-guide/chat`, {
      method: 'POST',
      body: JSON.stringify({
        question: '附近有什么美食',
        history: [{ role: 'user', content: '我想吃田鱼' }]
      })
    });

    assert.strictEqual(v1Result.status, 201);
    assert.strictEqual(v1Result.body.data.mode, 'official');
    assert.strictEqual(v1Result.body.data.answer, 'Kimi stub reply');
  } finally {
    await stopBackend(backend);
    await closeServer(kimiStub);
  }
}

async function runLocalFallbackTest() {
  const fallbackPort = BACKEND_PORT + 1;
  const backend = await startBackend({
    PORT: String(fallbackPort),
    KIMI_API_KEY: '',
    MOONSHOT_API_KEY: '',
    KIMI_BASE_URL: '',
    KIMI_MODEL: ''
  });

  try {
    await waitForBackend(fallbackPort);

    const result = await requestJson(`http://${HOST}:${fallbackPort}/api/hailin/ai-guide`, {
      method: 'POST',
      body: JSON.stringify({ message: '停车怎么走' })
    });

    assert.strictEqual(result.status, 200);
    assert.strictEqual(result.body.data.source, 'local');
    assert.ok(result.body.data.reply);
  } finally {
    await stopBackend(backend);
  }
}

async function runStoredKimiConfigTest() {
  const storedConfigPort = BACKEND_PORT + 2;
  let requestCount = 0;
  const kimiStub = http.createServer((req, res) => {
    req.on('data', () => {});
    req.on('end', () => {
      requestCount += 1;
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        choices: [
          { message: { content: 'Stored Kimi config reply' } }
        ]
      }));
    });
  });

  await new Promise((resolve) => kimiStub.listen(0, HOST, resolve));
  const kimiPort = kimiStub.address().port;
  const backend = await startBackend({
    PORT: String(storedConfigPort),
    ADMIN_TOKEN: TEST_ADMIN_TOKEN,
    ADMIN_USER: 'config-admin',
    KIMI_API_KEY: '',
    MOONSHOT_API_KEY: '',
    KIMI_BASE_URL: '',
    KIMI_MODEL: ''
  });

  try {
    await waitForBackend(storedConfigPort);
    const authHeaders = { Authorization: `Bearer ${TEST_ADMIN_TOKEN}` };
    const saved = await requestJson(`http://${HOST}:${storedConfigPort}/api/admin/integration-configs/llm`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({
        values: {
          LLM_API_KEY: TEST_KEY,
          LLM_BASE_URL: `http://${HOST}:${kimiPort}/v1`,
          LLM_MODEL: TEST_MODEL
        }
      })
    });

    assert.strictEqual(saved.status, 200);
    const apiKeyField = saved.body.data.fields.find((field) => field.key === 'LLM_API_KEY');
    assert.strictEqual(apiKeyField.configured, true);
    assert.strictEqual(apiKeyField.source, 'database');
    assert.ok(apiKeyField.valuePreview);
    assert.strictEqual(apiKeyField.displayValue, undefined);
    assert.strictEqual(JSON.stringify(saved.body).includes(TEST_KEY), false);

    const testResult = await requestJson(`http://${HOST}:${storedConfigPort}/api/admin/integration-configs/llm/test`, {
      method: 'POST',
      headers: authHeaders
    });
    assert.strictEqual(testResult.status, 200);
    assert.strictEqual(testResult.body.data.ok, true);

    const chat = await requestJson(`http://${HOST}:${storedConfigPort}/api/v1/ai-guide/chat`, {
      method: 'POST',
      body: JSON.stringify({ question: '现在真的连上模型了吗？', history: [] })
    });

    assert.strictEqual(chat.status, 201);
    assert.strictEqual(chat.body.data.mode, 'official');
    assert.strictEqual(chat.body.data.answer, 'Stored Kimi config reply');
    assert.ok(requestCount >= 2, 'test connection and chat should both reach the Kimi adapter');
  } finally {
    await stopBackend(backend);
    await closeServer(kimiStub);
  }
}

async function main() {
  await runKimiProxyTest();
  await runLocalFallbackTest();
  await runStoredKimiConfigTest();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
