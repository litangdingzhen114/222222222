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

async function main() {
  await runKimiProxyTest();
  await runLocalFallbackTest();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
