const fallbackSpots = require('../../data/spots');
const { loadSpots } = require('../../services/content');
const { quickToast } = require('../../utils/mock');
const { hasFeaturedPlaceDetail, detailUrl } = require('../../utils/placeDetails');

Page({
  data: {
    keyword: '',
    categories: ['全部', '自然风光', '美食', '公共服务', '人文历史', '亲子体验', '免费'],
    activeCategory: '全部',
    allSpots: fallbackSpots,
    spots: fallbackSpots
  },

  onLoad() {
    loadSpots().then((spots) => {
      this.setData({
        allSpots: spots,
        spots: this.filterSpots(this.data.activeCategory, this.data.keyword, spots)
      });
    });
  },

  filterSpots(category, keyword, source = this.data.allSpots) {
    const word = (keyword || '').trim();
    return source.filter((spot) => {
      const matchCategory = category === '全部'
        || spot.category === category
        || (Array.isArray(spot.tags) && spot.tags.includes(category));
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
    const id = event.currentTarget.dataset.id;
    if (!hasFeaturedPlaceDetail(id)) {
      quickToast('该详情页正在完善中');
      return;
    }
    wx.navigateTo({
      url: detailUrl(id)
    });
  }
});
