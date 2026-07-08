const { featureMap } = require('../../data/mineFeatures');
const { loadUserCenter } = require('../../utils/userCenter');

function listByType(state, type) {
  if (type === 'favorites') return state.favorites;
  if (type === 'likes') return state.likes;
  return state.notes;
}

function isTabUrl(url) {
  return ['/pages/home/home', '/pages/map/map', '/pages/food/food', '/pages/mine/mine'].includes(url);
}

Page({
  data: {
    type: 'notes',
    meta: featureMap.notes,
    items: []
  },

  onLoad(options) {
    const type = options.type || 'notes';
    const meta = featureMap[type] || featureMap.notes;
    this.setData({ type, meta });
    wx.setNavigationBarTitle({ title: meta.title });
  },

  onShow() {
    const state = loadUserCenter();
    this.setData({ items: listByType(state, this.data.type) });
  },

  onItemTap(event) {
    const url = event.currentTarget.dataset.url;
    if (url) {
      if (isTabUrl(url)) {
        wx.switchTab({ url });
        return;
      }
      wx.navigateTo({ url });
    }
  },

  onPrimaryTap() {
    if (this.data.type === 'notes') {
      wx.navigateTo({ url: '/pages/publish/publish' });
      return;
    }
    if (this.data.type === 'favorites') {
      wx.switchTab({ url: '/pages/map/map' });
      return;
    }
    wx.switchTab({ url: '/pages/home/home' });
  }
});
