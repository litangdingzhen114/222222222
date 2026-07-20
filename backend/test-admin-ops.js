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
  const apiSource = fs.readFileSync(path.join(__dirname, 'admin-src', 'src', 'api.ts'), 'utf8');
  const bookingsPage = fs.readFileSync(path.join(__dirname, 'admin-src', 'src', 'pages', 'BookingsPage.tsx'), 'utf8');
  const auditPage = fs.readFileSync(path.join(__dirname, 'admin-src', 'src', 'pages', 'AuditPage.tsx'), 'utf8');
  const homePage = fs.readFileSync(path.join(__dirname, 'admin-src', 'src', 'pages', 'HomeContentPage.tsx'), 'utf8');
  const livePage = fs.readFileSync(path.join(__dirname, 'admin-src', 'src', 'pages', 'LiveContentPage.tsx'), 'utf8');
  const resourcePage = fs.readFileSync(path.join(__dirname, 'admin-src', 'src', 'pages', 'ResourceContentPage.tsx'), 'utf8');
  const ordersPage = fs.readFileSync(path.join(__dirname, 'admin-src', 'src', 'pages', 'OrdersPage.tsx'), 'utf8');
  const systemPage = fs.readFileSync(path.join(__dirname, 'admin-src', 'src', 'pages', 'SystemPage.tsx'), 'utf8');
  const detailDrawer = fs.readFileSync(path.join(__dirname, 'admin-src', 'src', 'pages', 'RecordDetailDrawer.tsx'), 'utf8');
  assert(adminHtml.includes('/admin/assets/'), 'admin dashboard should be built as static assets');
  assert(apiSource.includes('/api/admin/audit'), 'admin dashboard should load audit trail');
  assert(apiSource.includes('/api/admin/backup'), 'admin dashboard should download JSON backup');
  assert(apiSource.includes('/api/admin/home-content'), 'admin dashboard should manage home content');
  assert(apiSource.includes('/api/admin/lives'), 'admin dashboard should manage live stream content');
  assert(apiSource.includes('/api/admin/resources'), 'admin dashboard should manage resource content');
  assert(apiSource.includes('/api/admin/orders'), 'admin dashboard should manage order fulfillment');
  assert(auditPage.includes('fetchBackupBlob'), 'admin dashboard should expose one-click backup');
  assert(homePage.includes('json-editor'), 'admin dashboard should render home content editor');
  assert(livePage.includes('saveLiveContent'), 'admin dashboard should save live stream points');
  assert(livePage.includes('Switch'), 'admin dashboard should toggle live stream points');
  assert(resourcePage.includes('saveResourceContent'), 'admin dashboard should save resource content');
  assert(resourcePage.includes('map-points'), 'admin dashboard should manage map points');
  assert(ordersPage.includes('updateOrderFulfillment'), 'admin dashboard should update order fulfillment');
  assert(ordersPage.includes('trackingNo'), 'admin dashboard should handle shipment tracking numbers');
  assert(ordersPage.includes("fetchExportBlob('orders'"), 'admin dashboard should export orders');
  assert(systemPage.includes("fetchExportBlob('orders'"), 'system page should export orders');
  assert(bookingsPage.includes('rowSelection'), 'admin dashboard should support table row selection');
  assert(detailDrawer.includes('maskContact'), 'admin dashboard should mask contact info in tables');

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

    const productOrder = await requestJson(`http://${HOST}:${PORT}/api/hailin/orders`, {
      method: 'POST',
      body: JSON.stringify({
        clientId: 'client-admin-ops',
        orderType: 'product',
        featureId: 'mall',
        service: '共富集市采购意向',
        item: '稻鱼米礼盒',
        date: '2026-07-12',
        people: 2,
        contact: '13600000000',
        price: '98元起',
        remark: '需要发货'
      })
    });
    assert.strictEqual(productOrder.status, 201);
    assert.strictEqual(productOrder.body.data.status, 'new');
    assert(productOrder.body.data.orderNo, 'order should generate order number');

    const adminOrders = await requestJson(`http://${HOST}:${PORT}/api/admin/orders?type=product`, {
      headers: authHeaders
    });
    assert.strictEqual(adminOrders.status, 200);
    assert(adminOrders.body.data.items.some((item) => item.id === productOrder.body.data.id), 'admin should list product order');
    assert.strictEqual(adminOrders.body.data.stats.total, 1);
    assert.strictEqual(adminOrders.body.data.stats.new, 1);
    assert.strictEqual(adminOrders.body.data.stats.actionRequired, 1);

    const confirmedOrder = await requestJson(`http://${HOST}:${PORT}/api/admin/orders/${productOrder.body.data.id}/fulfillment`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ status: 'confirmed', note: '已确认库存' })
    });
    assert.strictEqual(confirmedOrder.status, 200);
    assert.strictEqual(confirmedOrder.body.data.status, 'confirmed');

    const pendingShipmentOrder = await requestJson(`http://${HOST}:${PORT}/api/admin/orders/${productOrder.body.data.id}/fulfillment`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ status: 'pending_shipment', note: '等待打包发货' })
    });
    assert.strictEqual(pendingShipmentOrder.status, 200);
    assert.strictEqual(pendingShipmentOrder.body.data.status, 'pending_shipment');

    const shippedOrder = await requestJson(`http://${HOST}:${PORT}/api/admin/orders/${productOrder.body.data.id}/fulfillment`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({
        status: 'shipped',
        carrier: '顺丰速运',
        trackingNo: 'SF1234567890',
        note: '后台填写发货信息'
      })
    });
    assert.strictEqual(shippedOrder.status, 200);
    assert.strictEqual(shippedOrder.body.data.status, 'shipped');
    assert.strictEqual(shippedOrder.body.data.logistics.trackingNo, 'SF1234567890');

    const publicOrderDetail = await requestJson(`http://${HOST}:${PORT}/api/hailin/orders/${productOrder.body.data.id}?clientId=client-admin-ops`);
    assert.strictEqual(publicOrderDetail.status, 200);
    assert.strictEqual(publicOrderDetail.body.data.status, 'shipped');
    assert.strictEqual(publicOrderDetail.body.data.logistics.carrier, '顺丰速运');

    const shippedAdminOrders = await requestJson(`http://${HOST}:${PORT}/api/admin/orders?type=product&status=shipped`, {
      headers: authHeaders
    });
    assert.strictEqual(shippedAdminOrders.status, 200);
    assert.strictEqual(shippedAdminOrders.body.data.stats.shipped, 1);
    assert.strictEqual(shippedAdminOrders.body.data.stats.actionRequired, 0);

    const orderCsvResponse = await request(`http://${HOST}:${PORT}/api/admin/export?type=orders`, {
      headers: authHeaders
    });
    assert.strictEqual(orderCsvResponse.status, 200);
    assert.match(orderCsvResponse.headers.get('content-type'), /text\/csv/);
    assert.match(orderCsvResponse.headers.get('content-disposition'), /hailin-orders/);
    const orderCsv = await orderCsvResponse.text();
    assert(orderCsv.includes(productOrder.body.data.orderNo), 'order CSV should include order number');
    assert(orderCsv.includes('SF1234567890'), 'order CSV should include shipment tracking number');

    const homeContent = await requestJson(`http://${HOST}:${PORT}/api/admin/home-content`, {
      headers: authHeaders
    });
    assert.strictEqual(homeContent.status, 200);
    assert(Array.isArray(homeContent.body.data.content.banners));
    assert(homeContent.body.data.content.banners.length > 0);
    assert(Array.isArray(homeContent.body.data.content.itineraries));
    assert(homeContent.body.data.content.itineraries.length >= 3);
    assert(Array.isArray(homeContent.body.data.content.serviceCards));
    assert(homeContent.body.data.content.serviceCards.length >= 4);
    assert.strictEqual(homeContent.body.data.meta.source, 'defaults');

    const editedHome = {
      ...homeContent.body.data.content,
      notice: 'Admin edited home notice',
      weather: 'Admin edited weather',
      banners: homeContent.body.data.content.banners.map((item, index) => (
        index === 0 ? { ...item, title: 'Admin edited banner' } : item
      ))
    };
    const savedHome = await requestJson(`http://${HOST}:${PORT}/api/admin/home-content`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({ content: editedHome })
    });
    assert.strictEqual(savedHome.status, 200);
    assert.strictEqual(savedHome.body.data.content.notice, 'Admin edited home notice');
    assert.strictEqual(savedHome.body.data.meta.source, 'storage');

    const publicHome = await requestJson(`http://${HOST}:${PORT}/api/hailin/home`);
    assert.strictEqual(publicHome.status, 200);
    assert.strictEqual(publicHome.body.data.notice, 'Admin edited home notice');
    assert.strictEqual(publicHome.body.data.weather, 'Admin edited weather');
    assert.strictEqual(publicHome.body.data.banners[0].title, 'Admin edited banner');
    assert(publicHome.body.data.itineraries.length >= 3);
    assert(publicHome.body.data.serviceCards.length >= 4);

    const liveContent = await requestJson(`http://${HOST}:${PORT}/api/admin/lives`, {
      headers: authHeaders
    });
    assert.strictEqual(liveContent.status, 200);
    assert(Array.isArray(liveContent.body.data.items));
    assert(liveContent.body.data.items.length > 0);
    assert.strictEqual(liveContent.body.data.meta.source, 'defaults');

    const disabledLive = liveContent.body.data.items[1];
    const editedLiveItems = liveContent.body.data.items.map((item, index) => {
      if (index === 0) {
        return {
          ...item,
          title: 'Admin edited live point',
          liveUrl: 'https://cdn.example.com/hailin-live.mp4',
          hlsUrl: '',
          viewers: 456,
          enabled: true,
          sortOrder: 1
        };
      }
      if (index === 1) return { ...item, enabled: false };
      return item;
    });
    const savedLives = await requestJson(`http://${HOST}:${PORT}/api/admin/lives`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({ items: editedLiveItems })
    });
    assert.strictEqual(savedLives.status, 200);
    assert.strictEqual(savedLives.body.data.meta.source, 'storage');
    assert.strictEqual(savedLives.body.data.items[0].title, 'Admin edited live point');
    assert.strictEqual(savedLives.body.data.meta.stats.customSources, 1);

    const publicLives = await requestJson(`http://${HOST}:${PORT}/api/hailin/lives`);
    assert.strictEqual(publicLives.status, 200);
    assert(publicLives.body.data.some((item) => item.title === 'Admin edited live point'));
    assert(publicLives.body.data.some((item) => item.liveUrl === 'https://cdn.example.com/hailin-live.mp4'));
    if (disabledLive) {
      assert(!publicLives.body.data.some((item) => item.id === disabledLive.id), 'disabled live points should be hidden from public API');
    }

    const summaryAfterLives = await requestJson(`http://${HOST}:${PORT}/api/admin/summary`, {
      headers: authHeaders
    });
    assert.strictEqual(summaryAfterLives.status, 200);
    assert.strictEqual(summaryAfterLives.body.data.counts.lives.customSources, 1);

    const spotContent = await requestJson(`http://${HOST}:${PORT}/api/admin/resources/spots`, {
      headers: authHeaders
    });
    assert.strictEqual(spotContent.status, 200);
    assert(Array.isArray(spotContent.body.data.items));
    assert(spotContent.body.data.items.length > 0);
    assert.strictEqual(spotContent.body.data.meta.source, 'defaults');

    const editedSpots = spotContent.body.data.items.map((item, index) => (
      index === 0 ? { ...item, name: 'Admin edited spot', desc: '后台编辑后的景点内容' } : item
    ));
    const savedSpots = await requestJson(`http://${HOST}:${PORT}/api/admin/resources/spots`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({ items: editedSpots })
    });
    assert.strictEqual(savedSpots.status, 200);
    assert.strictEqual(savedSpots.body.data.meta.source, 'storage');
    assert.strictEqual(savedSpots.body.data.items[0].name, 'Admin edited spot');

    const publicSpots = await requestJson(`http://${HOST}:${PORT}/api/hailin/spots`);
    assert.strictEqual(publicSpots.status, 200);
    assert.strictEqual(publicSpots.body.data[0].name, 'Admin edited spot');

    const resourceSummary = await requestJson(`http://${HOST}:${PORT}/api/admin/summary`, {
      headers: authHeaders
    });
    assert.strictEqual(resourceSummary.status, 200);
    assert(resourceSummary.body.data.counts.resources.spots.total >= 1);

    const notedNewBooking = await requestJson(`http://${HOST}:${PORT}/api/admin/bookings/${booking.body.data.id}/status`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ status: 'new', note: '先记录待确认备注' })
    });
    assert.strictEqual(notedNewBooking.status, 200);
    assert.strictEqual(notedNewBooking.body.data.status, 'new');
    assert.strictEqual(notedNewBooking.body.data.lastHandledBy, 'ops-admin');
    assert(notedNewBooking.body.data.lastHandledAt, 'note-only update should record handled time');
    assert(notedNewBooking.body.data.statusHistory.some((item) => item.type === 'note' && item.note === '先记录待确认备注'), 'note-only update should append history');

    const updated = await requestJson(`http://${HOST}:${PORT}/api/admin/bookings/${booking.body.data.id}/status`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ status: 'confirmed', note: '电话确认通过' })
    });
    assert.strictEqual(updated.status, 200);
    assert.strictEqual(updated.body.data.status, 'confirmed');
    assert.strictEqual(updated.body.data.lastHandledBy, 'ops-admin');
    assert(updated.body.data.lastHandledAt, 'status update should record handled time');
    assert(updated.body.data.statusHistory.some((item) => item.fromStatus === 'new' && item.toStatus === 'confirmed'), 'status update should append history');

    const invalidBookingTransition = await requestJson(`http://${HOST}:${PORT}/api/admin/bookings/${booking.body.data.id}/status`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ status: 'new', note: '不能回退到待确认' })
    });
    assert.strictEqual(invalidBookingTransition.status, 409);

    const completedBulk = await requestJson(`http://${HOST}:${PORT}/api/admin/bookings/bulk-status`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ ids: [booking.body.data.id], status: 'completed', note: '批量完成接待' })
    });
    assert.strictEqual(completedBulk.status, 200);
    assert.strictEqual(completedBulk.body.data.updated, 1);
    assert.strictEqual(completedBulk.body.data.items[0].status, 'completed');
    assert.strictEqual(completedBulk.body.data.items[0].adminNote, '批量完成接待');
    assert(completedBulk.body.data.items[0].completedAt, 'completed booking should record completedAt');

    const resolvedFeedback = await requestJson(`http://${HOST}:${PORT}/api/admin/feedback/${feedback.body.data.id}/status`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ status: 'resolved', note: '已电话回复游客' })
    });
    assert.strictEqual(resolvedFeedback.status, 200);
    assert.strictEqual(resolvedFeedback.body.data.status, 'resolved');
    assert(resolvedFeedback.body.data.resolvedAt, 'resolved feedback should record resolvedAt');

    const invalidFeedbackTransition = await requestJson(`http://${HOST}:${PORT}/api/admin/feedback/${feedback.body.data.id}/status`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ status: 'new', note: '不能回退到待处理' })
    });
    assert.strictEqual(invalidFeedbackTransition.status, 409);

    const audit = await requestJson(`http://${HOST}:${PORT}/api/admin/audit?pageSize=20`, {
      headers: authHeaders
    });
    assert.strictEqual(audit.status, 200);
    assert(audit.body.data.items.some((item) => item.action === 'booking.status.updated'), 'status update should be audited');
    assert(audit.body.data.items.some((item) => item.action === 'booking.bulk-status.updated'), 'bulk status update should be audited');
    assert(audit.body.data.items.some((item) => item.action === 'feedback.status.updated'), 'feedback status update should be audited');
    assert(audit.body.data.items.some((item) => item.action === 'home-content.updated'), 'home content update should be audited');
    assert(audit.body.data.items.some((item) => item.action === 'lives-content.updated'), 'live content update should be audited');
    assert(audit.body.data.items.some((item) => item.action === 'resource-content.updated'), 'resource content update should be audited');
    assert(audit.body.data.items.some((item) => item.action === 'order.created'), 'public order creation should be audited');
    assert(audit.body.data.items.some((item) => item.action === 'order.fulfillment.updated'), 'order fulfillment update should be audited');
    assert(audit.body.data.items.some((item) => item.action === 'orders.csv.exported'), 'order export should be audited');
    assert(audit.body.data.items.some((item) => item.action === 'booking.created'), 'public booking creation should be audited');
    assert(audit.body.data.items.some((item) => item.action === 'feedback.created'), 'public feedback creation should be audited');
    const statusAudit = audit.body.data.items.find((item) => item.action === 'booking.status.updated' && item.detail.status === 'confirmed');
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
    assert.strictEqual(backup.data.bookings[0].status, 'completed');
    assert.strictEqual(backup.data.bookings[0].lastHandledBy, 'ops-admin');
    assert(backup.data.bookings[0].statusHistory.length >= 3);
    assert.strictEqual(backup.data.feedback[0].status, 'resolved');
    assert(backup.data.feedback[0].statusHistory.length >= 2);
    assert.strictEqual(backup.data.orders[0].status, 'shipped');
    assert.strictEqual(backup.data.homeContent.content.notice, 'Admin edited home notice');
    assert.strictEqual(backup.data.liveContent.items[0].title, 'Admin edited live point');
    assert(backup.data.audit.length >= 3);

    const resetLives = await requestJson(`http://${HOST}:${PORT}/api/admin/lives/reset`, {
      method: 'POST',
      headers: authHeaders
    });
    assert.strictEqual(resetLives.status, 200);
    assert.strictEqual(resetLives.body.data.meta.source, 'defaults');

    const resetPublicLives = await requestJson(`http://${HOST}:${PORT}/api/hailin/lives`);
    assert.strictEqual(resetPublicLives.status, 200);
    assert.notStrictEqual(resetPublicLives.body.data[0].title, 'Admin edited live point');

    const resetHome = await requestJson(`http://${HOST}:${PORT}/api/admin/home-content/reset`, {
      method: 'POST',
      headers: authHeaders
    });
    assert.strictEqual(resetHome.status, 200);
    assert.strictEqual(resetHome.body.data.meta.source, 'defaults');

    const resetPublicHome = await requestJson(`http://${HOST}:${PORT}/api/hailin/home`);
    assert.strictEqual(resetPublicHome.status, 200);
    assert.notStrictEqual(resetPublicHome.body.data.notice, 'Admin edited home notice');
  } finally {
    await stopProcess(backend);
    fs.rmSync(storageDir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
