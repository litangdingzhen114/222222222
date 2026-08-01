const fallbackSpots = require('../../data/spots');
const { loadSpots } = require('../../services/content');
const { findById, quickToast } = require('../../utils/mock');
const { isFavorite, toggleFavorite } = require('../../utils/userCenter');
const { hasFeaturedPlaceDetail } = require('../../utils/placeDetails');

function mergeSpot(localSpot, remoteSpot) {
  if (!localSpot && !remoteSpot) return null;
  return {
    ...(remoteSpot || {}),
    ...(localSpot || {}),
    stats: (localSpot && localSpot.stats) || (remoteSpot && remoteSpot.stats) || [],
    story: (localSpot && localSpot.story) || (remoteSpot && remoteSpot.story) || [],
    experience:
      (localSpot && localSpot.experience) ||
      (remoteSpot && remoteSpot.experience) ||
      [],
    itinerary:
      (localSpot && localSpot.itinerary) ||
      (remoteSpot && remoteSpot.itinerary) ||
      [],
    highlights:
      (localSpot && localSpot.highlights) ||
      (remoteSpot && remoteSpot.highlights) ||
      [],
    visitTips:
      (localSpot && localSpot.visitTips) ||
      (remoteSpot && remoteSpot.visitTips) ||
      [],
    services:
      (localSpot && localSpot.services) || (remoteSpot && remoteSpot.services) || [],
  };
}

function buildDisplaySpot(spot) {
  const stats = spot.stats && spot.stats.length
    ? spot.stats
    : [
        { label: '开放', value: spot.openTime || '以公告为准' },
        { label: '停留', value: spot.duration || '灵活安排' },
        { label: '距离', value: spot.distance || '村内点位' },
      ];
  const story = spot.story && spot.story.length ? spot.story : [spot.desc || '该点位信息正在持续完善。'];
  const experience = spot.experience && spot.experience.length
    ? spot.experience
    : (spot.highlights || []).slice(0, 3).map((item, index) => ({
        title: ['看点', '体验', '衔接'][index] || '玩法',
        desc: item,
      }));
  const itinerary = spot.itinerary && spot.itinerary.length
    ? spot.itinerary
    : [
        { time: '到达', title: '先看环境', desc: spot.desc || '确认现场开放情况。' },
        { time: '停留', title: '慢慢体验', desc: spot.duration || '按现场情况灵活安排。' },
      ];

  return {
    ...spot,
    kicker: spot.kicker || spot.category || '海林点位',
    lead: spot.lead || spot.desc || '海林村重点到访点位。',
    mood: spot.mood || '建议把它放进一条慢游路线里，而不是匆匆打卡。',
    stats,
    story,
    experience,
    itinerary,
  };
}

Page({
  data: {
    spot: null,
    heroImages: [],
    favorite: false,
    nearby: [],
    developing: false
  },

  onLoad(options) {
    this.loadSpot(options.id);
  },

  loadSpot(id) {
    const detailId = String(id || '');
    if (!hasFeaturedPlaceDetail(detailId)) {
      this.showDeveloping();
      return;
    }
    loadSpots().then((spots) => {
      const spot = mergeSpot(findById(fallbackSpots, id), findById(spots, id));
      this.applySpot(spot, spots);
    });
  },

  applySpot(spot, spots) {
    if (!spot) {
      quickToast('景点不存在');
      setTimeout(() => wx.navigateBack({ delta: 1 }), 500);
      return;
    }

    const displaySpot = buildDisplaySpot(spot);
    const imageClasses = spot.images || [];
    const heroImages = (spot.imageUrls || []).map((url, index) => ({
      key: url,
      url,
      imageClass: imageClasses[index] || imageClasses[0]
    }));
    const allNearby = fallbackSpots
      .filter((item) => item.id !== spot.id && hasFeaturedPlaceDetail(item.id))
      .slice(0, 3);

    this.setData({
      spot: displaySpot,
      heroImages: heroImages.length ? heroImages : imageClasses.map((imageClass, index) => ({ key: `${imageClass}-${index}`, imageClass })),
      favorite: isFavorite(`/pages/spot-detail/spot-detail?id=${spot.id}`),
      nearby: allNearby.length ? allNearby : spots.filter((item) => item.id !== spot.id).slice(0, 3),
      developing: false
    });
  },

  showDeveloping() {
    quickToast('更多介绍即将更新');
    if (typeof getCurrentPages === 'function' && getCurrentPages().length > 1) {
      setTimeout(() => wx.navigateBack({ delta: 1 }), 500);
      return;
    }
    this.setData({ developing: true });
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
    if (!hasFeaturedPlaceDetail(event.currentTarget.dataset.id)) {
      quickToast('更多介绍即将更新');
      return;
    }
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
