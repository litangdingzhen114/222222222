const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', '..');
const appConfig = require('../app.json');
const mapPoints = require('../data/mapPoints');
const spots = require('../data/spots');
const routes = require('../data/routes');
const mapFeatures = require('../data/mapFeatures');

const pageBase = path.join(root, 'miniprogram/pages/map/map');
['js', 'wxml', 'wxss', 'json'].forEach((ext) => {
  assert(fs.existsSync(`${pageBase}.${ext}`), `map.${ext} should exist`);
});

const mapJs = fs.readFileSync(`${pageBase}.js`, 'utf8');
const mapWxml = fs.readFileSync(`${pageBase}.wxml`, 'utf8');

assert(!mapJs.includes('建设中'), 'map page should not use construction placeholder toasts');
assert(!mapJs.includes('可接真实地图服务'), 'map tools should perform real local actions');
assert(mapJs.includes('wx.openLocation'), 'map page should open native location navigation');
assert(mapJs.includes('wx.getLocation'), 'map page should support user positioning');
assert(mapJs.includes('wx.createMapContext'), 'map page should control map viewport');
assert(mapJs.includes('/pages/spot-detail/spot-detail'), 'spot points should navigate to spot detail');
assert(mapJs.includes('/pages/route-detail/route-detail'), 'route suggestions should navigate to route detail');
assert(mapPoints.some((point) => String(point.targetUrl || '').startsWith('/pages/mine-feature/mine-feature')), 'service points should navigate to service workflows');
assert(mapWxml.includes('search-input'), 'map page should expose search input');
assert(mapWxml.includes('route-panel'), 'map page should expose route recommendation panel');
assert(mapWxml.includes('quick-point-scroll'), 'map page should expose filtered point quick list');
assert(mapWxml.includes('poi-image'), 'map point sheet should show a location image');
assert(mapJs.includes('normalizeMapPoints'), 'map page should normalize backend map point payloads');

const categoryIds = new Set(mapFeatures.categories.map((item) => item.id));
assert(categoryIds.has('全部'), 'categories should include all');
assert(categoryIds.has('公共服务'), 'categories should include public services');
assert(mapFeatures.mapTools.some((item) => item.id === 'route'), 'map tools should include route planning');
assert(mapFeatures.mapTools.some((item) => item.id === 'location'), 'map tools should include location');
assert(mapFeatures.routeSuggestions.length >= 3, 'map should provide multiple route suggestions');

const spotIds = new Set(spots.map((item) => item.id));
const routeIds = new Set(routes.map((item) => item.id));
const appPages = new Set(appConfig.pages.map((page) => `/${page}`));

mapPoints.forEach((point) => {
  assert.strictEqual(typeof point.latitude, 'number', `${point.title} latitude should be numeric`);
  assert.strictEqual(typeof point.longitude, 'number', `${point.title} longitude should be numeric`);
  assert(categoryIds.has(point.type), `${point.title} type should be configured category`);
  assert(point.openTime, `${point.title} should expose open time`);
  assert(point.tips, `${point.title} should expose travel tips`);
  assert(point.actionText, `${point.title} should expose primary action text`);
  assert(point.imageUrl, `${point.title} should expose display image`);

  if (point.refType === 'spot') {
    assert(spotIds.has(point.refId), `${point.title} referenced spot should exist`);
  }
  if (point.targetUrl) {
    const pagePath = point.targetUrl.split('?')[0];
    assert(appPages.has(pagePath), `${point.title} target page should be registered`);
  }
});

mapFeatures.routeSuggestions.forEach((route) => {
  assert(routeIds.has(route.routeId), `${route.title} should reference a route detail`);
  route.pointIds.forEach((pointId) => {
    assert(mapPoints.some((point) => point.id === pointId), `${route.title} point ${pointId} should exist`);
  });
});

console.log('map page feature coverage ok');
