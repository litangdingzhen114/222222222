const assert = require('assert');
const fs = require('fs');
const path = require('path');

const pagePath = require.resolve('../pages/live-detail/live-detail');
const pageSource = fs.readFileSync(path.join(__dirname, '..', 'pages', 'live-detail', 'live-detail.js'), 'utf8');
const wxmlSource = fs.readFileSync(path.join(__dirname, '..', 'pages', 'live-detail', 'live-detail.wxml'), 'utf8');
const wxssSource = fs.readFileSync(path.join(__dirname, '..', 'pages', 'live-detail', 'live-detail.wxss'), 'utf8');
const recommendSource = fs.readFileSync(path.join(__dirname, '..', 'data', 'recommend.js'), 'utf8');

let pageConfig = null;
const navCalls = [];
const storageValues = {};

global.Page = (config) => {
  pageConfig = config;
};
global.wx = {
  getSystemInfoSync() {
    return { platform: 'devtools' };
  },
  getStorageSync() {
    return '';
  },
  setStorageSync(key, value) {
    storageValues[key] = value;
  },
  navigateTo(options) {
    navCalls.push({ type: 'navigateTo', url: options.url });
  },
  switchTab(options) {
    navCalls.push({ type: 'switchTab', url: options.url });
  },
  showToast() {}
};

delete require.cache[pagePath];
require(pagePath);

function createContext() {
  return {
    ...pageConfig,
    data: {
      liveFrameUrl: '',
      currentTime: ''
    },
    setData(update) {
      Object.assign(this.data, update);
    }
  };
}

assert(pageConfig, 'live detail page should register config');
assert(pageSource.includes("LIVE_GIF_URL = '/assets/live/hailin-village-live.gif'"), 'live detail should use the lightweight live gif');
assert(wxmlSource.includes('class="real-player live-frame"'), 'live detail should render the current live frame');
assert(wxmlSource.includes('src="{{liveFrameUrl}}"'), 'live detail should bind the live frame url');
assert(wxmlSource.includes('class="live-time-badge"'), 'live detail should keep a live timestamp badge');
assert(wxssSource.includes('.live-scanline'), 'live detail should add a subtle live-screen treatment');
assert(!wxmlSource.includes('<video'), 'live detail should not depend on native video autoplay in devtools');
assert(!wxmlSource.includes('id="liveVideo"'), 'live detail should not keep the old video context id');
assert(!pageSource.includes('wx.createVideoContext'), 'live detail should not use native video context playback');
assert(!pageSource.includes('liveFrameTimer'), 'live detail should not depend on JS timers for animated playback');
assert(!wxmlSource.includes('live-video-poster'), 'live detail should not keep a poster layer that freezes on first frame');
assert(!wxssSource.includes('live-video-poster'), 'live detail styles should not keep obsolete poster overlay rules');
assert(!wxmlSource.includes('慢直播画面'), 'live detail should not overlay explanatory live text on the frame');
assert(!wxmlSource.includes('实时画面同步中'), 'live fallback should not look stuck in a syncing state');
assert(!wxmlSource.includes('mock-live-wave'), 'live fallback should not show a loading spinner');
assert(!pageSource.includes('正在播放'), 'live detail should not expose video playback wording');
assert(wxmlSource.includes('bindtap="onNearbyTap"'), 'live nearby cards should be tappable');
assert(wxmlSource.includes('data-url="{{item.targetUrl}}"'), 'live nearby cards should carry target url');
assert(recommendSource.includes('targetUrl: "/pages/spot-detail/spot-detail?id=tianpu-station"'), 'live nearby should link to station detail');
assert(recommendSource.includes('targetUrl: "/pages/spot-detail/spot-detail?id=creek-trail"'), 'live nearby should link to creek detail');
assert(!recommendSource.includes('qingtian-city') && !recommendSource.includes('qingtian-tashan'), 'recommend data should not use modern Qingtian placeholder photos');

const liveGifPath = path.join(__dirname, '..', 'assets', 'live', 'hailin-village-live.gif');
assert(fs.existsSync(liveGifPath), 'live gif should exist');
assert(fs.statSync(liveGifPath).size < 700 * 1024, 'live gif should stay below 700KB');

assert.strictEqual(pageConfig.data.liveFrameUrl, '/assets/live/hailin-village-live.gif');

let context = createContext();
pageConfig.onNearbyTap.call(context, {
  currentTarget: {
    dataset: {
      url: '/pages/spot-detail/spot-detail?id=creek-trail'
    }
  }
});
assert.deepStrictEqual(navCalls.pop(), {
  type: 'navigateTo',
  url: '/pages/spot-detail/spot-detail?id=creek-trail'
});

pageConfig.onNearbyTap.call(context, {
  currentTarget: {
    dataset: {
      url: '/pages/map/map?point=4'
    }
  }
});
assert.strictEqual(storageValues.hailin_pending_map_point, '4');
assert.deepStrictEqual(navCalls.pop(), {
  type: 'switchTab',
  url: '/pages/map/map'
});

delete global.Page;
delete global.wx;

console.log('live detail gif ok');
