const banners = require('../data/banners');
const gridPages = require('../data/homeGrids');
const products = require('../data/products');
const recommend = require('../data/recommend');
const mapPoints = require('../data/mapPoints');
const foods = require('../data/foods');
const lives = require('../data/lives');
const spots = require('../data/spots');
const routes = require('../data/routes');
const { request, serviceConfig, serviceModeText } = require('./api');

function withFallback(endpoint, fallbackValue) {
  return request(endpoint)
    .then((remoteValue) => remoteValue || fallbackValue)
    .catch(() => fallbackValue);
}

function normalizePageList(remoteValue) {
  if (Array.isArray(remoteValue)) return remoteValue;
  if (remoteValue && Array.isArray(remoteValue.list)) return remoteValue.list;
  if (remoteValue && Array.isArray(remoteValue.items)) return remoteValue.items;
  return [];
}

function withContentFallback(key, fallbackValue, mapper) {
  const v1Endpoint = serviceConfig.v1Endpoints && serviceConfig.v1Endpoints[key];
  const legacyEndpoint = serviceConfig.endpoints[key];
  const normalize = (remoteValue) => {
    const mapped = typeof mapper === 'function' ? mapper(remoteValue, fallbackValue) : remoteValue;
    return mapped || fallbackValue;
  };
  if (!v1Endpoint) return withFallback(legacyEndpoint, fallbackValue);
  return request(v1Endpoint)
    .then(normalize)
    .catch(() => withFallback(legacyEndpoint, fallbackValue));
}

function moneyText(cents) {
  if (typeof cents !== 'number') return '';
  return (cents / 100).toFixed(2);
}

function firstImage(item) {
  if (!item) return '';
  if (item.coverImage) return item.coverImage;
  if (item.coverUrl) return item.coverUrl;
  if (item.imageUrl) return item.imageUrl;
  if (Array.isArray(item.images) && item.images.length) return item.images[0];
  if (Array.isArray(item.imageUrls) && item.imageUrls.length) return item.imageUrls[0];
  return '';
}

const mapPointTypeText = {
  SCENIC_SPOT: '景点',
  PARKING: '停车',
  TOILET: '厕所',
  SERVICE_CENTER: '服务',
  HOMESTAY: '住宿',
  FOOD: '餐饮',
  FARM: '采摘',
  MEDICAL: '医疗',
  CAMERA: '直播',
  OTHER: '其他'
};

function adaptBanners(list, fallbackValue) {
  const fallback = fallbackValue || [];
  return normalizePageList(list).map((item, index) => ({
    id: item.id || `banner-${index}`,
    title: item.title || fallback[index % fallback.length]?.title || '海林村欢迎你',
    subtitle: item.subtitle || item.summary || fallback[index % fallback.length]?.subtitle || '',
    tag: item.tag || fallback[index % fallback.length]?.tag || serviceConfig.locationText,
    imageClass: fallback[index % fallback.length]?.imageClass || 'banner-oujiang',
    icon: fallback[index % fallback.length]?.icon || '海',
    imageUrl: firstImage(item) || fallback[index % fallback.length]?.imageUrl
  }));
}

function adaptMapPoints(remoteValue, fallbackValue) {
  const fallback = fallbackValue || [];
  return normalizePageList(remoteValue).map((item, index) => {
    const fallbackItem = fallback[index % Math.max(fallback.length, 1)] || {};
    const typeText = mapPointTypeText[item.type] || item.type || fallbackItem.type || '其他';
    return {
      id: item.id || index + 1,
      markerId: index + 1,
      title: item.name || item.title || fallbackItem.title || '未命名点位',
      type: typeText,
      subType: item.address || item.relatedEntityType || fallbackItem.subType || '',
      distance: fallbackItem.distance || '',
      desc: item.description || fallbackItem.desc || '',
      imageUrl: firstImage(item) || fallbackItem.imageUrl || '/assets/scenes/village-gate.png',
      openTime: item.businessHours || fallbackItem.openTime || '',
      tips: item.description || fallbackItem.tips || '',
      actionText: item.relatedEntityId ? '查看详情' : fallbackItem.actionText || '查看点位',
      latitude: Number(item.latitude || fallbackItem.latitude || 0),
      longitude: Number(item.longitude || fallbackItem.longitude || 0),
      refType: item.relatedEntityType === 'SCENIC_SPOT' ? 'spot' : fallbackItem.refType,
      refId: item.relatedEntityId || fallbackItem.refId,
      targetUrl: fallbackItem.targetUrl
    };
  });
}

function adaptFoods(remoteValue, fallbackValue) {
  const fallback = fallbackValue || [];
  return normalizePageList(remoteValue).map((item, index) => {
    const fallbackItem = fallback[index % Math.max(fallback.length, 1)] || {};
    return {
      id: item.id || fallbackItem.id || `food-${index}`,
      name: item.name || fallbackItem.name || '海林乡味',
      perCapita: item.avgPrice ? `${moneyText(item.avgPrice)}元` : fallbackItem.perCapita || '到店咨询',
      distance: fallbackItem.distance || '',
      desc: item.description || fallbackItem.desc || '',
      tags: item.tags || fallbackItem.tags || [],
      imageClass: fallbackItem.imageClass || 'ph-ricefish',
      icon: fallbackItem.icon || '食',
      imageUrl: firstImage(item) || fallbackItem.imageUrl
    };
  });
}

function adaptSpots(remoteValue, fallbackValue) {
  const fallback = fallbackValue || [];
  return normalizePageList(remoteValue).map((item, index) => {
    const fallbackItem = fallback.find((spot) => spot.id === item.id) || fallback[index % Math.max(fallback.length, 1)] || {};
    return {
      ...fallbackItem,
      id: item.id || fallbackItem.id || `spot-${index}`,
      name: item.name || fallbackItem.name || '海林景点',
      category: item.tags?.[0] || fallbackItem.category || '乡村景点',
      tags: item.tags || fallbackItem.tags || [],
      openTime: item.openingHours || fallbackItem.openTime || '',
      duration: item.suggestedDuration || fallbackItem.duration || '',
      distance: fallbackItem.distance || '',
      desc: item.summary || item.content || fallbackItem.desc || '',
      coverUrl: firstImage(item) || fallbackItem.coverUrl,
      imageUrls: item.images?.length ? item.images : fallbackItem.imageUrls,
      icon: fallbackItem.icon || '景'
    };
  });
}

function adaptRoutes(remoteValue, fallbackValue) {
  const fallback = fallbackValue || [];
  return normalizePageList(remoteValue).map((item, index) => {
    const fallbackItem = fallback.find((route) => route.id === item.id) || fallback[index % Math.max(fallback.length, 1)] || {};
    return {
      ...fallbackItem,
      id: item.id || fallbackItem.id || `route-${index}`,
      name: item.name || fallbackItem.name || '海林路线',
      subtitle: item.summary || fallbackItem.subtitle || '',
      reason: item.content || item.summary || fallbackItem.reason || '',
      duration: item.duration || fallbackItem.duration || '',
      audience: item.suitableFor || fallbackItem.audience || '',
      cost: fallbackItem.cost || '',
      imageUrl: firstImage(item) || fallbackItem.imageUrl,
      timeline: fallbackItem.timeline || []
    };
  });
}

function adaptProducts(remoteValue, fallbackValue) {
  const fallback = fallbackValue || [];
  return normalizePageList(remoteValue).map((item, index) => {
    const fallbackItem = fallback[index % Math.max(fallback.length, 1)] || {};
    return {
      id: item.id || fallbackItem.id || `product-${index}`,
      title: item.name || item.title || fallbackItem.title || '海林农特产',
      price: moneyText(item.price) || fallbackItem.price || '',
      imageClass: fallbackItem.imageClass || 'ph-product-fish',
      icon: fallbackItem.icon || '物',
      imageUrl: firstImage(item) || fallbackItem.imageUrl
    };
  });
}

function adaptLives(remoteValue, fallbackValue) {
  const fallback = fallbackValue || [];
  return normalizePageList(remoteValue).map((item, index) => {
    const fallbackItem = fallback[index % Math.max(fallback.length, 1)] || {};
    return {
      id: item.id || fallbackItem.id || `live-${index}`,
      title: item.name || item.title || fallbackItem.title || '海林慢直播',
      viewers: fallbackItem.viewers || 0,
      desc: item.description || fallbackItem.desc || '',
      imageClass: fallbackItem.imageClass || 'ph-oujiang',
      icon: fallbackItem.icon || '播',
      coverUrl: firstImage(item) || fallbackItem.coverUrl,
      liveUrl: item.playUrl || fallbackItem.liveUrl || '',
      hlsUrl: fallbackItem.hlsUrl || '',
      enabled: item.status === 'ONLINE' || fallbackItem.enabled !== false,
      statusText: item.status === 'ONLINE' ? '直播中' : '维护中'
    };
  });
}

function adaptHome(remoteValue, fallbackValue) {
  if (!remoteValue || !Array.isArray(remoteValue.banners)) return fallbackValue;
  const scenicItems = adaptSpots(remoteValue.scenicSpots || [], spots).slice(0, 4);
  const routeItems = adaptRoutes(remoteValue.routes || [], routes).slice(0, 2);
  const productItems = adaptProducts(remoteValue.products || [], products).slice(0, 3);
  const notices = normalizePageList(remoteValue.notices);
  return {
    ...fallbackValue,
    banners: adaptBanners(remoteValue.banners, fallbackValue.banners),
    products: productItems.length ? productItems : fallbackValue.products,
    hotRecommends: scenicItems.length
      ? scenicItems.map((item) => ({
          id: item.id,
          title: item.name,
          subtitle: item.desc,
          buttonText: '查看详情',
          icon: item.icon || '景',
          imageUrl: item.coverUrl,
          url: `/pages/spot-detail/spot-detail?id=${encodeURIComponent(item.id)}`
        }))
      : fallbackValue.hotRecommends,
    itineraries: routeItems.length ? routeItems : fallbackValue.itineraries,
    notice: notices[0]?.title || fallbackValue.notice,
    serviceMode: serviceModeText(),
    locationText: serviceConfig.locationText
  };
}

function loadHomeData() {
  const fallback = {
    banners,
    gridPages,
    products,
    hotRecommends: recommend.hotRecommends,
    itineraries: recommend.itineraries,
    serviceCards: recommend.serviceCards,
    rankings: recommend.rankings,
    corridor: recommend.corridor,
    feeds: recommend.feeds,
    notice: '今日推荐：先到游客中心确认停车与讲解，再走溪谷步道，午餐预约海林田鱼家宴',
    weather: '青田海口镇多云间晴，瓯江沿线适合慢行；亲水步道雨后注意防滑',
    serviceMode: serviceModeText(),
    locationText: serviceConfig.locationText
  };

  return withContentFallback('home', fallback, adaptHome);
}

function loadMapPoints() {
  return withContentFallback('mapPoints', mapPoints, adaptMapPoints);
}

function loadFoods() {
  return withContentFallback('foods', foods, adaptFoods);
}

function loadSpots() {
  return withContentFallback('spots', spots, adaptSpots);
}

function loadRoutes() {
  return withContentFallback('routes', routes, adaptRoutes);
}

function loadProducts() {
  return withContentFallback('products', products, adaptProducts);
}

function loadLives() {
  return withContentFallback('lives', lives, adaptLives);
}

function submitBooking(payload) {
  return request(serviceConfig.endpoints.booking, {
    method: 'POST',
    data: payload
  });
}

function submitFeedback(payload) {
  return request(serviceConfig.endpoints.feedback, {
    method: 'POST',
    data: payload
  });
}

function submitOrder(payload) {
  return request(serviceConfig.endpoints.orders, {
    method: 'POST',
    data: payload
  });
}

function loadOrders(clientId) {
  const endpoint = `${serviceConfig.endpoints.orders}?clientId=${encodeURIComponent(clientId || '')}`;
  return withFallback(endpoint, { items: [], page: 1, pageSize: 50, total: 0 });
}

function loadOrderDetail(id, clientId) {
  const endpoint = `${serviceConfig.endpoints.orders}/${encodeURIComponent(id)}?clientId=${encodeURIComponent(clientId || '')}`;
  return request(endpoint);
}

function cancelOrder(id, clientId, note) {
  return request(`${serviceConfig.endpoints.orders}/${encodeURIComponent(id)}/cancel`, {
    method: 'PATCH',
    data: { clientId, note }
  });
}

module.exports = {
  loadHomeData,
  loadMapPoints,
  loadFoods,
  loadSpots,
  loadRoutes,
  loadProducts,
  loadLives,
  submitBooking,
  submitFeedback,
  submitOrder,
  loadOrders,
  loadOrderDetail,
  cancelOrder
};
