const {
  getLocalHomeFallback,
  loadHomeData,
} = require("../../services/content");
const { getHomePreloadCache } = require("../../utils/preload");
const { featureComing, quickToast } = require("../../utils/mock");

const PENDING_MAP_POINT_KEY = "hailin_pending_map_point";

const HOME_IMAGE_FALLBACKS = {
  banners: "https://www.hailin.store/assets/photos/ai-village-gate.jpg",
  itineraries: "/assets/scenes/hailin-creek-ripple.jpg",
  hotRecommends: "https://www.hailin.store/assets/photos/ai-village-gate.jpg",
  products: "https://www.hailin.store/assets/photos/ai-product-honey.jpg",
  rankings: "https://www.hailin.store/assets/photos/ai-village-gate.jpg",
  corridor: "https://www.hailin.store/assets/photos/ai-village-gate.jpg",
  feedsLeft: "https://www.hailin.store/assets/photos/ai-village-gate.jpg",
  feedsRight: "https://www.hailin.store/assets/photos/ricefish-paddy.jpg",
};

function ensureImageList(list, field, fallback) {
  return (Array.isArray(list) ? list : []).map((item) => ({
    ...item,
    [field]: item && item[field] ? item[field] : fallback,
  }));
}

function normalizeHomeImages(data) {
  const source = data || {};
  const feeds = ensureImageList(
    source.feeds,
    "imageUrl",
    HOME_IMAGE_FALLBACKS.feedsLeft,
  );
  return {
    ...source,
    banners: ensureImageList(
      source.banners,
      "imageUrl",
      HOME_IMAGE_FALLBACKS.banners,
    ),
    itineraries: ensureImageList(
      source.itineraries,
      "imageUrl",
      HOME_IMAGE_FALLBACKS.itineraries,
    ),
    hotRecommends: ensureImageList(
      source.hotRecommends,
      "imageUrl",
      HOME_IMAGE_FALLBACKS.hotRecommends,
    ),
    products: ensureImageList(
      source.products,
      "imageUrl",
      HOME_IMAGE_FALLBACKS.products,
    ),
    corridor: ensureImageList(
      source.corridor,
      "imageUrl",
      HOME_IMAGE_FALLBACKS.corridor,
    ),
    rankings: (Array.isArray(source.rankings) ? source.rankings : []).map(
      (section) => ({
        ...section,
        items: ensureImageList(
          section.items,
          "imageUrl",
          HOME_IMAGE_FALLBACKS.rankings,
        ),
      }),
    ),
    feeds,
  };
}

function buildHomeViewData(data) {
  const safeData = normalizeHomeImages(data || getLocalHomeFallback());
  const feeds = safeData.feeds || [];
  const locationText = safeData.locationText || "";
  const sectionPrefix = locationText || "本地";
  return {
    banners: safeData.banners || [],
    gridPages: safeData.gridPages || [],
    products: safeData.products || [],
    hotRecommends: safeData.hotRecommends || [],
    itineraries: safeData.itineraries || [],
    serviceCards: safeData.serviceCards || [],
    rankings: safeData.rankings || [],
    corridor: safeData.corridor || [],
    feedsLeft: feeds.filter((_, index) => index % 2 === 0),
    feedsRight: feeds.filter((_, index) => index % 2 === 1),
    notice: safeData.notice || "",
    weather: safeData.weather || "",
    serviceMode: safeData.serviceMode || "",
    locationText,
    productSectionTitle: `${sectionPrefix}农品预购`,
    rankingSectionTitle: `${sectionPrefix}必打卡榜单`,
    corridorSectionTitle: `${sectionPrefix}长廊`,
  };
}

const initialHomeData = buildHomeViewData(getLocalHomeFallback());

Page({
  data: {
    ...initialHomeData,
    gridCurrent: 0,
  },

  onLoad() {
    const cachedHome = getHomePreloadCache();
    if (cachedHome) {
      this.setData(buildHomeViewData(cachedHome));
    }
    this.loadPageData({ keepCurrent: Boolean(cachedHome) });
  },

  loadPageData(options = {}) {
    if (!options.keepCurrent) {
      this.setData(buildHomeViewData(getLocalHomeFallback()));
    }
    loadHomeData()
      .then((data) => {
        this.setData(buildHomeViewData(data));
      })
      .catch(() => {
        if (!options.keepCurrent) {
          this.setData(buildHomeViewData(getLocalHomeFallback()));
        }
      });
  },

  onHomeImageError(event) {
    const { list, index, field } = event.currentTarget.dataset;
    const itemIndex = Number(index);
    if (!list || !field || Number.isNaN(itemIndex)) return;
    const fallback = HOME_IMAGE_FALLBACKS[list] || HOME_IMAGE_FALLBACKS.banners;
    this.setData({
      [`${list}[${itemIndex}].${field}`]: fallback,
    });
  },

  onGridChange(event) {
    this.setData({
      gridCurrent: event.detail.current,
    });
  },

  onSearchTap() {
    wx.switchTab({ url: "/pages/map/map" });
  },

  onGridTap(event) {
    const { title, url, openType, toast, focusMapPoint } =
      event.currentTarget.dataset;
    this.navigateByDataset(title, url, openType, toast, focusMapPoint);
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

  navigateByDataset(title, url, openType, toast, focusMapPoint) {
    if (toast) {
      quickToast(toast);
      return;
    }
    if (!url) {
      featureComing(title);
      return;
    }
    if (focusMapPoint) {
      wx.setStorageSync(PENDING_MAP_POINT_KEY, focusMapPoint);
    }
    if (openType === "switchTab") {
      wx.switchTab({ url });
      return;
    }
    wx.navigateTo({ url });
  },

  onProductTap(event) {
    const product =
      this.data.products.find((item) => item.id === event.detail.id) || {};
    const id = product.id ? encodeURIComponent(product.id) : "";
    wx.navigateTo({
      url: `/pages/product-list/product-list${id ? `?id=${id}` : ""}`,
    });
  },

  onRankingTap(event) {
    const title = event.currentTarget.dataset.title || "";
    if (title.includes("美食") || title.includes("田鱼")) {
      wx.switchTab({ url: "/pages/food/food" });
      return;
    }
    wx.switchTab({ url: "/pages/map/map" });
  },

  onMoreProducts() {
    wx.navigateTo({ url: "/pages/product-list/product-list" });
  },

  onMoreRoutes() {
    wx.navigateTo({ url: "/pages/route-list/route-list" });
  },

  onFeedTap() {
    wx.navigateTo({ url: "/pages/user-list/user-list?type=notes" });
  },
});
