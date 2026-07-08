const { loadLives } = require('../../services/content');

Page({
  data: {
    lives: []
  },

  onLoad() {
    loadLives().then((lives) => {
      this.setData({ lives });
    });
  },

  onLiveTap(event) {
    wx.navigateTo({
      url: `/pages/live-detail/live-detail?id=${event.currentTarget.dataset.id}`
    });
  }
});
