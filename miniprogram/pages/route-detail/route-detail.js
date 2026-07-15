const fallbackRoutes = require('../../data/routes');
const { loadRoutes } = require('../../services/content');
const { findById, quickToast } = require('../../utils/mock');

Page({
  data: {
    route: null,
    favorite: false
  },

  onLoad(options) {
    loadRoutes().then((routes) => {
      const route = findById(routes, options.id) || findById(fallbackRoutes, options.id);
      this.applyRoute(route);
    });
  },

  applyRoute(route) {
    if (!route) {
      quickToast('路线不存在');
      setTimeout(() => wx.navigateBack({ delta: 1 }), 500);
      return;
    }

    this.setData({
      route
    });
  },

  onFavorite() {
    this.setData({ favorite: !this.data.favorite });
    quickToast(this.data.favorite ? '已收藏路线' : '已取消收藏');
  },

  onStart() {
    const route = this.data.route;
    if (route.bookingUrl) {
      wx.navigateTo({ url: route.bookingUrl });
      return;
    }
    quickToast('已为您规划出发路线');
  }
});
