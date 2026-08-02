const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

let playwright;
try {
  playwright = require('playwright');
} catch {
  playwright = require('/Users/zz/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
}

const ROOT = path.resolve(__dirname, '..');
const HOST = '127.0.0.1';
const PORT = Number(process.env.ADMIN_CAPTURE_PORT || 18990);
const BASE_URL = `http://${HOST}:${PORT}`;
const OUTPUT_DIR = path.join(ROOT, 'docs', 'project-presentation', 'admin-screenshots', 'latest');
const ADMIN_USER = 'hailin-admin';
const ADMIN_PASSWORD = 'capture-password-2026';
const ADMIN_TOKEN = 'capture-admin-token-2026';

const pages = [
  ['01-登录页', '/admin/'],
  ['02-数据概览', '/admin/#/dashboard'],
  ['03-首页运营', '/admin/#/home-content'],
  ['04-内容资源', '/admin/#/resources'],
  ['05-农品预订', '/admin/#/orders'],
  ['06-采摘预约', '/admin/#/bookings'],
  ['07-直播设备', '/admin/#/lives'],
  ['08-用户反馈', '/admin/#/feedback'],
  ['09-系统设置', '/admin/#/system'],
  ['10-操作日志', '/admin/#/audit'],
];

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForBackend() {
  const deadline = Date.now() + 12000;
  let lastError;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${BASE_URL}/health`);
      if (response.ok) return;
    } catch (error) {
      lastError = error;
    }
    await wait(160);
  }
  throw lastError || new Error('backend did not become ready');
}

function stopProcess(child) {
  return new Promise((resolve) => {
    if (!child || child.exitCode !== null || child.signalCode !== null) return resolve();
    child.once('exit', resolve);
    child.kill();
  });
}

async function login(page) {
  await page.goto(`${BASE_URL}/admin/`, { waitUntil: 'networkidle' });
  await page.getByLabel('管理员账号').fill(ADMIN_USER);
  await page.getByLabel('管理员密码').fill(ADMIN_PASSWORD);
  await page.getByRole('button', { name: '登录后台' }).click();
  await page.waitForURL(/#\/dashboard|\/admin\/?$/, { timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(1200);
}

async function capture(page, name, route) {
  await page.goto(`${BASE_URL}${route}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1300);
  const filePath = path.join(OUTPUT_DIR, `${name}.png`);
  await page.screenshot({ path: filePath, fullPage: false });
  console.log(filePath);
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const storageDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hailin-admin-capture-'));
  const backend = spawn(process.execPath, [path.join(ROOT, 'backend', 'server.js')], {
    cwd: ROOT,
    env: {
      ...process.env,
      HOST,
      PORT: String(PORT),
      STORAGE_DIR: storageDir,
      ADMIN_USER,
      ADMIN_TOKEN,
      ADMIN_LOGIN_PASSWORD: ADMIN_PASSWORD,
      RATE_LIMIT_MAX: '1000',
      KIMI_API_KEY: '',
      MOONSHOT_API_KEY: '',
    },
    stdio: 'ignore',
  });

  let browser;
  try {
    await waitForBackend();
    browser = await playwright.chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1,
      locale: 'zh-CN',
    });
    const page = await context.newPage();

    await page.goto(`${BASE_URL}${pages[0][1]}`, { waitUntil: 'networkidle' });
    await page.getByLabel('管理员账号').fill('海林管理员');
    await page.getByLabel('管理员密码').fill('');
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(OUTPUT_DIR, `${pages[0][0]}.png`), fullPage: false });
    console.log(path.join(OUTPUT_DIR, `${pages[0][0]}.png`));
    await login(page);
    for (const [name, route] of pages.slice(1)) {
      await capture(page, name, route);
    }
  } finally {
    if (browser) await browser.close();
    await stopProcess(backend);
    fs.rmSync(storageDir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
