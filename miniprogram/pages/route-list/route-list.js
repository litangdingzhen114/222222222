const routes = require('../../data/routes');

Page({
  data: {
    routes
  },

  onRouteTap(event) {
    wx.navigateTo({
      url: `/pages/route-detail/route-detail?id=${event.currentTarget.dataset.id}`
    });
  }
});
