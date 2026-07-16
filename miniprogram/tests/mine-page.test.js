const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', '..');
const user = require('../data/user');
const spots = require('../data/spots');
const routes = require('../data/routes');
const mineFeatures = require('../data/mineFeatures');
const userCenter = require('../utils/userCenter');
const appConfig = require('../app.json');

const requiredPages = [
  'pages/mine-feature/mine-feature',
  'pages/profile-edit/profile-edit',
  'pages/publish/publish',
  'pages/user-list/user-list'
];

requiredPages.forEach((page) => {
  assert(
    appConfig.pages.includes(page),
    `app.json should register ${page}`
  );
  ['js', 'wxml', 'wxss', 'json'].forEach((ext) => {
    assert(
      fs.existsSync(path.join(root, 'miniprogram', `${page}.${ext}`)),
      `${page}.${ext} should exist`
    );
  });
});

const actionableIds = [
  ...user.stats.map((item) => item.id),
  ...user.orders.map((item) => item.id),
  ...user.rights.map((item) => item.id),
  'cooperation',
  'publish'
];

actionableIds.forEach((id) => {
  assert(mineFeatures.featureMap[id], `feature config missing for ${id}`);
});

user.orders.forEach((item) => {
  const feature = mineFeatures.featureMap[item.id];
  assert(feature.title === item.title, `${item.id} title should match mine grid`);
  assert(feature.actionText || feature.type === 'verify', `${item.id} needs an action`);
});

user.rights.forEach((item) => {
  const feature = mineFeatures.featureMap[item.id];
  assert(feature.title === item.title, `${item.id} title should match rights row`);
  assert(['coupon', 'points', 'checkin'].includes(feature.type), `${item.id} should be a rights workflow`);
});

const mineJs = fs.readFileSync(path.join(root, 'miniprogram/pages/mine/mine.js'), 'utf8');
assert(!mineJs.includes('建设中'), 'mine page should not show placeholder construction toasts');
assert(mineJs.includes('/pages/profile-edit/profile-edit'), 'profile edit should navigate to edit page');
assert(mineJs.includes('/pages/user-list/user-list'), 'stats should navigate to list page');
assert(mineJs.includes('/pages/mine-feature/mine-feature'), 'orders and rights should navigate to feature page');
assert(mineJs.includes('/pages/publish/publish'), 'publish should navigate to publish page');

const spotIds = new Set(spots.map((item) => item.id));
const routeIds = new Set(routes.map((item) => item.id));
const tabUrls = new Set(['/pages/home/home', '/pages/map/map', '/pages/food/food', '/pages/mine/mine']);
const allListItems = [
  ...mineFeatures.defaultLists.notes,
  ...mineFeatures.defaultLists.favorites,
  ...mineFeatures.defaultLists.likes
];

allListItems.forEach((item) => {
  const url = item.targetUrl;
  if (!url) return;
  if (url.startsWith('/pages/spot-detail/spot-detail?id=')) {
    assert(spotIds.has(url.split('id=')[1]), `${item.title} target spot should exist`);
  }
  if (url.startsWith('/pages/route-detail/route-detail?id=')) {
    assert(routeIds.has(url.split('id=')[1]), `${item.title} target route should exist`);
  }
  if (tabUrls.has(url)) {
    const userListJs = fs.readFileSync(path.join(root, 'miniprogram/pages/user-list/user-list.js'), 'utf8');
    assert(userListJs.includes('wx.switchTab'), 'tab targets should use switchTab');
  }
});

let state = userCenter.resetUserCenter();
assert.strictEqual(userCenter.getStats(state).notes, 3, 'default notes should match profile count');
assert.strictEqual(userCenter.getStats(state).favorites, 12, 'default favorites should match profile count');
assert.strictEqual(userCenter.getStats(state).likes, 28, 'default likes should match profile count');

state = userCenter.saveProfile({
  nickname: '测试游客',
  avatarText: '林',
  contact: '13800000000',
  intro: '测试海林村用户中心'
});
assert.strictEqual(state.profile.nickname, '测试游客', 'profile nickname should persist');
assert.strictEqual(state.completedTasks.profile, true, 'saving profile should complete profile task');

const note = userCenter.publishNote({
  title: '测试游记',
  topic: '稻鱼体验',
  content: '这是一条覆盖发布游记功能的测试内容。',
  imagePath: ''
});
assert(note.id, 'published note should have id');
assert.strictEqual(userCenter.getStats().notes, 4, 'publishing should increase note count');

const checkin = userCenter.checkIn('2026-07-07');
const repeatCheckin = userCenter.checkIn('2026-07-07');
assert.strictEqual(checkin.ok, true, 'first check-in should succeed');
assert.strictEqual(repeatCheckin.ok, false, 'same-day check-in should be idempotent');

const order = userCenter.addOrder('guide', {
  service: '海林村讲解跟拍',
  item: '基础讲解',
  date: '2026-07-08',
  people: 2,
  contact: '13800000000',
  remark: ''
});
assert.strictEqual(order.featureId, 'guide', 'order should keep feature id');
assert(userCenter.loadUserCenter().orders.some((item) => item.id === order.id), 'order should persist locally');
const updatedOrder = userCenter.updateOrder(order.id, { orderNo: 'HLTEST001', status: '待确认' });
assert.strictEqual(updatedOrder.orderNo, 'HLTEST001', 'order should support remote metadata sync');
assert.strictEqual(userCenter.completePointTask('favorite').ok, true, 'point task should be completable');

const favoriteTarget = '/pages/spot-detail/spot-detail?id=test-favorite';
const favoriteResult = userCenter.toggleFavorite({
  id: 'spot-rice-view',
  title: '稻鱼田观景点',
  summary: '测试收藏景点',
  targetUrl: favoriteTarget
});
assert.strictEqual(favoriteResult.favorite, true, 'favorite should be added');
assert.strictEqual(userCenter.isFavorite(favoriteTarget), true, 'favorite target should be detectable');
const unfavoriteResult = userCenter.toggleFavorite({
  id: 'spot-rice-view',
  title: '稻鱼田观景点',
  summary: '测试收藏景点',
  targetUrl: favoriteTarget
});
assert.strictEqual(unfavoriteResult.favorite, false, 'favorite should be removable');

assert.strictEqual(userCenter.claimCoupon('coupon-ricefish').ok, true, 'claiming coupon should succeed');
assert.strictEqual(userCenter.useCoupon('coupon-ricefish').ok, true, 'using claimed coupon should succeed');

console.log('mine page feature coverage ok');
