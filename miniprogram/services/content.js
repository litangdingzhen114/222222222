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

  return withFallback(serviceConfig.endpoints.home, fallback);
}

function loadMapPoints() {
  return withFallback(serviceConfig.endpoints.mapPoints, mapPoints);
}

function loadFoods() {
  return withFallback(serviceConfig.endpoints.foods, foods);
}

function loadSpots() {
  return withFallback(serviceConfig.endpoints.spots, spots);
}

function loadRoutes() {
  return withFallback(serviceConfig.endpoints.routes, routes);
}

function loadProducts() {
  return withFallback(serviceConfig.endpoints.products, products);
}

function loadLives() {
  return withFallback(serviceConfig.endpoints.lives, lives);
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

module.exports = {
  loadHomeData,
  loadMapPoints,
  loadFoods,
  loadSpots,
  loadRoutes,
  loadProducts,
  loadLives,
  submitBooking,
  submitFeedback
};
