const assert = require('assert');
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const HOST = '127.0.0.1';
const PORT = 18891;
const ADMIN_TOKEN = 'test-admin-ops-token-32-chars';

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

async function main() {
  const adminHtml = fs.readFileSync(path.join(__dirname, 'admin', 'index.html'), 'utf8');
  const adminJs = fs.readFileSync(path.join(__dirname, 'admin', 'app.js'), 'utf8');
  assert(adminHtml.includes('auditRows'), 'admin dashboard should render audit trail rows');
  assert(adminHtml.includes('exportBackup'), 'admin dashboard should expose one-click backup');
  assert(adminJs.includes('/api/admin/audit'), 'admin dashboard should load audit trail');
  assert(adminJs.includes('/api/admin/backup'), 'admin dashboard should download JSON backup');
  assert(adminJs.includes('maskContact'), 'admin dashboard should mask contact info in tables');

  const storageDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hailin-admin-ops-test-'));
  const backend = spawn(process.execPath, [path.join(__dirname, 'server.js')], {
    cwd: path.resolve(__dirname, '..'),
    env: {
      ...process.env,
      HOST,
      PORT: String(PORT),
      STORAGE_DIR: storageDir,
      ADMIN_TOKEN,
      ADMIN_USER: 'ops-admin',
      KIMI_API_KEY: '',
      MOONSHOT_API_KEY: '',
      RATE_LIMIT_MAX: '1000',
      ADMIN_RATE_LIMIT_MAX: '1000'
    },
    stdio: 'ignore'
  });

  try {
    await waitForBackend();

    const booking = await requestJson(`http://${HOST}:${PORT}/api/hailin/bookings`, {
      method: 'POST',
      body: JSON.stringify({
        service: '后台完善测试预约',
        date: '2026-07-08',
        people: 2,
        contact: '13800000000',
        remark: '需要上午讲解'
      })
    });
    assert.strictEqual(booking.status, 201);

    const feedback = await requestJson(`http://${HOST}:${PORT}/api/hailin/feedback`, {
      method: 'POST',
      body: JSON.stringify({
        nickname: '测试游客',
        contact: '13900000000',
        content: '希望后台有审计日志'
      })
    });
    assert.strictEqual(feedback.status, 201);

    const unauthorizedAudit = await requestJson(`http://${HOST}:${PORT}/api/admin/audit`);
    assert.strictEqual(unauthorizedAudit.status, 401);

    const authHeaders = { Authorization: `Bearer ${ADMIN_TOKEN}` };
    const updated = await requestJson(`http://${HOST}:${PORT}/api/admin/bookings/${booking.body.data.id}/status`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ status: 'confirmed', note: '电话确认通过' })
    });
    assert.strictEqual(updated.status, 200);

    const audit = await requestJson(`http://${HOST}:${PORT}/api/admin/audit?pageSize=20`, {
      headers: authHeaders
    });
    assert.strictEqual(audit.status, 200);
    assert(audit.body.data.items.some((item) => item.action === 'booking.status.updated'), 'status update should be audited');
    assert(audit.body.data.items.some((item) => item.action === 'booking.created'), 'public booking creation should be audited');
    assert(audit.body.data.items.some((item) => item.action === 'feedback.created'), 'public feedback creation should be audited');
    const statusAudit = audit.body.data.items.find((item) => item.action === 'booking.status.updated');
    assert.strictEqual(statusAudit.adminUser, 'ops-admin');
    assert.strictEqual(statusAudit.targetId, booking.body.data.id);
    assert.strictEqual(statusAudit.detail.status, 'confirmed');

    const backupResponse = await request(`http://${HOST}:${PORT}/api/admin/backup`, {
      headers: authHeaders
    });
    assert.strictEqual(backupResponse.status, 200);
    assert.match(backupResponse.headers.get('content-type'), /application\/json/);
    assert.match(backupResponse.headers.get('content-disposition'), /hailin-backup/);
    const backup = await backupResponse.json();
    assert.strictEqual(backup.meta.service, 'hailin-backend');
    assert.strictEqual(backup.data.bookings.length, 1);
    assert.strictEqual(backup.data.feedback.length, 1);
    assert(backup.data.audit.length >= 3);
  } finally {
    await stopProcess(backend);
    fs.rmSync(storageDir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
