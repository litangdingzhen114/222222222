const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', '..');
const spots = require('../data/spots');
const routes = require('../data/routes');
const { featureMap } = require('../data/mineFeatures');

const bookingFeatureIds = ['mall', 'ticket', 'tour', 'guide', 'stay', 'activity', 'venue', 'build'];

spots.forEach((spot) => {
  assert(Array.isArray(spot.highlights) && spot.highlights.length >= 3, `${spot.id} should expose richer highlights`);
  assert(Array.isArray(spot.visitTips) && spot.visitTips.length >= 3, `${spot.id} should expose visit tips`);
  assert(Array.isArray(spot.services) && spot.services.length >= 3, `${spot.id} should link follow-up services`);
});

routes.forEach((route) => {
  assert(Array.isArray(route.included) && route.included.length >= 4, `${route.id} should explain included content`);
  assert(Array.isArray(route.prepares) && route.prepares.length >= 3, `${route.id} should include preparation notes`);
  assert(route.bookingUrl && route.bookingUrl.includes('/pages/mine-feature/'), `${route.id} should link to booking service`);
});

bookingFeatureIds.forEach((id) => {
  const feature = featureMap[id];
  assert(feature, `${id} booking feature should exist`);
  assert(Array.isArray(feature.highlights) && feature.highlights.length >= 2, `${id} should have service highlights`);
  assert(Array.isArray(feature.process) && feature.process.length >= 3, `${id} should have a booking process`);
  assert(Array.isArray(feature.notes) && feature.notes.length >= 2, `${id} should have booking notes`);
});

const spotWxml = fs.readFileSync(path.join(root, 'miniprogram/pages/spot-detail/spot-detail.wxml'), 'utf8');
const routeWxml = fs.readFileSync(path.join(root, 'miniprogram/pages/route-detail/route-detail.wxml'), 'utf8');
const bookingJs = fs.readFileSync(path.join(root, 'miniprogram/pages/booking/booking.js'), 'utf8');
const bookingWxml = fs.readFileSync(path.join(root, 'miniprogram/pages/booking/booking.wxml'), 'utf8');
const spotListJs = fs.readFileSync(path.join(root, 'miniprogram/pages/spot-list/spot-list.js'), 'utf8');
const spotDetailJs = fs.readFileSync(path.join(root, 'miniprogram/pages/spot-detail/spot-detail.js'), 'utf8');
const routeListJs = fs.readFileSync(path.join(root, 'miniprogram/pages/route-list/route-list.js'), 'utf8');
const routeDetailJs = fs.readFileSync(path.join(root, 'miniprogram/pages/route-detail/route-detail.js'), 'utf8');
const orderListJs = fs.readFileSync(path.join(root, 'miniprogram/pages/order-list/order-list.js'), 'utf8');
const orderDetailJs = fs.readFileSync(path.join(root, 'miniprogram/pages/order-detail/order-detail.js'), 'utf8');
const appJson = fs.readFileSync(path.join(root, 'miniprogram/app.json'), 'utf8');
const mineWxml = fs.readFileSync(path.join(root, 'miniprogram/pages/mine-feature/mine-feature.wxml'), 'utf8');
const feedbackWxml = fs.readFileSync(path.join(root, 'miniprogram/pages/feedback/feedback.wxml'), 'utf8');

assert(spotWxml.includes('亮点玩法'), 'spot detail should render play highlights');
assert(spotWxml.includes('服务衔接'), 'spot detail should render service links');
assert(routeWxml.includes('包含内容'), 'route detail should render included content');
assert(routeWxml.includes('出发准备'), 'route detail should render preparation notes');
assert(bookingJs.includes('serviceOptions'), 'booking page should expose service options');
assert(bookingWxml.includes('快速方案'), 'booking page should render quick plans');
assert(spotListJs.includes('loadSpots'), 'spot list should load backend-managed spot content');
assert(spotDetailJs.includes('loadSpots'), 'spot detail should load backend-managed spot content');
assert(routeListJs.includes('loadRoutes'), 'route list should load backend-managed route content');
assert(routeDetailJs.includes('loadRoutes'), 'route detail should load backend-managed route content');
assert(appJson.includes('pages/order-list/order-list'), 'app should register order list page');
assert(appJson.includes('pages/order-detail/order-detail'), 'app should register order detail page');
assert(orderListJs.includes('loadOrders'), 'order list should load backend-managed orders');
assert(orderDetailJs.includes('loadOrderDetail'), 'order detail should load backend-managed order detail');
assert(orderDetailJs.includes('cancelOrder'), 'order detail should allow cancellable orders to be cancelled');
assert(mineWxml.includes('服务亮点'), 'mine feature page should render service highlights');
assert(feedbackWxml.includes('意见反馈'), 'feedback page should explain feedback scope');

console.log('entry detail depth ok');
