const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', '..');
const serviceConfig = require('../config/service');
const backendServer = fs.readFileSync(path.join(root, 'backend/server.js'), 'utf8');
const adminApi = fs.readFileSync(path.join(root, 'backend/admin-src/src/api.ts'), 'utf8');
const contentService = fs.readFileSync(path.join(root, 'miniprogram/services/content.js'), 'utf8');

const publicContract = [
  ['home', 'GET'],
  ['mapPoints', 'GET'],
  ['foods', 'GET'],
  ['spots', 'GET'],
  ['routes', 'GET'],
  ['products', 'GET'],
  ['lives', 'GET'],
  ['aiGuide', 'POST'],
  ['booking', 'POST'],
  ['feedback', 'POST'],
  ['orders', 'GET'],
  ['orders', 'POST']
];

publicContract.forEach(([key, method]) => {
  const endpoint = serviceConfig.endpoints[key];
  assert(endpoint, `missing serviceConfig endpoint: ${key}`);
  assert(endpoint.startsWith('/api/hailin/'), `${key} should use public hailin API: ${endpoint}`);
  assert(!endpoint.startsWith('/api/admin/'), `${key} must not call admin API directly`);
  assert(
    backendServer.includes(`route === '${method} ${endpoint}'`),
    `${method} ${endpoint} should be implemented by backend/server.js`
  );
});

['home', 'mapPoints', 'foods', 'spots', 'routes', 'products', 'lives'].forEach((key) => {
  const endpoint = serviceConfig.v1Endpoints[key];
  assert(endpoint, `missing v1 serviceConfig endpoint: ${key}`);
  assert(endpoint.startsWith('/api/v1/'), `${key} should prefer formal v1 API: ${endpoint}`);
});
assert(contentService.includes('withContentFallback'), 'content service should prefer v1 and fall back safely');
assert(contentService.includes('adaptMapPoints'), 'content service should adapt v1 map points to page data');

[
  ['GET', '/api/admin/session'],
  ['GET', '/api/admin/summary'],
  ['GET', '/api/admin/home-content'],
  ['PUT', '/api/admin/home-content'],
  ['POST', '/api/admin/home-content/reset'],
  ['GET', '/api/admin/lives'],
  ['PUT', '/api/admin/lives'],
  ['POST', '/api/admin/lives/reset'],
  ['GET', '/api/admin/resources'],
  ['GET', '/api/admin/bookings'],
  ['GET', '/api/admin/feedback'],
  ['GET', '/api/admin/orders'],
  ['GET', '/api/admin/audit'],
  ['GET', '/api/admin/backup'],
  ['GET', '/api/admin/export']
].forEach(([method, endpoint]) => {
  assert(
    backendServer.includes(`route === '${method} ${endpoint}'`),
    `${method} ${endpoint} should be implemented by backend/server.js`
  );
});

[
  '/admin/auth/login',
  '/auth/refresh',
  '/admin/me',
  '/admin/dashboard',
  '/admin/config-status',
  '/home',
  '/cameras',
  'reservation-orders',
  'feedback',
  'orders',
  '/admin/audit-logs'
].forEach((endpoint) => {
  assert(adminApi.includes(endpoint), `admin frontend should call ${endpoint}`);
});

[
  ['PATCH', '/api/admin/bookings/bulk-status'],
  ['PATCH', '/api/admin/feedback/bulk-status']
].forEach(([method, endpoint]) => {
  assert(
    backendServer.includes(`route === '${method} ${endpoint}'`),
    `${method} ${endpoint} should be implemented by backend/server.js`
  );
});

assert(
  backendServer.includes('PATCH \\/api\\/admin\\/bookings\\/([^/]+)\\/status'),
  'booking detail status route should be implemented'
);
assert(
  backendServer.includes('PATCH \\/api\\/admin\\/feedback\\/([^/]+)\\/status'),
  'feedback detail status route should be implemented'
);
assert(
  backendServer.includes('GET \\/api\\/admin\\/orders\\/([^/]+)'),
  'admin order detail route should be implemented'
);
assert(
  backendServer.includes('PATCH \\/api\\/admin\\/orders\\/([^/]+)\\/fulfillment'),
  'admin order fulfillment route should be implemented'
);
assert(
  backendServer.includes('GET \\/api\\/hailin\\/orders\\/([^/]+)'),
  'public order detail route should be implemented'
);
assert(
  backendServer.includes('PATCH \\/api\\/hailin\\/orders\\/([^/]+)\\/cancel'),
  'public order cancel route should be implemented'
);
assert(
  backendServer.includes('GET \\/api\\/admin\\/resources\\/([^/]+)'),
  'resource detail route should be implemented'
);
assert(
  backendServer.includes('PUT \\/api\\/admin\\/resources\\/([^/]+)'),
  'resource save route should be implemented'
);
assert(
  backendServer.includes('POST \\/api\\/admin\\/resources\\/([^/]+)\\/reset'),
  'resource reset route should be implemented'
);
assert(adminApi.includes('updateAdminResource<RawReservationOrder>'), 'admin frontend should update reservation status through v1 resources');
assert(adminApi.includes('updateAdminResource<RawFeedback>'), 'admin frontend should update feedback status through v1 resources');
assert(adminApi.includes('payload.ids.map'), 'admin frontend should support bulk status updates');
assert(adminApi.includes('/admin/orders/${encodeURIComponent(id)}/ship'), 'admin frontend should call order shipment route');
assert(adminApi.includes('resourceEndpointMap'), 'admin frontend should route resource reads to v1 public resources');
assert(adminApi.includes('resetResourceContent'), 'admin frontend should support resource reset flow');
assert.strictEqual(serviceConfig.live.provider, 'backend');
assert.strictEqual(serviceConfig.ai.provider, 'backend-proxy');

console.log('api contract coverage ok');
