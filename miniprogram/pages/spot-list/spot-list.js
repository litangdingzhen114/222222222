const spots = require('../../data/spots');

Page({
  data: {
    keyword: '',
    categories: ['全部', '自然风光', '人文历史', '亲子体验', '免费'],
    activeCategory: '全部',
    spots
  },

  filterSpots(category, keyword) {
    const word = (keyword || '').trim();
    return spots.filter((spot) => {
      const matchCategory = category === '全部'
        || spot.category === category
        || spot.tags.includes(category);
      const matchKeyword = !word || spot.name.includes(word) || spot.desc.includes(word);
      return matchCategory && matchKeyword;
    });
  },

  onCategoryTap(event) {
    const category = event.currentTarget.dataset.category;
    this.setData({
      activeCategory: category,
      spots: this.filterSpots(category, this.data.keyword)
    });
  },

  onSearchInput(event) {
    const keyword = event.detail.value;
    this.setData({
      keyword,
      spots: this.filterSpots(this.data.activeCategory, keyword)
    });
  },

  onSpotTap(event) {
    wx.navigateTo({
      url: `/pages/spot-detail/spot-detail?id=${event.currentTarget.dataset.id}`
    });
  }
});
