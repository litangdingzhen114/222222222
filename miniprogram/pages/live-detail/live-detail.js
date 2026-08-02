const { loadLives } = require('../../services/content');
const recommend = require('../../data/recommend');
const { findById, quickToast } = require('../../utils/mock');

const PENDING_MAP_POINT_KEY = 'hailin_pending_map_point';
const LIVE_GIF_URL = '/assets/live/hailin-village-live.gif';

Page({
  data: {
    live: null,
    liveFrameUrl: LIVE_GIF_URL,
    currentTime: '',
    nearby: recommend.corridor.slice(0, 3)
  },

  onLoad(options) {
    this.refreshClock();
    this.clockTimer = setInterval(() => {
      this.refreshClock();
    }, 1000);

    loadLives().then((lives) => {
      const live = findById(lives, options.id);
      this.setData({
        live
      });
      if (live) {
        this.setData({
          liveFrameUrl: LIVE_GIF_URL
        });
      }
    });
  },

  onUnload() {
    if (this.clockTimer) {
      clearInterval(this.clockTimer);
      this.clockTimer = null;
    }
  },

  refreshClock() {
    const now = new Date();
    const pad = (value) => String(value).padStart(2, '0');
    const time = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    this.setData({
      currentTime: time
    });
  },

  onNearbyTap(event) {
    const url = String((event.currentTarget.dataset && event.currentTarget.dataset.url) || '').trim();
    if (!url) {
      quickToast('更多介绍即将更新');
      return;
    }
    const mapPointMatch = url.match(/^\/pages\/map\/map\?point=([^&]+)$/);
    if (mapPointMatch) {
      wx.setStorageSync(PENDING_MAP_POINT_KEY, decodeURIComponent(mapPointMatch[1]));
      wx.switchTab({ url: '/pages/map/map' });
      return;
    }
    wx.navigateTo({ url });
  }

  // 真实直播密钥、萤石云 token 或 HLS 鉴权应由后端维护。
  // 后端可返回 liveUrl / hlsUrl，小程序端只负责播放地址。
});
