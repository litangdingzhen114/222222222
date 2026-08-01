const fallbackMapPoints = require("../../data/mapPoints");
const {
  categories,
  mapCenter,
  mapTools,
  routeSuggestions,
  subTags,
} = require("../../data/mapFeatures");
const { loadMapDirections, loadMapPoints } = require("../../services/content");
const { quickToast } = require("../../utils/mock");
const { hasFeaturedPlaceDetail, detailUrl } = require("../../utils/placeDetails");

const pointTypeView = {
  SCENIC_SPOT: {
    type: "景点",
    subType: "乡村景点",
    actionText: "查看景点",
    imageUrl: "https://www.hailin.store/assets/photos/ricefish-paddy.jpg",
  },
  PARKING: {
    type: "公共服务",
    subType: "便民服务",
    actionText: "导航前往",
    imageUrl: "https://www.hailin.store/assets/photos/ai-village-gate.jpg",
  },
  TOILET: {
    type: "公共服务",
    subType: "便民服务",
    actionText: "导航前往",
    imageUrl: "https://www.hailin.store/assets/photos/qingtian-tashan.jpg",
  },
  SERVICE_CENTER: {
    type: "公共服务",
    subType: "核心景区",
    actionText: "服务咨询",
    imageUrl: "https://www.hailin.store/assets/photos/ai-village-gate.jpg",
  },
  HOMESTAY: {
    type: "住宿",
    subType: "乡村景点",
    actionText: "民宿预约",
    imageUrl: "https://www.hailin.store/assets/photos/ai-overseas-cafe.jpg",
  },
  FOOD: {
    type: "美食",
    subType: "核心景区",
    actionText: "寻野 cafe",
    imageUrl: "https://www.hailin.store/assets/photos/ai-xunye-cafe.jpg",
  },
  FARM: {
    type: "体验",
    subType: "乡村景点",
    actionText: "预约体验",
    imageUrl: "https://www.hailin.store/assets/photos/ricefish-paddy.jpg",
  },
  MEDICAL: {
    type: "公共服务",
    subType: "便民服务",
    actionText: "导航前往",
    imageUrl: "https://www.hailin.store/assets/photos/ai-village-gate.jpg",
  },
  CAMERA: {
    type: "体验",
    subType: "网红打卡点",
    actionText: "查看直播",
    imageUrl: "https://www.hailin.store/assets/photos/ricefish-paddy.jpg",
  },
  OTHER: {
    type: "公共服务",
    subType: "便民服务",
    actionText: "导航前往",
    imageUrl: "https://www.hailin.store/assets/photos/ai-village-gate.jpg",
  },
};

const markerIcons = {
  scenic: "/assets/map/marker-scenic.png",
  station: "/assets/map/marker-station.png",
  food: "/assets/map/marker-food.png",
  stay: "/assets/map/marker-stay.png",
  parking: "/assets/map/marker-parking.png",
  toilet: "/assets/map/marker-toilet.png",
  farm: "/assets/map/marker-farm.png",
  live: "/assets/map/marker-live.png",
  market: "/assets/map/marker-market.png",
  service: "/assets/map/marker-service.png",
  default: "/assets/map/marker-default.png",
};

const PENDING_MAP_POINT_KEY = "hailin_pending_map_point";

function asNumber(value, fallback) {
  const number = Number(value);
  return isFinite(number) ? number : fallback;
}

function pointView(rawType) {
  const key = String(rawType || "OTHER");
  return pointTypeView[key] || pointTypeView.OTHER;
}

function markerIconPath(point) {
  const text = `${point.title || ""} ${point.type || ""} ${point.subType || ""} ${point.desc || ""}`;
  if (text.includes("停车")) return markerIcons.parking;
  if (text.includes("厕所") || text.includes("卫生间"))
    return markerIcons.toilet;
  if (text.includes("直播") || text.includes("摄像"))
    return markerIcons.live;
  if (
    text.includes("驿站") ||
    text.includes("游客中心") ||
    text.includes("会客")
  )
    return markerIcons.station;
  if (point.type === "美食") return markerIcons.food;
  if (point.type === "住宿") return markerIcons.stay;
  if (point.type === "体验" || text.includes("稻鱼"))
    return markerIcons.farm;
  if (point.type === "购物" || text.includes("集市"))
    return markerIcons.market;
  if (point.type === "公共服务") return markerIcons.service;
  if (point.type === "景点") return markerIcons.scenic;
  return markerIcons.default;
}

function normalizeMapPoint(point, index) {
  const view = pointView(point.type);
  const markerId =
    typeof point.markerId === "number" ? point.markerId : index + 1;
  const latitude = asNumber(point.latitude, mapCenter.latitude);
  const longitude = asNumber(point.longitude, mapCenter.longitude);
  const isEnumType = Boolean(pointTypeView[String(point.type || "")]);
  const relatedType = String(point.relatedEntityType || "");
  const refType =
    point.refType || (relatedType === "SCENIC_SPOT" ? "spot" : "");
  return {
    id: point.id == null ? markerId : point.id,
    markerId,
    title: point.title || point.name || "海林点位",
    type: isEnumType ? view.type : point.type || view.type,
    subType: point.subType || view.subType,
    distance: point.distance || "村内点位",
    desc:
      point.desc ||
      point.description ||
      point.summary ||
      point.address ||
      "海林村公共导览点位",
    imageUrl:
      point.imageUrl || point.coverImage || point.image || view.imageUrl,
    openTime: point.openTime || point.businessHours || "以现场公示为准",
    tips:
      point.tips ||
      (point.address ? `地址：${point.address}` : "可点击导航前往该点位。"),
    actionText: point.actionText || view.actionText,
    latitude,
    longitude,
    markerIconPath: point.markerIconPath || "",
    refType,
    refId: point.refId || point.relatedEntityId || "",
    targetUrl: point.targetUrl || view.targetUrl || "",
    phone: point.phone || "",
  };
}

function normalizeMapPoints(payload) {
  const rawPoints = Array.isArray(payload)
    ? payload
    : payload && Array.isArray(payload.list)
      ? payload.list
      : payload && Array.isArray(payload.items)
        ? payload.items
        : [];
  return rawPoints.map(normalizeMapPoint);
}

function findRoutePoint(points, id) {
  return points.find(
    (point) => String(point.id) === String(id) || point.markerId === Number(id),
  );
}

const initialMapPoints = normalizeMapPoints(fallbackMapPoints);

function buildMarkers(points, activeId) {
  return points.map((point) => {
    const isActive = String(point.id) === String(activeId);
    return {
      id: point.markerId,
      latitude: point.latitude,
      longitude: point.longitude,
      title: point.title,
      iconPath: point.markerIconPath || markerIconPath(point),
      width: isActive ? 68 : 54,
      height: isActive ? 80 : 64,
      anchor: {
        x: 0.5,
        y: 0.96,
      },
      callout: {
        content: point.title,
        color: isActive ? "#0F6B67" : "#193C3A",
        fontSize: isActive ? 14 : 12,
        borderRadius: 10,
        bgColor: isActive ? "#FFF3C4" : "#FBFFFC",
        padding: 8,
        display: "ALWAYS",
      },
    };
  });
}

function buildPolyline(route, points) {
  if (!route) return [];
  const routePoints = route.pointIds
    .map((id) => findRoutePoint(points, id))
    .filter(Boolean)
    .map((point) => ({
      latitude: point.latitude,
      longitude: point.longitude,
    }));

  if (routePoints.length < 2) return [];
  return [
    {
      points: routePoints,
      color: "#0F6B67DD",
      width: 6,
      dottedLine: false,
      arrowLine: true,
    },
  ];
}

function buildDirectionsPolyline(directions) {
  const points = Array.isArray(directions && directions.polyline)
    ? directions.polyline
        .map((point) => ({
          latitude: Number(point.latitude),
          longitude: Number(point.longitude),
        }))
        .filter(
          (point) => isFinite(point.latitude) && isFinite(point.longitude),
        )
    : [];
  if (points.length < 2) return [];
  return [
    {
      points,
      color: "#2477C7DD",
      width: 6,
      dottedLine: false,
      arrowLine: true,
    },
  ];
}

function formatDistance(meters) {
  const value = Number(meters || 0);
  if (!isFinite(value) || value <= 0) return "距离待确认";
  if (value >= 1000) return `${(value / 1000).toFixed(1)}公里`;
  return `${Math.round(value)}米`;
}

function formatDuration(seconds) {
  const value = Number(seconds || 0);
  if (!isFinite(value) || value <= 0) return "时间待确认";
  const minutes = Math.max(1, Math.round(value / 60));
  if (minutes >= 60)
    return `${Math.floor(minutes / 60)}小时${minutes % 60}分钟`;
  return `${minutes}分钟`;
}

function isTabUrl(url) {
  return [
    "/pages/home/home",
    "/pages/map/map",
    "/pages/food/food",
    "/pages/mine/mine",
  ].includes(url);
}

Page({
  data: {
    title: "一部手机游青田海林",
    categories,
    subTags,
    mapTools,
    routeSuggestions,
    activeCategory: "全部",
    activeSubTag: "全部",
    searchKeyword: "",
    searchFocus: false,
    center: mapCenter,
    scale: 16,
    points: initialMapPoints,
    filteredPoints: initialMapPoints,
    markers: buildMarkers(initialMapPoints),
    polylines: [],
    activePoint: null,
    activeRoute: null,
    routePanelOpen: false,
    showUserLocation: false,
    summaryText: `共 ${initialMapPoints.length} 个点位`,
  },

  onReady() {
    this.mapContext = wx.createMapContext("hailinMap");
    this.focusPoints(this.data.filteredPoints);
  },

  onLoad(options = {}) {
    if (options.point) {
      wx.setStorageSync(PENDING_MAP_POINT_KEY, options.point);
    }
    loadMapPoints().then((payload) => {
      const points = normalizeMapPoints(payload);
      if (!points.length) return;
      this.setData({ points });
      this.applyFilters({ points });
      this.consumePendingFocusPoint(points);
    });
  },

  onShow() {
    this.consumePendingFocusPoint();
  },

  consumePendingFocusPoint(points = this.data.points) {
    const pointId = wx.getStorageSync(PENDING_MAP_POINT_KEY);
    if (!pointId || !points.length) return;
    const point = findRoutePoint(points, pointId);
    if (!point) return;
    wx.removeStorageSync(PENDING_MAP_POINT_KEY);
    this.selectPoint(point);
  },

  getFilteredPoints(category, subTag, keyword, points = this.data.points) {
    const cleanKeyword = String(keyword || "")
      .trim()
      .toLowerCase();
    return points.filter((point) => {
      const categoryMatched =
        !category || category === "全部" || point.type === category;
      const tagMatched =
        !subTag || subTag === "全部" || point.subType === subTag;
      const text =
        `${point.title} ${point.type} ${point.subType} ${point.desc} ${point.tips}`.toLowerCase();
      const keywordMatched = !cleanKeyword || text.includes(cleanKeyword);
      return categoryMatched && tagMatched && keywordMatched;
    });
  },

  applyFilters(options = {}) {
    const points = options.points || this.data.points;
    const category = options.category || this.data.activeCategory;
    const subTag = options.subTag || this.data.activeSubTag;
    const keyword =
      options.keyword == null ? this.data.searchKeyword : options.keyword;
    const activeRoute =
      options.activeRoute === undefined
        ? this.data.activeRoute
        : options.activeRoute;
    const filteredPoints = this.getFilteredPoints(
      category,
      subTag,
      keyword,
      points,
    );
    const activePoint = filteredPoints.some(
      (point) => this.data.activePoint && point.id === this.data.activePoint.id,
    )
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
      summaryText: this.buildSummaryText(
        filteredPoints,
        category,
        subTag,
        keyword,
      ),
    });
    this.focusPoints(filteredPoints);
  },

  buildSummaryText(points, category, subTag, keyword) {
    const parts = [];
    if (category && category !== "全部") parts.push(category);
    if (subTag && subTag !== "全部") parts.push(subTag);
    if (keyword) parts.push(`搜索“${keyword}”`);
    const prefix = parts.length ? parts.join(" · ") : "海林全域";
    return `${prefix} · ${points.length} 个点位`;
  },

  focusPoints(points) {
    if (!this.mapContext || !points.length) return;
    this.mapContext.includePoints({
      points: points.map((point) => ({
        latitude: point.latitude,
        longitude: point.longitude,
      })),
      padding: [82, 48, this.data.activePoint ? 520 : 180, 48],
    });
  },

  onSearchInput(event) {
    this.setData({ routePanelOpen: false });
    this.applyFilters({
      keyword: event.detail.value,
      subTag: this.data.activeSubTag,
      category: this.data.activeCategory,
      activeRoute: null,
    });
  },

  onSearchConfirm() {
    this.setData({ searchFocus: false });
    if (!this.data.filteredPoints.length) {
      quickToast("没有找到相关点位");
      return;
    }
    this.focusPoints(this.data.filteredPoints);
  },

  onClearSearch() {
    this.setData({ searchFocus: false });
    this.applyFilters({ keyword: "", activeRoute: null });
  },

  onCategoryTap(event) {
    const category = event.currentTarget.dataset.category;
    this.setData({ routePanelOpen: false });
    this.applyFilters({
      category,
      subTag: "全部",
      keyword: this.data.searchKeyword,
      activeRoute: null,
    });
  },

  onSubTagTap(event) {
    this.setData({ routePanelOpen: false });
    this.applyFilters({
      subTag: event.currentTarget.dataset.tag,
      category: this.data.activeCategory,
      keyword: this.data.searchKeyword,
      activeRoute: null,
    });
  },

  onMarkerTap(event) {
    this.selectPointByMarkerId(event.detail.markerId);
  },

  onPointChipTap(event) {
    this.selectPointById(event.currentTarget.dataset.id);
  },

  selectPointById(id) {
    const point = this.data.points.find(
      (item) => String(item.id) === String(id),
    );
    this.selectPoint(point);
  },

  selectPointByMarkerId(markerId) {
    const point = this.data.points.find(
      (item) => item.markerId === Number(markerId),
    );
    this.selectPoint(point);
  },

  selectPoint(point) {
    if (!point) return;

    const filteredPoints = this.data.filteredPoints.some(
      (item) => item.id === point.id,
    )
      ? this.data.filteredPoints
      : [point, ...this.data.filteredPoints];
    this.setData({
      activePoint: point,
      center: {
        latitude: point.latitude,
        longitude: point.longitude,
      },
      scale: 17,
      markers: buildMarkers(filteredPoints, point.id),
      routePanelOpen: false,
      activeRoute: null,
      polylines: [],
    });
  },

  onToolTap(event) {
    const id = event.currentTarget.dataset.id;
    if (id === "route") {
      if (this.data.routePanelOpen) {
        this.setData({
          routePanelOpen: false,
          activeRoute: null,
          polylines: [],
        });
        this.applyFilters({ activeRoute: null });
        return;
      }
      const activeRoute =
        this.data.activeRoute || this.data.routeSuggestions[0];
      this.setData({
        routePanelOpen: true,
        activeRoute,
        activePoint: null,
        polylines: buildPolyline(activeRoute, this.data.points),
      });
      this.focusRoute(activeRoute);
      return;
    }
    if (id === "search") {
      this.setData({ searchFocus: true, routePanelOpen: false });
      return;
    }
    if (id === "location") {
      this.locateUser();
      return;
    }
    if (id === "service") {
      this.setData({ routePanelOpen: false });
      this.applyFilters({
        category: "公共服务",
        subTag: "便民服务",
        keyword: "",
        activeRoute: null,
      });
      return;
    }
    if (id === "overview") {
      this.setData({
        routePanelOpen: false,
        activeRoute: null,
        activePoint: null,
        polylines: [],
      });
      this.applyFilters({
        category: "全部",
        subTag: "全部",
        keyword: "",
        activeRoute: null,
      });
      return;
    }
  },

  locateUser() {
    if (!wx.getLocation) {
      quickToast("当前环境不支持定位");
      return;
    }
    wx.getLocation({
      type: "gcj02",
      success: (result) => {
        this.setData({
          center: {
            latitude: result.latitude,
            longitude: result.longitude,
          },
          scale: 16,
          showUserLocation: true,
          routePanelOpen: false,
        });
        quickToast("已定位到当前位置");
      },
      fail: () => {
        quickToast("授权定位后可查看当前位置");
      },
    });
  },

  onRouteTap(event) {
    const route = this.data.routeSuggestions.find(
      (item) => item.id === event.currentTarget.dataset.id,
    );
    if (!route) return;

    const routePoints = route.pointIds
      .map((id) => findRoutePoint(this.data.points, id))
      .filter(Boolean);
    this.setData({
      activeRoute: route,
      activePoint: null,
      filteredPoints: routePoints,
      markers: buildMarkers(routePoints),
      polylines: buildPolyline(route, this.data.points),
      summaryText: `${route.title} · ${route.duration}`,
    });
    this.focusRoute(route);
  },

  focusRoute(route) {
    if (!route) return;
    const routePoints = route.pointIds
      .map((id) => findRoutePoint(this.data.points, id))
      .filter(Boolean);
    this.focusPoints(routePoints);
  },

  onOpenRouteDetail() {
    const route = this.data.activeRoute || this.data.routeSuggestions[0];
    wx.navigateTo({
      url: `/pages/route-detail/route-detail?id=${route.routeId}`,
    });
  },

  onCloseSheet() {
    this.setData({
      activePoint: null,
      markers: buildMarkers(this.data.filteredPoints),
    });
  },

  onViewDetail() {
    const point = this.data.activePoint;
    if (!point) return;
    if (point.refType === "spot" && point.refId) {
      if (!hasFeaturedPlaceDetail(point.refId)) {
        quickToast("更多介绍即将更新");
        return;
      }
      wx.navigateTo({
        url: detailUrl(point.refId),
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
    if (point.refType === "spot") {
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
    const point =
      this.data.activePoint ||
      this.data.points.find((item) => item.id === 10) ||
      this.data.points[0];
    if (!point) return;
    if (wx.getLocation) {
      wx.getLocation({
        type: "gcj02",
        success: (location) => {
          this.previewDirections(point, location);
        },
        fail: () => {
          this.openNativeLocation(point);
        },
      });
      return;
    }
    this.openNativeLocation(point);
  },

  previewDirections(point, location) {
    loadMapDirections(point.id, {
      longitude: location.longitude,
      latitude: location.latitude,
    })
      .then((directions) => {
        const directionText = `高德步行 ${formatDistance(directions.distanceMeters)} · ${formatDuration(directions.durationSeconds)}`;
        this.setData({
          activePoint: {
            ...point,
            directionText,
          },
          showUserLocation: true,
          polylines: buildDirectionsPolyline(directions),
          summaryText: `${point.title} · ${directionText}`,
        });
        quickToast(
          directions.provider === "amap" ? "已生成高德路线" : "已生成估算路线",
        );
        this.openNativeLocation(point);
      })
      .catch(() => {
        this.openNativeLocation(point);
      });
  },

  openNativeLocation(point) {
    wx.openLocation({
      latitude: point.latitude,
      longitude: point.longitude,
      name: point.title,
      address: `浙江省丽水市青田县海口镇海林村 · ${point.title}`,
      scale: 17,
      fail: () => {
        quickToast("请在真机授权位置服务后导航");
      },
    });
  },
});
