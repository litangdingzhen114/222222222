const fallbackSpots = require('../../data/spots');
const { loadSpots } = require('../../services/content');
const { findById, quickToast } = require('../../utils/mock');
const { isFavorite, toggleFavorite } = require('../../utils/userCenter');

Page({
  data: {
    spot: null,
    heroImages: [],
    favorite: false,
    nearby: []
  },

  onLoad(options) {
    this.loadSpot(options.id);
  },

  loadSpot(id) {
    loadSpots().then((spots) => {
      const spot = findById(spots, id) || findById(fallbackSpots, id);
      this.applySpot(spot, spots);
    });
  },

  applySpot(spot, spots) {
    if (!spot) {
      quickToast('景点不存在');
      setTimeout(() => wx.navigateBack({ delta: 1 }), 500);
      return;
    }

    const imageClasses = spot.images || [];
    const heroImages = (spot.imageUrls || []).map((url, index) => ({
      key: url,
      url,
      imageClass: imageClasses[index] || imageClasses[0]
    }));

    this.setData({
      spot,
      heroImages: heroImages.length ? heroImages : imageClasses.map((imageClass, index) => ({ key: `${imageClass}-${index}`, imageClass })),
      favorite: isFavorite(`/pages/spot-detail/spot-detail?id=${spot.id}`),
      nearby: spots.filter((item) => item.id !== spot.id).slice(0, 3)
    });
  },

  onFavorite() {
    const spot = this.data.spot;
    const result = toggleFavorite({
      id: `spot-${spot.id}`,
      title: spot.name,
      summary: spot.desc,
      targetUrl: `/pages/spot-detail/spot-detail?id=${spot.id}`
    });
    this.setData({ favorite: result.favorite });
    quickToast(result.favorite ? '已收藏' : '已取消收藏');
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
