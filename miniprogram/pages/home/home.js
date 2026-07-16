const { loadHomeData } = require('../../services/content');
const { featureComing, quickToast } = require('../../utils/mock');

Page({
  data: {
    banners: [],
    gridPages: [],
    products: [],
    hotRecommends: [],
    itineraries: [],
    serviceCards: [],
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
        itineraries: data.itineraries || [],
        serviceCards: data.serviceCards || [],
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
    wx.switchTab({ url: '/pages/map/map' });
  },

  onGridTap(event) {
    const { title, url, openType } = event.currentTarget.dataset;
    this.navigateByDataset(title, url, openType);
  },

  onRecommendTap(event) {
    const { title, url, openType } = event.currentTarget.dataset;
    this.navigateByDataset(title, url, openType);
  },

  onItineraryTap(event) {
    const { title, url, openType } = event.currentTarget.dataset;
    this.navigateByDataset(title, url, openType);
  },

  onServiceTap(event) {
    const { title, url, openType } = event.currentTarget.dataset;
    this.navigateByDataset(title, url, openType);
  },

  navigateByDataset(title, url, openType) {
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

  onProductTap(event) {
    wx.navigateTo({ url: '/pages/mine-feature/mine-feature?id=mall' });
  },

  onRankingTap(event) {
    const title = event.currentTarget.dataset.title || '';
    if (title.includes('美食') || title.includes('田鱼')) {
      wx.switchTab({ url: '/pages/food/food' });
      return;
    }
    wx.switchTab({ url: '/pages/map/map' });
  },

  onMoreProducts() {
    wx.navigateTo({ url: '/pages/mine-feature/mine-feature?id=mall' });
  },

  onMoreRoutes() {
    wx.navigateTo({ url: '/pages/route-list/route-list' });
  },

  onFeedTap() {
    wx.navigateTo({ url: '/pages/user-list/user-list?type=notes' });
  }
});
