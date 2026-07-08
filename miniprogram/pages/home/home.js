const { loadHomeData } = require('../../services/content');
const { featureComing, quickToast } = require('../../utils/mock');

Page({
  data: {
    banners: [],
    gridPages: [],
    products: [],
    hotRecommends: [],
    rankings: [],
    corridor: [],
    feedsLeft: [],
    feedsRight: [],
    gridCurrent: 0,
    notice: '',
    weather: '',
    serviceMode: '',
    locationText: ''
  },

  onLoad() {
    this.loadPageData();
  },

  loadPageData() {
    loadHomeData().then((data) => {
      const feeds = data.feeds || [];
      this.setData({
        banners: data.banners || [],
        gridPages: data.gridPages || [],
        products: data.products || [],
        hotRecommends: data.hotRecommends || [],
        rankings: data.rankings || [],
        corridor: data.corridor || [],
        feedsLeft: feeds.filter((_, index) => index % 2 === 0),
        feedsRight: feeds.filter((_, index) => index % 2 === 1),
        notice: data.notice || '',
        weather: data.weather || '',
        serviceMode: data.serviceMode || '',
        locationText: data.locationText || ''
      });
    });
  },

  onGridChange(event) {
    this.setData({
      gridCurrent: event.detail.current
    });
  },

  onSearchTap() {
    quickToast('真实搜索可由后端接入');
  },

  onGridTap(event) {
    const { title, url, openType } = event.currentTarget.dataset;
    if (!url) {
      featureComing(title);
      return;
    }

    if (openType === 'switchTab') {
      wx.switchTab({ url });
      return;
    }

    wx.navigateTo({ url });
  },

  onRecommendTap(event) {
    featureComing(event.currentTarget.dataset.title);
  },

  onProductTap(event) {
    quickToast('文创商城建设中');
  },

  onRankingTap(event) {
    quickToast(`${event.currentTarget.dataset.title}榜单建设中`);
  },

  onMoreProducts() {
    quickToast('更多文创建设中');
  },

  onFeedTap() {
    quickToast('游记详情建设中');
  }
});
