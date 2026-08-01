const fallbackFoods = require('../../data/foods');
const { loadFoods } = require('../../services/content');
const { quickToast } = require('../../utils/mock');
const { detailUrl } = require('../../utils/placeDetails');

Page({
  data: {
    allFoods: fallbackFoods,
    foods: fallbackFoods,
    keyword: '',
    activeFilter: '全部类别',
    filters: ['全部类别', '咖啡', '轻食', '民宿', '稻田田鱼', '研学'],
    featureCards: [
      { id: 'cafe', title: '咖啡菜单', icon: '啡', iconPath: '/assets/icons/map-food.png' },
      { id: 'map', title: '到店导航', icon: '图', iconPath: '/assets/icons/traffic.png' },
      { id: 'special', title: '乡野轻食', icon: '轻', iconPath: '/assets/icons/overseas.png' },
      { id: 'stay', title: '民宿体验', icon: '宿', iconPath: '/assets/icons/stay.png' }
    ]
  },

  onLoad() {
    loadFoods().then((foods) => {
      this.setData({
        allFoods: foods,
        foods: this.filterFoods(foods, this.data.keyword, this.data.activeFilter)
      });
    });
  },

  filterFoods(source, keyword, filter) {
    const word = String(keyword || '').trim().toLowerCase();
    return source.filter((item) => {
      const text = `${item.name} ${item.desc} ${(item.tags || []).join(' ')}`.toLowerCase();
      const matchedKeyword = !word || text.includes(word);
      const matchedFilter = !filter || filter === '全部类别' || (item.tags || []).includes(filter) || text.includes(filter.toLowerCase());
      return matchedKeyword && matchedFilter;
    });
  },

  onFeatureTap(event) {
    const id = event.currentTarget.dataset.id;
    if (id === 'map') {
      wx.switchTab({ url: '/pages/map/map' });
      return;
    }
    if (id === 'stay') {
      wx.navigateTo({ url: '/pages/mine-feature/mine-feature?id=stay' });
      return;
    }
    const filter = id === 'special' ? '轻食' : '咖啡';
    this.setData({
      activeFilter: filter,
      foods: this.filterFoods(this.data.allFoods, this.data.keyword, filter)
    });
  },

  onFilterTap(event) {
    const activeFilter = event.currentTarget.dataset.title;
    this.setData({
      activeFilter,
      foods: this.filterFoods(this.data.allFoods, this.data.keyword, activeFilter)
    });
  },

  onSearchInput(event) {
    const keyword = event.detail.value;
    this.setData({
      keyword,
      foods: this.filterFoods(this.data.allFoods, keyword, this.data.activeFilter)
    });
  },

  onFoodTap(event) {
    const food = this.data.foods.find((item) => item.id === event.detail.id);
    if (!food) {
      quickToast('美食信息不存在');
      return;
    }
    if (food.id === 'xunye-cafe') {
      wx.navigateTo({ url: detailUrl(food.id) });
      return;
    }
    wx.navigateTo({ url: `/pages/mine-feature/mine-feature?id=mall&item=${encodeURIComponent(food.name)}` });
  }
});
