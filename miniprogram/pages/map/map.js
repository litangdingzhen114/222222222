const fallbackMapPoints = require('../../data/mapPoints');
const {
  categories,
  mapCenter,
  mapTools,
  routeSuggestions,
  subTags
} = require('../../data/mapFeatures');
const { loadMapPoints } = require('../../services/content');
const { quickToast } = require('../../utils/mock');

function buildMarkers(points, activeId) {
  return points.map((point) => {
    const isActive = point.id === activeId;
    return {
      id: point.id,
      latitude: point.latitude,
      longitude: point.longitude,
      title: point.title,
      iconPath: '/assets/map/poi.png',
      width: isActive ? 50 : 40,
      height: isActive ? 50 : 40,
      anchor: {
        x: 0.5,
        y: 0.9
      },
      callout: {
        content: point.title,
        color: isActive ? '#0F6B67' : '#193C3A',
        fontSize: isActive ? 14 : 12,
        borderRadius: 8,
        bgColor: '#FBFFFC',
        padding: 8,
        display: 'ALWAYS'
      }
    };
  });
}

function buildPolyline(route, points) {
  if (!route) return [];
  const routePoints = route.pointIds
    .map((id) => points.find((point) => point.id === id))
    .filter(Boolean)
    .map((point) => ({
      latitude: point.latitude,
      longitude: point.longitude
    }));

  if (routePoints.length < 2) return [];
  return [
    {
      points: routePoints,
      color: '#0F6B67DD',
      width: 6,
      dottedLine: false,
      arrowLine: true
    }
  ];
}

function isTabUrl(url) {
  return ['/pages/home/home', '/pages/map/map', '/pages/food/food', '/pages/mine/mine'].includes(url);
}

Page({
  data: {
    title: '一部手机游青田海林',
    categories,
    subTags,
    mapTools,
    routeSuggestions,
    activeCategory: '全部',
    activeSubTag: '全部',
    searchKeyword: '',
    searchFocus: false,
    center: mapCenter,
    scale: 16,
    points: fallbackMapPoints,
    filteredPoints: fallbackMapPoints,
    markers: buildMarkers(fallbackMapPoints),
    polylines: [],
    activePoint: null,
    activeRoute: null,
    routePanelOpen: false,
    showUserLocation: false,
    summaryText: `共 ${fallbackMapPoints.length} 个点位`
  },

  onReady() {
    this.mapContext = wx.createMapContext('hailinMap');
    this.focusPoints(this.data.filteredPoints);
  },

  onLoad() {
    loadMapPoints().then((points) => {
      this.setData({ points });
      this.applyFilters({ points });
    });
  },

  getFilteredPoints(category, subTag, keyword, points = this.data.points) {
    const cleanKeyword = String(keyword || '').trim().toLowerCase();
    return points.filter((point) => {
      const categoryMatched = !category || category === '全部' || point.type === category;
      const tagMatched = !subTag || subTag === '全部' || point.subType === subTag;
      const text = `${point.title} ${point.type} ${point.subType} ${point.desc} ${point.tips}`.toLowerCase();
      const keywordMatched = !cleanKeyword || text.includes(cleanKeyword);
      return categoryMatched && tagMatched && keywordMatched;
    });
  },

  applyFilters(options = {}) {
    const points = options.points || this.data.points;
    const category = options.category || this.data.activeCategory;
    const subTag = options.subTag || this.data.activeSubTag;
    const keyword = options.keyword == null ? this.data.searchKeyword : options.keyword;
    const activeRoute = options.activeRoute === undefined ? this.data.activeRoute : options.activeRoute;
    const filteredPoints = this.getFilteredPoints(category, subTag, keyword, points);
    const activePoint = filteredPoints.some((point) => this.data.activePoint && point.id === this.data.activePoint.id)
      ? this.data.activePoint
      : null;

    this.setData({
      activeCategory: category,
      activeSubTag: subTag,
      searchKeyword: keyword,
      filteredPoints,
      activePoint,
      activeRoute,
      markers: buildMarkers(filteredPoints, activePoint && activePoint.id),
      polylines: activeRoute ? buildPolyline(activeRoute, points) : [],
      summaryText: this.buildSummaryText(filteredPoints, category, subTag, keyword)
    });
    this.focusPoints(filteredPoints);
  },

  buildSummaryText(points, category, subTag, keyword) {
    const parts = [];
    if (category && category !== '全部') parts.push(category);
    if (subTag && subTag !== '全部') parts.push(subTag);
    if (keyword) parts.push(`搜索“${keyword}”`);
    const prefix = parts.length ? parts.join(' · ') : '海林全域';
    return `${prefix} · ${points.length} 个点位`;
  },

  focusPoints(points) {
    if (!this.mapContext || !points.length) return;
    this.mapContext.includePoints({
      points: points.map((point) => ({
        latitude: point.latitude,
        longitude: point.longitude
      })),
      padding: [82, 48, this.data.activePoint ? 340 : 180, 48]
    });
  },

  onSearchInput(event) {
    this.setData({ routePanelOpen: false });
    this.applyFilters({
      keyword: event.detail.value,
      subTag: this.data.activeSubTag,
      category: this.data.activeCategory,
      activeRoute: null
    });
  },

  onSearchConfirm() {
    this.setData({ searchFocus: false });
    if (!this.data.filteredPoints.length) {
      quickToast('没有找到相关点位');
      return;
    }
    this.focusPoints(this.data.filteredPoints);
  },

  onClearSearch() {
    this.setData({ searchFocus: false });
    this.applyFilters({ keyword: '', activeRoute: null });
  },

  onCategoryTap(event) {
    const category = event.currentTarget.dataset.category;
    this.setData({ routePanelOpen: false });
    this.applyFilters({
      category,
      subTag: '全部',
      keyword: this.data.searchKeyword,
      activeRoute: null
    });
  },

  onSubTagTap(event) {
    this.setData({ routePanelOpen: false });
    this.applyFilters({
      subTag: event.currentTarget.dataset.tag,
      category: this.data.activeCategory,
      keyword: this.data.searchKeyword,
      activeRoute: null
    });
  },

  onMarkerTap(event) {
    this.selectPointById(event.detail.markerId);
  },

  onPointChipTap(event) {
    this.selectPointById(Number(event.currentTarget.dataset.id));
  },

  selectPointById(id) {
    const point = this.data.points.find((item) => item.id === Number(id));
    if (!point) return;

    const filteredPoints = this.data.filteredPoints.some((item) => item.id === point.id)
      ? this.data.filteredPoints
      : [point, ...this.data.filteredPoints];
    this.setData({
      activePoint: point,
      center: {
        latitude: point.latitude,
        longitude: point.longitude
      },
      scale: 17,
      markers: buildMarkers(filteredPoints, point.id),
      routePanelOpen: false
    });
  },

  onToolTap(event) {
    const id = event.currentTarget.dataset.id;
    if (id === 'route') {
      if (this.data.routePanelOpen) {
        this.setData({
          routePanelOpen: false,
          activeRoute: null,
          polylines: []
        });
        this.applyFilters({ activeRoute: null });
        return;
      }
      const activeRoute = this.data.activeRoute || this.data.routeSuggestions[0];
      this.setData({
        routePanelOpen: true,
        activeRoute,
        activePoint: null,
        polylines: buildPolyline(activeRoute, this.data.points)
      });
      this.focusRoute(activeRoute);
      return;
    }
    if (id === 'search') {
      this.setData({ searchFocus: true, routePanelOpen: false });
      return;
    }
    if (id === 'location') {
      this.locateUser();
      return;
    }
    if (id === 'service') {
      this.setData({ routePanelOpen: false });
      this.applyFilters({ category: '公共服务', subTag: '便民服务', keyword: '', activeRoute: null });
      return;
    }
    if (id === 'overview') {
      this.setData({ routePanelOpen: false, activeRoute: null, activePoint: null, polylines: [] });
      this.applyFilters({ category: '全部', subTag: '全部', keyword: '', activeRoute: null });
      return;
    }
  },

  locateUser() {
    if (!wx.getLocation) {
      quickToast('当前环境不支持定位');
      return;
    }
    wx.getLocation({
      type: 'gcj02',
      success: (result) => {
        this.setData({
          center: {
            latitude: result.latitude,
            longitude: result.longitude
          },
          scale: 16,
          showUserLocation: true,
          routePanelOpen: false
        });
        quickToast('已定位到当前位置');
      },
      fail: () => {
        quickToast('授权定位后可查看当前位置');
      }
    });
  },

  onRouteTap(event) {
    const route = this.data.routeSuggestions.find((item) => item.id === event.currentTarget.dataset.id);
    if (!route) return;

    const routePoints = route.pointIds
      .map((id) => this.data.points.find((point) => point.id === id))
      .filter(Boolean);
    this.setData({
      activeRoute: route,
      activePoint: null,
      filteredPoints: routePoints,
      markers: buildMarkers(routePoints),
      polylines: buildPolyline(route, this.data.points),
      summaryText: `${route.title} · ${route.duration}`
    });
    this.focusRoute(route);
  },

  focusRoute(route) {
    if (!route) return;
    const routePoints = route.pointIds
      .map((id) => this.data.points.find((point) => point.id === id))
      .filter(Boolean);
    this.focusPoints(routePoints);
  },

  onOpenRouteDetail() {
    const route = this.data.activeRoute || this.data.routeSuggestions[0];
    wx.navigateTo({
      url: `/pages/route-detail/route-detail?id=${route.routeId}`
    });
  },

  onCloseSheet() {
    this.setData({
      activePoint: null,
      markers: buildMarkers(this.data.filteredPoints)
    });
  },

  onViewDetail() {
    const point = this.data.activePoint;
    if (!point) return;
    if (point.refType === 'spot' && point.refId) {
      wx.navigateTo({
        url: `/pages/spot-detail/spot-detail?id=${point.refId}`
      });
      return;
    }
    if (point.targetUrl) {
      this.navigateSmart(point.targetUrl);
      return;
    }
    this.onGoHere();
  },

  onPointAction() {
    const point = this.data.activePoint;
    if (!point) return;
    if (point.targetUrl) {
      this.navigateSmart(point.targetUrl);
      return;
    }
    if (point.refType === 'spot') {
      this.onViewDetail();
      return;
    }
    this.onGoHere();
  },

  navigateSmart(url) {
    if (isTabUrl(url)) {
      wx.switchTab({ url });
      return;
    }
    wx.navigateTo({ url });
  },

  onGoHere() {
    const point = this.data.activePoint || this.data.points.find((item) => item.id === 10) || this.data.points[0];
    if (!point) return;
    wx.openLocation({
      latitude: point.latitude,
      longitude: point.longitude,
      name: point.title,
      address: `浙江省丽水市青田县海口镇海林村 · ${point.title}`,
      scale: 17,
      fail: () => {
        quickToast('请在真机授权位置服务后导航');
      }
    });
  }
});
