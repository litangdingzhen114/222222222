const fallbackFoods = require('../../data/foods');
const { loadFoods } = require('../../services/content');
const { quickToast } = require('../../utils/mock');

Page({
  data: {
    foods: fallbackFoods,
    filters: ['全部类别', '附近', '全村'],
    featureCards: [
      { id: 'rank', title: '田鱼榜单', icon: '榜', iconPath: '/assets/icons/ricefish.png' },
      { id: 'map', title: '美食地图', icon: '图', iconPath: '/assets/icons/map-food.png' },
      { id: 'special', title: '侨乡小食', icon: '侨', iconPath: '/assets/icons/overseas.png' },
      { id: 'banquet', title: '一村一宴', icon: '宴', iconPath: '/assets/icons/banquet.png' }
    ]
  },

  onLoad() {
    loadFoods().then((foods) => {
      this.setData({ foods });
    });
  },

  onFeatureTap(event) {
    quickToast(`${event.currentTarget.dataset.title}建设中`);
  },

  onFilterTap(event) {
    quickToast(`${event.currentTarget.dataset.title}筛选建设中`);
  },

  onSearchInput() {},

  onFoodTap(event) {
    const food = this.data.foods.find((item) => item.id === event.detail.id);
    quickToast(food ? `${food.name}详情建设中` : '美食详情建设中');
  }
});
