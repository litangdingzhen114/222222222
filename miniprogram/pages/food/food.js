const fallbackFoods = require('../../data/foods');
const { loadFoods } = require('../../services/content');
const { quickToast } = require('../../utils/mock');

Page({
  data: {
    allFoods: fallbackFoods,
    foods: fallbackFoods,
    keyword: '',
    activeFilter: '全部类别',
    filters: ['全部类别', '青田田鱼', '溪畔茶点', '侨乡', '研学'],
    featureCards: [
      { id: 'rank', title: '田鱼榜单', icon: '榜', iconPath: '/assets/icons/ricefish.png' },
      { id: 'map', title: '美食地图', icon: '图', iconPath: '/assets/icons/map-food.png' },
      { id: 'special', title: '侨乡小食', icon: '侨', iconPath: '/assets/icons/overseas.png' },
      { id: 'banquet', title: '一村一宴', icon: '宴', iconPath: '/assets/icons/banquet.png' }
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
    if (id === 'banquet') {
      wx.navigateTo({ url: '/pages/mine-feature/mine-feature?id=mall' });
      return;
    }
    const filter = id === 'special' ? '侨乡' : '青田田鱼';
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
    wx.navigateTo({ url: `/pages/mine-feature/mine-feature?id=mall&item=${encodeURIComponent(food.name)}` });
  }
});
