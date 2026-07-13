const assert = require('assert');
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const HOST = '127.0.0.1';
const PORT = 18888;
const ADMIN_TOKEN = 'test-admin-token';

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
  const storageDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hailin-production-test-'));
  const backend = spawn(process.execPath, [path.join(__dirname, 'server.js')], {
    cwd: path.resolve(__dirname, '..'),
    env: {
      ...process.env,
      HOST,
      PORT: String(PORT),
      STORAGE_DIR: storageDir,
      ADMIN_TOKEN,
      ADMIN_USER: 'tester',
      KIMI_API_KEY: '',
      MOONSHOT_API_KEY: '',
      RATE_LIMIT_MAX: '1000'
    },
    stdio: 'ignore'
  });

  try {
    await waitForBackend();

    const adminHtml = await request(`http://${HOST}:${PORT}/admin/`);
    assert.strictEqual(adminHtml.status, 200);
    assert.match(await adminHtml.text(), /海林村文旅后台/);

    const unauthorized = await requestJson(`http://${HOST}:${PORT}/api/admin/summary`);
    assert.strictEqual(unauthorized.status, 401);

    const invalidBooking = await requestJson(`http://${HOST}:${PORT}/api/hailin/bookings`, {
      method: 'POST',
      body: JSON.stringify({ people: 2 })
    });
    assert.strictEqual(invalidBooking.status, 400);

    const booking = await requestJson(`http://${HOST}:${PORT}/api/hailin/bookings`, {
      method: 'POST',
      body: JSON.stringify({
        service: '讲解预约',
        date: '2026-07-09',
        people: 3,
        contact: '13800000000'
      })
    });
    assert.strictEqual(booking.status, 201);
    assert.ok(booking.body.data.id);

    const secondBooking = await requestJson(`http://${HOST}:${PORT}/api/hailin/bookings`, {
      method: 'POST',
      body: JSON.stringify({
        service: '团建定制',
        date: '2026-07-10',
        people: 8,
        contact: '13700000000',
        remark: '需要安排午餐'
      })
    });
    assert.strictEqual(secondBooking.status, 201);

    const feedback = await requestJson(`http://${HOST}:${PORT}/api/hailin/feedback`, {
      method: 'POST',
      body: JSON.stringify({
        nickname: '游客A',
        contact: '13900000000',
        content: '希望增加停车指引'
      })
    });
    assert.strictEqual(feedback.status, 201);
    assert.ok(feedback.body.data.id);

    const authHeaders = { Authorization: `Bearer ${ADMIN_TOKEN}` };
    const summary = await requestJson(`http://${HOST}:${PORT}/api/admin/summary`, { headers: authHeaders });
    assert.strictEqual(summary.status, 200);
    assert.strictEqual(summary.body.data.counts.bookings.total, 2);
    assert.strictEqual(summary.body.data.counts.feedback.total, 1);
    assert.strictEqual(summary.body.data.system.aiProvider, 'local');

    const list = await requestJson(`http://${HOST}:${PORT}/api/admin/bookings?status=new`, { headers: authHeaders });
    assert.strictEqual(list.status, 200);
    assert.strictEqual(list.body.data.items.length, 2);

    const updated = await requestJson(`http://${HOST}:${PORT}/api/admin/bookings/${booking.body.data.id}/status`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ status: 'confirmed', note: '电话已确认' })
    });
    assert.strictEqual(updated.status, 200);
    assert.strictEqual(updated.body.data.status, 'confirmed');
    assert.strictEqual(updated.body.data.adminNote, '电话已确认');

    const secondUpdated = await requestJson(`http://${HOST}:${PORT}/api/admin/bookings/${secondBooking.body.data.id}/status`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ status: 'confirmed', note: '第二条预约已确认' })
    });
    assert.strictEqual(secondUpdated.status, 200);
    assert.strictEqual(secondUpdated.body.data.status, 'confirmed');

    const bulkUpdated = await requestJson(`http://${HOST}:${PORT}/api/admin/bookings/bulk-status`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({
        ids: [booking.body.data.id, secondBooking.body.data.id],
        status: 'completed',
        note: '批量完成回访'
      })
    });
    assert.strictEqual(bulkUpdated.status, 200);
    assert.strictEqual(bulkUpdated.body.data.updated, 2);
    assert.ok(bulkUpdated.body.data.items.every((item) => item.status === 'completed'));
    assert.ok(bulkUpdated.body.data.items.every((item) => item.adminNote === '批量完成回访'));

    const exportResponse = await request(`http://${HOST}:${PORT}/api/admin/export?type=bookings`, {
      headers: authHeaders
    });
    assert.strictEqual(exportResponse.status, 200);
    assert.match(exportResponse.headers.get('content-type'), /text\/csv/);
    assert.match(await exportResponse.text(), /讲解预约/);
  } finally {
    await stopProcess(backend);
    fs.rmSync(storageDir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
