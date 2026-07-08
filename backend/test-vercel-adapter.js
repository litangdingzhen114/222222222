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
        ...env
      },
      stdio: ['ignore', 'pipe', 'pipe']
    });
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill();
    }, 900);

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

  assert.strictEqual(importResult.timedOut, false, 'server module should not listen forever when imported by Vercel');
  assert.strictEqual(importResult.code, 0, importResult.stderr || importResult.stdout);
  assert.match(importResult.stdout, /server import safe/);

  const handler = require('../api/index.js');
  assert.strictEqual(typeof handler, 'function', 'api/index.js should export a Vercel function handler');

  const vercelConfig = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'));
  const rewriteSources = vercelConfig.rewrites.map((rewrite) => rewrite.source);
  assert.ok(rewriteSources.includes('/api/(.*)'), 'Vercel should route API requests to the backend function');
  assert.ok(rewriteSources.includes('/admin/(.*)'), 'Vercel should route admin pages to the backend function');
  assert.ok(rewriteSources.includes('/media/(.*)'), 'Vercel should route media requests to the backend function');
  assert.ok(rewriteSources.includes('/health'), 'Vercel should route health checks to the backend function');
}

main()
  .then(() => {
    console.log('vercel adapter checks ok');
  })
  .catch((error) => {
    console.error(error.stack || error.message);
    process.exit(1);
  });
