const routes = require('../../data/routes');
const { findById, quickToast } = require('../../utils/mock');

Page({
  data: {
    route: null,
    favorite: false
  },

  onLoad(options) {
    this.setData({
      route: findById(routes, options.id)
    });
  },

  onFavorite() {
    this.setData({ favorite: !this.data.favorite });
    quickToast(this.data.favorite ? '已收藏路线' : '已取消收藏');
  },

  onStart() {
    quickToast('已为您规划出发路线');
  }
});
