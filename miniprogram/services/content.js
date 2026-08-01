const banners = require("../data/banners");
const gridPages = require("../data/homeGrids");
const products = require("../data/products");
const recommend = require("../data/recommend");
const mapPoints = require("../data/mapPoints");
const foods = require("../data/foods");
const lives = require("../data/lives");
const spots = require("../data/spots");
const routes = require("../data/routes");
const { mediaUrl, request, serviceConfig, serviceModeText } = require("./api");

function isContentFallbackEnabled() {
  return Boolean(
    serviceConfig.contentFallbackEnabled || serviceConfig.reviewMode,
  );
}

function fallbackOrReject(fallbackValue, error) {
  if (isContentFallbackEnabled()) return Promise.resolve(fallbackValue);
  return Promise.reject(error || new Error("Content service unavailable"));
}

function withFallback(endpoint, fallbackValue) {
  return request(endpoint)
    .then((remoteValue) => remoteValue || fallbackValue)
    .catch((error) => fallbackOrReject(fallbackValue, error));
}

function normalizePageList(remoteValue) {
  if (Array.isArray(remoteValue)) return remoteValue;
  if (remoteValue && Array.isArray(remoteValue.list)) return remoteValue.list;
  if (remoteValue && Array.isArray(remoteValue.items)) return remoteValue.items;
  return [];
}

function withContentFallback(key, fallbackValue, mapper) {
  const v1Endpoint =
    serviceConfig.v1Endpoints && serviceConfig.v1Endpoints[key];
  const legacyEndpoint = serviceConfig.endpoints[key];
  const normalize = (remoteValue) => {
    const mapped =
      typeof mapper === "function"
        ? mapper(remoteValue, fallbackValue)
        : remoteValue;
    return mapped || (isContentFallbackEnabled() ? fallbackValue : mapped);
  };
  if (!v1Endpoint) {
    return request(legacyEndpoint)
      .then(normalize)
      .catch((error) => fallbackOrReject(fallbackValue, error));
  }
  return request(v1Endpoint)
    .then(normalize)
    .catch((error) => {
      if (serviceConfig.legacyApiFallbackEnabled === false || !legacyEndpoint) {
        return fallbackOrReject(fallbackValue, error);
      }
      return request(legacyEndpoint)
        .then(normalize)
        .catch((legacyError) => fallbackOrReject(fallbackValue, legacyError));
    });
}

function moneyText(cents) {
  if (typeof cents !== "number") return "";
  return (cents / 100).toFixed(2);
}

function firstImage(item) {
  if (!item) return "";
  if (cleanImage(item.coverImage)) return cleanImage(item.coverImage);
  if (cleanImage(item.coverUrl)) return cleanImage(item.coverUrl);
  if (cleanImage(item.imageUrl)) return cleanImage(item.imageUrl);
  if (Array.isArray(item.images) && item.images.length)
    return cleanImage(item.images[0]);
  if (Array.isArray(item.imageUrls) && item.imageUrls.length)
    return cleanImage(item.imageUrls[0]);
  return "";
}

const defaultImages = {
  banner: "https://www.hailin.store/assets/photos/ai-village-gate.jpg",
  mapPoint: "https://www.hailin.store/assets/photos/ai-village-gate.jpg",
  food: "https://www.hailin.store/assets/photos/ai-xunye-cafe.jpg",
  spot: "https://www.hailin.store/assets/photos/ai-village-gate.jpg",
  route: "https://www.hailin.store/assets/photos/qingtian-city.jpg",
  product: "https://www.hailin.store/assets/photos/ai-product-honey.jpg",
  live: "https://www.hailin.store/assets/photos/ai-village-gate.jpg",
};

const legacySceneImages = {
  "/assets/scenes/village-gate.png": "https://www.hailin.store/assets/photos/ai-village-gate.jpg",
  "/assets/scenes/ricefish-field.png": "https://www.hailin.store/assets/photos/ricefish-paddy.jpg",
  "/assets/scenes/creek-trail.png": "https://www.hailin.store/assets/photos/qingtian-tashan.jpg",
  "/assets/scenes/tofu-workshop.png": "https://www.hailin.store/assets/photos/ai-tofu-workshop.jpg",
  "/assets/scenes/overseas-yard.png": "https://www.hailin.store/assets/photos/ai-overseas-cafe.jpg",
  "/assets/scenes/overseas-cafe.png": "https://www.hailin.store/assets/photos/ai-xunye-cafe.jpg",
  "/assets/scenes/ricefish-banquet.png": "https://www.hailin.store/assets/photos/ricefish-drying.jpg",
  "/assets/scenes/creek-tea.png": "https://www.hailin.store/assets/photos/qingtian-tashan.jpg",
  "/assets/seed/product-rice.jpg": "https://www.hailin.store/assets/photos/ricefish-paddy.jpg",
  "/assets/seed/product-fish.jpg": "https://www.hailin.store/assets/photos/ricefish-harvest.jpg",
  "/assets/seed/product-tea.jpg": "https://www.hailin.store/assets/photos/qingtian-tashan.jpg",
  "/assets/seed/product-rice-cake.jpg": "https://www.hailin.store/assets/photos/ricefish-drying.jpg",
  "/assets/seed/product-postcard.jpg": "https://www.hailin.store/assets/photos/ai-oujiang-postcards.jpg",
  "/assets/seed/product-guide-map.jpg": "https://www.hailin.store/assets/photos/ai-map-tianpu-station.jpg",
};

function cleanImage(value) {
  const image = String(value || "").trim();
  if (!image || image === "null" || image === "undefined") return "";
  const normalized = legacySceneImages[image] || image;
  if (/^https?:\/\//i.test(normalized)) return normalized;
  if (
    normalized.startsWith("/assets/photos/") ||
    normalized.startsWith("/assets/seed/") ||
    normalized.startsWith("/media/")
  ) {
    return mediaUrl(normalized);
  }
  return normalized;
}

function fallbackItemAt(fallbackValue, index) {
  if (!Array.isArray(fallbackValue) || !fallbackValue.length) return {};
  return fallbackValue[index % fallbackValue.length] || {};
}

function displayImage(item, fallbackItem, type) {
  return (
    firstImage(item) ||
    firstImage(fallbackItem) ||
    defaultImages[type] ||
    defaultImages.banner
  );
}

function displayImages(item, fallbackItem, type) {
  const imageSet = new Set();
  [
    item?.images,
    item?.imageUrls,
    fallbackItem?.imageUrls,
    fallbackItem?.images,
  ].forEach((list) => {
    if (!Array.isArray(list)) return;
    list.forEach((image) => {
      const clean = cleanImage(image);
      if (clean) imageSet.add(clean);
    });
  });
  [firstImage(item), firstImage(fallbackItem), defaultImages[type]].forEach(
    (image) => {
      const clean = cleanImage(image);
      if (clean) imageSet.add(clean);
    },
  );
  return Array.from(imageSet);
}

const mapPointTypeText = {
  SCENIC_SPOT: "景点",
  PARKING: "停车",
  TOILET: "厕所",
  SERVICE_CENTER: "服务",
  HOMESTAY: "住宿",
  FOOD: "餐饮",
  FARM: "采摘",
  MEDICAL: "医疗",
  CAMERA: "直播",
  OTHER: "其他",
};

function adaptBanners(list, fallbackValue) {
  const fallback = fallbackValue || [];
  return normalizePageList(list).map((item, index) => ({
    id: item.id || `banner-${index}`,
    title:
      item.title || fallbackItemAt(fallback, index).title || "黄湖林场欢迎你",
    subtitle:
      item.subtitle ||
      item.summary ||
      fallbackItemAt(fallback, index).subtitle ||
      "",
    tag:
      item.tag ||
      fallbackItemAt(fallback, index).tag ||
      serviceConfig.locationText,
    imageClass: fallbackItemAt(fallback, index).imageClass || "banner-oujiang",
    icon: fallbackItemAt(fallback, index).icon || "海",
    imageUrl: displayImage(item, fallbackItemAt(fallback, index), "banner"),
  }));
}

function adaptMapPoints(remoteValue, fallbackValue) {
  const fallback = fallbackValue || [];
  return normalizePageList(remoteValue).map((item, index) => {
    const fallbackItem = fallback[index % Math.max(fallback.length, 1)] || {};
    const typeText =
      mapPointTypeText[item.type] || item.type || fallbackItem.type || "其他";
    return {
      id: item.id || index + 1,
      markerId: index + 1,
      title: item.name || item.title || fallbackItem.title || "未命名点位",
      type: typeText,
      subType:
        item.address || item.relatedEntityType || fallbackItem.subType || "",
      distance: fallbackItem.distance || "",
      desc: item.description || fallbackItem.desc || "",
      imageUrl: displayImage(item, fallbackItem, "mapPoint"),
      openTime: item.businessHours || fallbackItem.openTime || "",
      tips: item.description || fallbackItem.tips || "",
      actionText: item.relatedEntityId
        ? "查看详情"
        : fallbackItem.actionText || "查看点位",
      latitude: Number(item.latitude || fallbackItem.latitude || 0),
      longitude: Number(item.longitude || fallbackItem.longitude || 0),
      refType:
        item.relatedEntityType === "SCENIC_SPOT"
          ? "spot"
          : fallbackItem.refType,
      refId: item.relatedEntityId || fallbackItem.refId,
      targetUrl: fallbackItem.targetUrl,
    };
  });
}

function adaptFoods(remoteValue, fallbackValue) {
  const fallback = fallbackValue || [];
  return normalizePageList(remoteValue).map((item, index) => {
    const fallbackItem = fallback[index % Math.max(fallback.length, 1)] || {};
    return {
      id: item.id || fallbackItem.id || `food-${index}`,
      name: item.name || fallbackItem.name || "黄湖林场乡味",
      perCapita: item.avgPrice
        ? `${moneyText(item.avgPrice)}元`
        : fallbackItem.perCapita || "到店咨询",
      distance: fallbackItem.distance || "",
      desc: item.description || fallbackItem.desc || "",
      tags: item.tags || fallbackItem.tags || [],
      imageClass: fallbackItem.imageClass || "ph-ricefish",
      icon: fallbackItem.icon || "食",
      imageUrl: displayImage(item, fallbackItem, "food"),
    };
  });
}

function adaptSpots(remoteValue, fallbackValue) {
  const fallback = fallbackValue || [];
  return normalizePageList(remoteValue).map((item, index) => {
    const fallbackItem =
      fallback.find((spot) => spot.id === item.id) ||
      fallback[index % Math.max(fallback.length, 1)] ||
      {};
    const coverUrl = displayImage(item, fallbackItem, "spot");
    return {
      ...fallbackItem,
      id: item.id || fallbackItem.id || `spot-${index}`,
      name:
        item.name ||
        item.title ||
        fallbackItem.name ||
        fallbackItem.title ||
        "黄湖林场景点",
      category: item.tags?.[0] || fallbackItem.category || "乡村景点",
      tags: item.tags || fallbackItem.tags || [],
      openTime: item.openingHours || fallbackItem.openTime || "",
      duration: item.suggestedDuration || fallbackItem.duration || "",
      distance: fallbackItem.distance || "",
      desc:
        item.summary ||
        item.content ||
        item.subtitle ||
        fallbackItem.desc ||
        fallbackItem.subtitle ||
        "",
      title:
        item.title ||
        item.name ||
        fallbackItem.title ||
        fallbackItem.name ||
        "黄湖林场景点",
      subtitle:
        item.subtitle ||
        item.summary ||
        fallbackItem.subtitle ||
        fallbackItem.desc ||
        "",
      buttonText: item.buttonText || fallbackItem.buttonText || "查看详情",
      imageClass: item.imageClass || fallbackItem.imageClass,
      coverUrl,
      imageUrls: displayImages(item, fallbackItem, "spot"),
      icon: item.icon || fallbackItem.icon || "景",
      url: item.url || fallbackItem.url,
      openType: item.openType || fallbackItem.openType,
    };
  });
}

function adaptRoutes(remoteValue, fallbackValue) {
  const fallback = fallbackValue || [];
  return normalizePageList(remoteValue).map((item, index) => {
    const fallbackItem =
      fallback.find((route) => route.id === item.id) ||
      fallback[index % Math.max(fallback.length, 1)] ||
      {};
    const routeTitle =
      item.title ||
      item.name ||
      fallbackItem.title ||
      fallbackItem.name ||
      "黄湖林场路线";
    const timeline =
      Array.isArray(item.timeline) && item.timeline.length
        ? item.timeline
        : fallbackItem.timeline || [];
    return {
      ...fallbackItem,
      id: item.id || fallbackItem.id || `route-${index}`,
      name: item.name || fallbackItem.name || "黄湖林场路线",
      title: routeTitle,
      subtitle: item.summary || fallbackItem.subtitle || "",
      reason: item.content || item.summary || fallbackItem.reason || "",
      duration: item.duration || fallbackItem.duration || "",
      time: item.duration || fallbackItem.time || fallbackItem.duration || "",
      route:
        item.route ||
        timeline
          .map((step) => step.title)
          .filter(Boolean)
          .join(" - ") ||
        fallbackItem.route ||
        "",
      highlights: item.highlights || fallbackItem.highlights || [],
      label: item.label || fallbackItem.label || "推荐路线",
      audience: item.suitableFor || fallbackItem.audience || "",
      cost: fallbackItem.cost || "",
      imageUrl: displayImage(item, fallbackItem, "route"),
      timeline,
      url:
        item.url ||
        fallbackItem.url ||
        `/pages/route-detail/route-detail?id=${encodeURIComponent(item.id || fallbackItem.id || `route-${index}`)}`,
    };
  });
}

function adaptProducts(remoteValue, fallbackValue) {
  const fallback = fallbackValue || [];
  return normalizePageList(remoteValue).map((item, index) => {
    const fallbackItem = fallback[index % Math.max(fallback.length, 1)] || {};
    return {
      id: item.id || fallbackItem.id || `product-${index}`,
      title: item.name || item.title || fallbackItem.title || "黄湖林场农特产",
      subtitle: item.subtitle || fallbackItem.subtitle || "",
      price: moneyText(item.price) || fallbackItem.price || "",
      categoryId: item.categoryId || fallbackItem.categoryId || "",
      stock: item.stock ?? fallbackItem.stock,
      unit: item.unit || fallbackItem.unit || "件",
      specification: item.specification || fallbackItem.specification || "",
      imageClass: fallbackItem.imageClass || "ph-product-fish",
      icon: fallbackItem.icon || "物",
      imageUrl: displayImage(item, fallbackItem, "product"),
    };
  });
}

function localProducts(fallbackValue) {
  return (Array.isArray(fallbackValue) ? fallbackValue : []).map(
    (item, index) => ({
      id: item.id || `local-product-${index}`,
      title: item.title || item.name || "黄湖林场农特产",
      subtitle: item.subtitle || "",
      price: item.price || "",
      categoryId: item.categoryId || "",
      stock: item.stock,
      unit: item.unit || "件",
      specification: item.specification || "",
      imageClass: item.imageClass || "ph-product-honey",
      icon: item.icon || "物",
      imageUrl: displayImage(item, item, "product"),
    }),
  );
}

function mergeProducts(remoteValue, fallbackValue) {
  const curated = localProducts(fallbackValue);
  const remoteItems = adaptProducts(remoteValue, fallbackValue);
  const seen = new Set(
    curated.flatMap((item) => [String(item.id), String(item.title)]),
  );
  return curated.concat(
    remoteItems.filter((item) => {
      const keys = [String(item.id), String(item.title)];
      if (keys.some((key) => seen.has(key))) return false;
      keys.forEach((key) => seen.add(key));
      return true;
    }),
  );
}

function mergeMapPoints(remoteValue, fallbackValue) {
  const localPoints = Array.isArray(fallbackValue) ? fallbackValue : [];
  const remotePoints = adaptMapPoints(remoteValue, fallbackValue);
  const seen = new Set(
    localPoints.flatMap((item) => [String(item.id), String(item.title)]),
  );
  return localPoints.concat(
    remotePoints.filter((item) => {
      const keys = [String(item.id), String(item.title)];
      if (keys.some((key) => seen.has(key))) return false;
      keys.forEach((key) => seen.add(key));
      return true;
    }),
  );
}

function adaptLives(remoteValue, fallbackValue) {
  const fallback = fallbackValue || [];
  return normalizePageList(remoteValue).map((item, index) => {
    const fallbackItem = fallback[index % Math.max(fallback.length, 1)] || {};
    return {
      id: item.id || fallbackItem.id || `live-${index}`,
      title: item.name || item.title || fallbackItem.title || "黄湖林场慢直播",
      viewers: fallbackItem.viewers || 0,
      desc: item.description || fallbackItem.desc || "",
      imageClass: fallbackItem.imageClass || "ph-oujiang",
      icon: fallbackItem.icon || "播",
      coverUrl: displayImage(item, fallbackItem, "live"),
      liveUrl: item.playUrl || fallbackItem.liveUrl || "",
      hlsUrl: fallbackItem.hlsUrl || "",
      enabled: item.status === "ONLINE" || fallbackItem.enabled !== false,
      statusText: item.status === "ONLINE" ? "直播中" : "维护中",
    };
  });
}

function adaptHome(remoteValue, fallbackValue) {
  const source =
    remoteValue && remoteValue.content ? remoteValue.content : remoteValue;
  if (!source || !Array.isArray(source.banners)) return fallbackValue;
  const scenicItems = adaptSpots(
    source.scenicSpots || source.hotRecommends || [],
    spots,
  ).slice(0, 4);
  const routeItems = adaptRoutes(
    source.routes || source.itineraries || [],
    recommend.itineraries,
  ).slice(0, 2);
  const productItems = mergeProducts(source.products || [], products).slice(
    0,
    4,
  );
  const notices = normalizePageList(source.notices);
  return {
    ...fallbackValue,
    banners: adaptBanners(source.banners, fallbackValue.banners),
    products: productItems.length ? productItems : fallbackValue.products,
    hotRecommends: scenicItems.length
      ? scenicItems.map((item) => ({
          id: item.id,
          title: item.title || item.name,
          subtitle: item.subtitle || item.desc,
          buttonText: item.buttonText || "查看详情",
          icon: item.icon || "景",
          imageClass: item.imageClass,
          imageUrl: item.coverUrl,
          url:
            item.url ||
            `/pages/spot-detail/spot-detail?id=${encodeURIComponent(item.id)}`,
          openType: item.openType,
        }))
      : fallbackValue.hotRecommends,
    itineraries: routeItems.length ? routeItems : fallbackValue.itineraries,
    notice: source.notice || notices[0]?.title || fallbackValue.notice,
    weather: source.weather || fallbackValue.weather,
    serviceMode: serviceModeText(),
    locationText: serviceConfig.locationText,
  };
}

function loadHomeData() {
  return withContentFallback("home", getLocalHomeFallback(), adaptHome);
}

function getLocalHomeFallback() {
  return {
    banners,
    gridPages,
    products,
    hotRecommends: recommend.hotRecommends,
    itineraries: recommend.itineraries,
    serviceCards: recommend.serviceCards,
    rankings: recommend.rankings,
    corridor: recommend.corridor,
    feeds: recommend.feeds,
    notice:
      "今日推荐：先到游客中心确认停车与讲解，再走溪谷步道，午餐预约稻田田鱼家宴",
    weather: "黄湖林场文旅信息持续更新中，实际服务以村庄公告和现场确认为准",
    serviceMode: serviceModeText(),
    locationText: serviceConfig.locationText,
  };
}

function loadMapPoints() {
  return withContentFallback("mapPoints", mapPoints, mergeMapPoints);
}

function loadMapDirections(pointId, origin, mode = "walking") {
  const id = encodeURIComponent(pointId || "");
  if (!id || !origin)
    return Promise.reject(new Error("missing map direction input"));
  const query = [
    `longitude=${encodeURIComponent(origin.longitude)}`,
    `latitude=${encodeURIComponent(origin.latitude)}`,
    `mode=${encodeURIComponent(mode)}`,
  ].join("&");
  return request(`/api/v1/map-points/${id}/directions?${query}`);
}

function loadFoods() {
  return withContentFallback("foods", foods, adaptFoods);
}

function loadSpots() {
  return withContentFallback("spots", spots, adaptSpots);
}

function loadRoutes() {
  return withContentFallback("routes", routes, adaptRoutes);
}

function loadProducts() {
  return withContentFallback("products", products, mergeProducts);
}

function loadLives() {
  return withContentFallback("lives", lives, adaptLives);
}

function normalizePlayUrl(payload) {
  if (!payload) return "";
  const url = String(
    payload.playUrl || payload.hlsUrl || payload.liveUrl || "",
  ).trim();
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("/")) {
    const { mediaUrl } = require("./api");
    return mediaUrl(url);
  }
  return url;
}

function loadLivePlayUrl(id) {
  const cameraId = encodeURIComponent(id || "");
  if (!cameraId) return Promise.reject(new Error("missing camera id"));
  return request(`/api/v1/cameras/${cameraId}/play-url`, {
    method: "POST",
  }).then((payload) => ({
    ...payload,
    playUrl: normalizePlayUrl(payload),
  }));
}

function submitBooking(payload) {
  return request(serviceConfig.endpoints.booking, {
    method: "POST",
    data: payload,
  });
}

function submitFeedback(payload) {
  return request(serviceConfig.endpoints.feedback, {
    method: "POST",
    data: payload,
  });
}

function submitOrder(payload) {
  return request(serviceConfig.endpoints.orders, {
    method: "POST",
    data: payload,
  });
}

function loadOrders(clientId) {
  const endpoint = `${serviceConfig.endpoints.orders}?clientId=${encodeURIComponent(clientId || "")}`;
  return withFallback(endpoint, { items: [], page: 1, pageSize: 50, total: 0 });
}

function loadOrderDetail(id, clientId) {
  const endpoint = `${serviceConfig.endpoints.orders}/${encodeURIComponent(id)}?clientId=${encodeURIComponent(clientId || "")}`;
  return request(endpoint);
}

function cancelOrder(id, clientId, note) {
  return request(
    `${serviceConfig.endpoints.orders}/${encodeURIComponent(id)}/cancel`,
    {
      method: "PATCH",
      data: { clientId, note },
    },
  );
}

module.exports = {
  getLocalHomeFallback,
  loadHomeData,
  loadMapPoints,
  loadMapDirections,
  loadFoods,
  loadSpots,
  loadRoutes,
  loadProducts,
  loadLives,
  loadLivePlayUrl,
  submitBooking,
  submitFeedback,
  submitOrder,
  loadOrders,
  loadOrderDetail,
  cancelOrder,
};
