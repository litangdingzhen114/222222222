const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const NODE = process.execPath;

function runNode(code, env = {}) {
  return new Promise((resolve) => {
    const child = spawn(NODE, ['-e', code], {
      cwd: ROOT,
      env: {
        ...process.env,
        NODE_ENV: 'test',
        PORT: '18987',
        ...env,
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill();
    }, 2500);

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({ code, stdout, stderr, timedOut });
    });
  });
}

async function main() {
  const importResult = await runNode(`
    const mod = require('./backend/server.js');
    if (typeof mod.handleRequest !== 'function') throw new Error('missing handleRequest export');
    if (typeof mod.bootstrap !== 'function') throw new Error('missing bootstrap export');
    console.log('server import safe');
  `);

  assert.strictEqual(
    importResult.timedOut,
    false,
    'server module should not listen forever when imported by Vercel',
  );
  assert.strictEqual(importResult.code, 0, importResult.stderr || importResult.stdout);
  assert.match(importResult.stdout, /server import safe/);

  const handler = require('../api/index.js');
  assert.strictEqual(
    typeof handler,
    'function',
    'api/index.js should export a Vercel function handler',
  );

  const vercelConfig = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'));
  const rewriteSources = vercelConfig.rewrites.map((rewrite) => rewrite.source);
  assert.ok(
    rewriteSources.includes('/api/(.*)'),
    'Vercel should route API requests to the backend function',
  );
  assert.ok(
    rewriteSources.includes('/admin/(.*)'),
    'Vercel should route admin pages to the backend function',
  );
  assert.ok(
    !rewriteSources.includes('/media/(.*)'),
    'Vercel should serve live video media as static files instead of proxying through the function',
  );
  assert.ok(
    fs.existsSync(path.join(ROOT, 'backend/admin-src/public/media/hailin-live.mp4')),
    'Vercel should have a public live video asset copied by the admin build',
  );
  assert.ok(
    rewriteSources.includes('/assets/(.*)'),
    'Vercel should route shared media assets to the backend function',
  );
  assert.ok(
    rewriteSources.includes('/health'),
    'Vercel should route health checks to the backend function',
  );

  const adminOrderSources = [
    'backend/admin-src/src/App.tsx',
    'backend/admin-src/src/pages/DashboardPage.tsx',
    'backend/admin-src/src/pages/OrdersPage.tsx',
    'backend/admin-src/src/types.ts',
  ]
    .map((file) => fs.readFileSync(path.join(ROOT, file), 'utf8'))
    .join('\n');
  assert(
    !/支付订单|待支付|已支付|商城订单|成交金额|今日成交|退款中|已退款/.test(adminOrderSources),
    'admin order workspace should use preorder/offline-confirmation copy for personal mini program',
  );
}

main()
  .then(() => {
    console.log('vercel adapter checks ok');
  })
  .catch((error) => {
    console.error(error.stack || error.message);
    process.exit(1);
  });
