const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', '..');
const banners = require('../data/banners');
const gridPages = require('../data/homeGrids');
const recommend = require('../data/recommend');
const routes = require('../data/routes');
const spots = require('../data/spots');
const appConfig = require('../app.json');

const pageSet = new Set(appConfig.pages.map((page) => `/${page}`));
const tabSet = new Set((appConfig.tabBar.list || []).map((item) => `/${item.pagePath}`));
const routeIds = new Set(routes.map((item) => item.id));
const spotIds = new Set(spots.map((item) => item.id));

function assertNavigableUrl(url, label) {
  if (!url) return;
  const [page, query = ''] = url.split('?');
  assert(pageSet.has(page), `${label} target page should be registered: ${page}`);
  if (query.startsWith('id=') && page.includes('/route-detail/')) {
    assert(routeIds.has(query.slice(3)), `${label} target route should exist: ${query}`);
  }
  if (query.startsWith('id=') && page.includes('/spot-detail/')) {
    assert(spotIds.has(query.slice(3)), `${label} target spot should exist: ${query}`);
  }
}

assert(banners.length >= 4, 'home should have enough banner stories for a real first screen');
assert(banners.some((item) => item.title.includes('海口镇海林村')), 'banners should make the location explicit');
assert(recommend.hotRecommends.length >= 6, 'home should expose richer recommendations');
assert(recommend.itineraries.length >= 3, 'home should expose itinerary cards');
assert(recommend.serviceCards.length >= 4, 'home should expose visitor service cards');

recommend.itineraries.forEach((item) => {
  assert(item.title && item.time && item.route, `${item.id} itinerary needs title, time and route`);
  assert(Array.isArray(item.highlights) && item.highlights.length >= 2, `${item.id} itinerary needs highlights`);
  assertNavigableUrl(item.url, item.title);
});

recommend.serviceCards.forEach((item) => {
  assert(item.title && item.desc && item.actionText, `${item.id} service card needs actionable copy`);
  assertNavigableUrl(item.url, item.title);
  if (item.openType === 'switchTab') {
    assert(tabSet.has(item.url), `${item.title} switchTab target should be a tab`);
  }
});

gridPages.flatMap((page) => page.items).forEach((item) => {
  assertNavigableUrl(item.url, item.title);
  if (item.openType === 'switchTab') {
    assert(tabSet.has(item.url), `${item.title} switchTab target should be a tab`);
  }
});

const homeJs = fs.readFileSync(path.join(root, 'miniprogram/pages/home/home.js'), 'utf8');
const homeWxml = fs.readFileSync(path.join(root, 'miniprogram/pages/home/home.wxml'), 'utf8');
const homeWxss = fs.readFileSync(path.join(root, 'miniprogram/pages/home/home.wxss'), 'utf8');
const backendServer = fs.readFileSync(path.join(root, 'backend/server.js'), 'utf8');
const homeDataSnapshot = JSON.stringify({
  banners,
  recommend
});

assert(homeJs.includes('itineraries'), 'home page should load itinerary data');
assert(homeJs.includes('serviceCards'), 'home page should load service card data');
assert(homeJs.includes('navigateByDataset'), 'home page should share navigation behavior');
assert(homeWxml.includes('今日这样游'), 'home page should render itinerary section');
assert(homeWxml.includes('到村服务'), 'home page should render service section');
assert(homeWxss.includes('itinerary-card'), 'home page should style itinerary cards');
assert(homeWxss.includes('service-card'), 'home page should style service cards');
assert(backendServer.includes('itineraries: recommend.itineraries'), 'backend home defaults should include itineraries');
assert(backendServer.includes('serviceCards: recommend.serviceCards'), 'backend home defaults should include service cards');
assert(!homeDataSnapshot.includes('/assets/scenes/'), 'home cards should use photo assets instead of old scene placeholders');

function loadContentServiceWithWx(wxMock) {
  const apiPath = require.resolve('../services/api');
  const contentPath = require.resolve('../services/content');
  delete require.cache[apiPath];
  delete require.cache[contentPath];
  global.wx = wxMock;
  return require('../services/content');
}

async function assertLegacyFallbackKeepsImages() {
  const calls = [];
  const wxMock = {
    getSystemInfoSync() {
      return { platform: 'devtools' };
    },
    getStorageSync() {
      return '';
    },
    request(options) {
      calls.push(options.url);
      if (options.url.includes('/api/v1/home')) {
        options.fail(new Error('v1 unavailable'));
        return;
      }
      if (options.url.includes('/api/hailin/home')) {
        options.success({
          statusCode: 200,
          data: {
            banners: [
              {
                id: 'legacy-banner',
                title: '旧接口 banner',
                subtitle: '旧接口回退时也必须补图',
                imageUrl: '/assets/scenes/village-gate.png'
              }
            ],
            scenicSpots: [
              {
                id: 'legacy-spot',
                title: '旧接口景点',
                imageUrl: '/assets/scenes/ricefish-field.png',
                images: []
              }
            ],
            routes: [
              {
                id: 'legacy-route',
                name: '旧接口路线',
                duration: '约 2 小时',
                imageUrl: '/assets/scenes/creek-trail.png'
              }
            ],
            products: [
              {
                id: 'legacy-product',
                name: '旧接口商品',
                price: 1200,
                imageUrl: '/assets/scenes/village-gate.png'
              }
            ],
            notice: '旧接口公告'
          }
        });
        return;
      }
      options.fail(new Error(`unexpected request: ${options.url}`));
    }
  };

  try {
    const content = loadContentServiceWithWx(wxMock);
    const home = await content.loadHomeData();
    assert(calls.some((url) => url.includes('/api/v1/home')), 'home should try v1 API first');
    assert(calls.some((url) => url.includes('/api/hailin/home')), 'home should fall back to legacy API');
    assert.strictEqual(home.banners[0].imageUrl, '/assets/photos/ai-village-gate.jpg');
    assert(!JSON.stringify(home).includes('/assets/scenes/'), 'legacy scene placeholders should be converted to photo assets');
    assert(home.hotRecommends[0].imageUrl, 'legacy scenic recommendations should retain an image');
    assert(home.itineraries[0].imageUrl, 'legacy routes should retain an image');
    assert(home.products[0].imageUrl, 'legacy products should retain an image');
  } finally {
    delete global.wx;
    delete require.cache[require.resolve('../services/api')];
    delete require.cache[require.resolve('../services/content')];
  }
}

(async () => {
  await assertLegacyFallbackKeepsImages();
  console.log('home content coverage ok');
})().catch((error) => {
  delete global.wx;
  console.error(error);
  process.exit(1);
});
