const spots = require('../../data/spots');
const { findById, quickToast } = require('../../utils/mock');

Page({
  data: {
    spot: null,
    heroImages: [],
    favorite: false,
    nearby: []
  },

  onLoad(options) {
    const spot = findById(spots, options.id);
    if (!spot) {
      quickToast('景点不存在');
      setTimeout(() => wx.navigateBack({ delta: 1 }), 500);
      return;
    }

    const heroImages = (spot.imageUrls || []).map((url, index) => ({
      key: url,
      url,
      imageClass: spot.images[index] || spot.images[0]
    }));

    this.setData({
      spot,
      heroImages: heroImages.length ? heroImages : (spot.images || []).map((imageClass, index) => ({ key: `${imageClass}-${index}`, imageClass })),
      nearby: spots.filter((item) => item.id !== spot.id).slice(0, 3)
    });
  },

  onFavorite() {
    this.setData({ favorite: !this.data.favorite });
    quickToast(this.data.favorite ? '已收藏' : '已取消收藏');
  },

  onAudioGuide() {
    wx.navigateTo({
      url: `/pages/ai-guide/ai-guide?question=${encodeURIComponent(`${this.data.spot.name}怎么游玩`)}`
    });
  },

  onNavigate() {
    quickToast('正在打开导航');
  },

  onServiceTap(event) {
    const { url, openType } = event.currentTarget.dataset;
    if (!url) return;
    if (openType === 'switchTab') {
      wx.switchTab({ url });
      return;
    }
    wx.navigateTo({ url });
  },

  onNearbyTap(event) {
    wx.redirectTo({
      url: `/pages/spot-detail/spot-detail?id=${event.currentTarget.dataset.id}`
    });
  },

  onShareAppMessage() {
    return {
      title: this.data.spot ? `海林村${this.data.spot.name}` : '一部手机游海林村',
      path: this.data.spot ? `/pages/spot-detail/spot-detail?id=${this.data.spot.id}` : '/pages/home/home'
    };
  }
});
