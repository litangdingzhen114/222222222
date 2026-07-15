const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', '..');
const serviceConfig = require('../config/service');
const backendServer = fs.readFileSync(path.join(root, 'backend/server.js'), 'utf8');
const adminApi = fs.readFileSync(path.join(root, 'backend/admin-src/src/api.ts'), 'utf8');

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
  ['feedback', 'POST']
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
  ['GET', '/api/admin/audit'],
  ['GET', '/api/admin/backup'],
  ['GET', '/api/admin/export']
].forEach(([method, endpoint]) => {
  assert(
    backendServer.includes(`route === '${method} ${endpoint}'`),
    `${method} ${endpoint} should be implemented by backend/server.js`
  );
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
assert(adminApi.includes('/api/admin/${kind}/${id}/status'), 'admin frontend should call detail status route');
assert(adminApi.includes('/api/admin/${kind}/bulk-status'), 'admin frontend should call bulk status route');
assert(adminApi.includes('/api/admin/resources/${key}'), 'admin frontend should call resource detail route');
assert(adminApi.includes('/api/admin/resources/${key}/reset'), 'admin frontend should call resource reset route');
assert.strictEqual(serviceConfig.live.provider, 'backend');
assert.strictEqual(serviceConfig.ai.provider, 'backend-proxy');

console.log('api contract coverage ok');
