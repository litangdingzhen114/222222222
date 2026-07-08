const assert = require('assert');
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const serviceConfig = require('../miniprogram/config/service');

const HOST = '127.0.0.1';
const PORT = 18889;
const BACKEND_DOMAIN = 'https://api.sunmaosun.com';
const ADMIN_TOKEN = 'test-admin-production-token-32-chars';

function request(url, options = {}) {
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
}

async function requestJson(url, options = {}) {
  const response = await request(url, options);
  return {
    status: response.status,
    headers: response.headers,
    body: await response.json()
  };
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

async function waitForBackend() {
  const deadline = Date.now() + 5000;
  let lastError = null;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://${HOST}:${PORT}/health`);
      if (response.ok) return;
    } catch (error) {
      lastError = error;
    }
    await wait(120);
  }

  throw lastError || new Error('Backend did not become ready');
}

async function assertProductionRejectsMissingAdminToken() {
  const storageDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hailin-security-no-token-'));
  const backend = spawn(process.execPath, [path.join(__dirname, 'server.js')], {
    cwd: path.resolve(__dirname, '..'),
    env: {
      ...process.env,
      HOST,
      PORT: '18890',
      NODE_ENV: 'production',
      PUBLIC_BASE_URL: BACKEND_DOMAIN,
      STORAGE_DIR: storageDir,
      ADMIN_TOKEN: '',
      KIMI_API_KEY: '',
      MOONSHOT_API_KEY: ''
    },
    stdio: ['ignore', 'ignore', 'pipe']
  });

  let stderr = '';
  backend.stderr.on('data', (chunk) => {
    stderr += chunk.toString('utf8');
  });

  try {
    await wait(900);
    assert.notStrictEqual(backend.exitCode, null, 'production server should exit when ADMIN_TOKEN is missing');
    assert.notStrictEqual(backend.exitCode, 0, 'missing ADMIN_TOKEN should be a startup failure');
    assert.match(stderr, /ADMIN_TOKEN/, 'startup failure should explain ADMIN_TOKEN requirement');
  } finally {
    await stopProcess(backend);
    fs.rmSync(storageDir, { recursive: true, force: true });
  }
}

async function assertProductionSecurityRuntime() {
  const storageDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hailin-security-runtime-'));
  const backend = spawn(process.execPath, [path.join(__dirname, 'server.js')], {
    cwd: path.resolve(__dirname, '..'),
    env: {
      ...process.env,
      HOST,
      PORT: String(PORT),
      NODE_ENV: 'production',
      PUBLIC_BASE_URL: BACKEND_DOMAIN,
      ALLOWED_ORIGINS: BACKEND_DOMAIN,
      STORAGE_DIR: storageDir,
      ADMIN_TOKEN,
      ADMIN_USER: 'security-admin',
      KIMI_API_KEY: '',
      MOONSHOT_API_KEY: '',
      RATE_LIMIT_MAX: '1000',
      ADMIN_RATE_LIMIT_MAX: '1000'
    },
    stdio: 'ignore'
  });

  try {
    await waitForBackend();

    const health = await requestJson(`http://${HOST}:${PORT}/health`, {
      headers: { Origin: BACKEND_DOMAIN }
    });
    assert.strictEqual(health.status, 200);
    assert.strictEqual(health.headers.get('access-control-allow-origin'), BACKEND_DOMAIN);
    assert.match(health.headers.get('strict-transport-security') || '', /max-age=/);
    assert.strictEqual(health.body.adminConfigured, true);

    const booking = await requestJson(`http://${HOST}:${PORT}/api/hailin/bookings`, {
      method: 'POST',
      body: JSON.stringify({
        service: '生产安全测试预约',
        date: '2026-07-08',
        people: 2,
        contact: '13800000000'
      })
    });
    assert.strictEqual(booking.status, 201);

    const publicBookings = await requestJson(`http://${HOST}:${PORT}/api/hailin/bookings`);
    assert.notStrictEqual(publicBookings.status, 200, 'public booking list must not expose visitor data');

    const publicFeedback = await requestJson(`http://${HOST}:${PORT}/api/hailin/feedback`);
    assert.notStrictEqual(publicFeedback.status, 200, 'public feedback list must not expose visitor data');

    const unauthorized = await requestJson(`http://${HOST}:${PORT}/api/admin/summary`, {
      headers: { Authorization: 'Bearer wrong-token' }
    });
    assert.strictEqual(unauthorized.status, 401);
    assert.strictEqual(unauthorized.headers.get('cache-control'), 'no-store');

    const summary = await requestJson(`http://${HOST}:${PORT}/api/admin/summary`, {
      headers: { Authorization: `Bearer ${ADMIN_TOKEN}` }
    });
    assert.strictEqual(summary.status, 200);
    assert.strictEqual(summary.body.data.system.security.publicBaseUrl, BACKEND_DOMAIN);
    assert.strictEqual(summary.body.data.system.security.httpsEnabled, true);
    assert.strictEqual(summary.body.data.system.security.adminTokenConfigured, true);
    assert.strictEqual(summary.body.data.system.security.corsRestricted, true);
  } finally {
    await stopProcess(backend);
    fs.rmSync(storageDir, { recursive: true, force: true });
  }
}

async function main() {
  assert.strictEqual(serviceConfig.apiBaseUrl, BACKEND_DOMAIN);
  const adminHtml = fs.readFileSync(path.join(__dirname, 'admin', 'index.html'), 'utf8');
  const adminJs = fs.readFileSync(path.join(__dirname, 'admin', 'app.js'), 'utf8');
  assert(adminHtml.includes('securityHttps'), 'admin dashboard should render HTTPS safety state');
  assert(adminHtml.includes('securityCors'), 'admin dashboard should render CORS safety state');
  assert(adminHtml.includes('securityToken'), 'admin dashboard should render admin token safety state');
  assert(adminJs.includes('system.security'), 'admin dashboard should consume backend security summary');
  await assertProductionRejectsMissingAdminToken();
  await assertProductionSecurityRuntime();
  console.log('production security checks ok');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
