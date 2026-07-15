const fallbackRoutes = require('../../data/routes');
const { loadRoutes } = require('../../services/content');

Page({
  data: {
    routes: fallbackRoutes
  },

  onLoad() {
    loadRoutes().then((routes) => {
      this.setData({ routes });
    });
  },

  onRouteTap(event) {
    wx.navigateTo({
      url: `/pages/route-detail/route-detail?id=${event.currentTarget.dataset.id}`
    });
  }
});
