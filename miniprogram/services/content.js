const banners = require('../data/banners');
const gridPages = require('../data/homeGrids');
const products = require('../data/products');
const recommend = require('../data/recommend');
const mapPoints = require('../data/mapPoints');
const foods = require('../data/foods');
const lives = require('../data/lives');
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
    rankings: recommend.rankings,
    corridor: recommend.corridor,
    feeds: recommend.feeds,
    notice: '海口镇海林村文旅服务升级中，慢直播、AI导游与预约服务可接入真实后台',
    weather: '青田海口镇今日多云，瓯江沿线适合村游慢行',
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
  loadLives,
  submitBooking,
  submitFeedback
};
