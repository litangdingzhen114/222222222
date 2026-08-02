const fs = require('fs');
const path = require('path');
const automator = require('miniprogram-automator');

const PROJECT_PATH = path.resolve(__dirname, '..');
const CLI_PATH = '/Applications/wechatwebdevtools.app/Contents/MacOS/cli';
const OUTPUT_DIR = path.resolve(PROJECT_PATH, 'docs', 'project-presentation', 'screenshots', 'original');
const REQUESTED_CAPTURES = new Set(process.argv.slice(2));

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function capturePage(miniProgram, options) {
  const { name, path: pagePath, wait = 2000, action } = options;
  if (REQUESTED_CAPTURES.size && !REQUESTED_CAPTURES.has(name)) return null;
  console.log(`Capturing: ${name} -> ${pagePath}`);
  const page = await miniProgram.reLaunch(pagePath);
  await page.waitFor(wait);
  if (action) {
    await action(page, miniProgram);
    await page.waitFor(800);
  }
  const outputPath = path.join(OUTPUT_DIR, `${name}.png`);
  await miniProgram.screenshot({ path: outputPath });
  console.log(`Saved: ${outputPath}`);
  return outputPath;
}

async function main() {
  await ensureDir(OUTPUT_DIR);
  console.log('Launching WeChat Developer Tools...');
  const miniProgram = await automator.launch({
    cliPath: CLI_PATH,
    projectPath: PROJECT_PATH,
  });

  const runtimeIssues = [];
  miniProgram.on('exception', (issue) => {
    runtimeIssues.push({ type: 'exception', issue });
  });
  miniProgram.on('console', (entry) => {
    const level = String(entry && (entry.level || entry.type || '')).toLowerCase();
    if (level === 'error') runtimeIssues.push({ type: 'console', entry });
  });

  try {
    await capturePage(miniProgram, {
      name: '01-首页-首屏',
      path: '/pages/home/home',
      wait: 3500,
      action: async (page) => {
        const banner = await page.$('.banner-swiper');
        if (banner) await banner.swipeTo(0);
        await sleep(500);
      },
    });
    await capturePage(miniProgram, {
      name: '02-首页-服务与推荐',
      path: '/pages/home/home',
      wait: 3000,
      action: async (_page, miniProgram) => {
        await miniProgram.pageScrollTo(480);
      },
    });
    await capturePage(miniProgram, { name: '03-景点列表', path: '/pages/spot-list/spot-list', wait: 3000 });
    await capturePage(miniProgram, {
      name: '04-景点详情-田铺驿站',
      path: '/pages/spot-detail/spot-detail?id=tianpu-station',
      wait: 3500,
    });
    await capturePage(miniProgram, {
      name: '05-景点详情-海林溪谷',
      path: '/pages/spot-detail/spot-detail?id=creek-trail',
      wait: 3500,
    });
    await capturePage(miniProgram, {
      name: '06-景点详情-村树陈嵘栲',
      path: '/pages/spot-detail/spot-detail?id=ancient-tree',
      wait: 3500,
    });
    await capturePage(miniProgram, { name: '07-地图导览', path: '/pages/map/map', wait: 3500 });
    await capturePage(miniProgram, {
      name: '08-智能导游',
      path: '/pages/ai-guide/ai-guide?question=%E5%8D%8A%E6%97%A5%E8%B7%AF%E7%BA%BF',
      wait: 6000,
    });
    await capturePage(miniProgram, { name: '09-路线推荐', path: '/pages/route-list/route-list', wait: 3000 });
    await capturePage(miniProgram, { name: '10-直播列表', path: '/pages/live-list/live-list', wait: 3000 });
    await capturePage(miniProgram, {
      name: '11-直播详情',
      path: '/pages/live-detail/live-detail?id=square',
      wait: 3500,
    });
    await capturePage(miniProgram, { name: '12-讲解预约-服务选择', path: '/pages/booking/booking', wait: 3500 });
    await capturePage(miniProgram, {
      name: '13-讲解预约-信息填写',
      path: '/pages/booking/booking',
      wait: 3000,
      action: async (_page, miniProgram) => {
        await miniProgram.pageScrollTo(900);
      },
    });
    await capturePage(miniProgram, {
      name: '14-研学报名',
      path: '/pages/mine-feature/mine-feature?id=activity',
      wait: 3500,
    });
    await capturePage(miniProgram, {
      name: '15-民宿预订',
      path: '/pages/mine-feature/mine-feature?id=stay',
      wait: 3500,
    });

    await miniProgram.callWxMethod('setStorageSync', 'hailin-product-cart-v1', []);
    await capturePage(miniProgram, { name: '16-商城-商品列表', path: '/pages/product-list/product-list', wait: 3500 });
    await capturePage(miniProgram, {
      name: '17-商城-商品详情',
      path: '/pages/product-list/product-list?id=native-eggs',
      wait: 3500,
    });
    await capturePage(miniProgram, {
      name: '18-商城-确认清单',
      path: '/pages/product-list/product-list?id=native-eggs',
      wait: 3500,
      action: async (page) => {
        const buyButton = await page.$('.detail-buy-button');
        if (buyButton) await buyButton.tap();
        await sleep(800);
      },
    });
    await capturePage(miniProgram, {
      name: '19-商城-收货信息',
      path: '/pages/product-list/product-list?id=mountain-honey',
      wait: 3500,
      action: async (page) => {
        const buyButton = await page.$('.detail-buy-button');
        if (buyButton) await buyButton.tap();
        await sleep(600);
        const inputs = await page.$$('.checkout-input');
        if (inputs[0]) await inputs[0].input('林女士');
        if (inputs[1]) await inputs[1].input('13800000000');
        const cartScroll = await page.$('.cart-scroll');
        if (cartScroll) await cartScroll.scrollTo(0, 520);
        await sleep(800);
      },
    });
    await capturePage(miniProgram, { name: '20-订单列表', path: '/pages/order-list/order-list', wait: 3500 });
    await capturePage(miniProgram, {
      name: '21-订单详情',
      path: '/pages/order-list/order-list',
      wait: 3200,
      action: async (page) => {
        const orderCard = await page.$('.order-card');
        if (orderCard) await orderCard.tap();
        await sleep(1500);
      },
    });
    await capturePage(miniProgram, { name: '22-个人中心', path: '/pages/mine/mine', wait: 3000 });
    await capturePage(miniProgram, { name: '23-意见反馈', path: '/pages/feedback/feedback', wait: 3000 });

    console.log('All screenshots captured.');
    if (runtimeIssues.length) {
      console.log(`Runtime issues captured: ${runtimeIssues.length}`);
      console.log(JSON.stringify(runtimeIssues, null, 2));
    } else {
      console.log('Runtime issues captured: 0');
    }
  } catch (err) {
    console.error('Screenshot capture failed:', err);
  } finally {
    await miniProgram.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
