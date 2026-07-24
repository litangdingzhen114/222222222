module.exports = {
  villageName: '海林村',
  locationText: '浙江省丽水市青田县海口镇海林村',
  regionKeywords: ['瓯江', '青田石', '田鱼', '侨乡', '山水村落'],

  // 上线后端域名。真机和正式版必须使用 HTTPS，并配置到微信 request 合法域名。
  // 小程序端不保存 AI key、直播密钥或管理后台 token，统一由后端代理。
  apiBaseUrl: 'https://api.sunmaosun.com',
  devApiBaseUrl: 'http://127.0.0.1:8787',
  requestTimeout: 3000,

  endpoints: {
    home: '/api/hailin/home',
    mapPoints: '/api/hailin/map-points',
    foods: '/api/hailin/foods',
    spots: '/api/hailin/spots',
    routes: '/api/hailin/routes',
    products: '/api/hailin/products',
    lives: '/api/hailin/lives',
    aiGuide: '/api/hailin/ai-guide',
    booking: '/api/hailin/bookings',
    feedback: '/api/hailin/feedback',
    orders: '/api/hailin/orders'
  },

  v1Endpoints: {
    home: '/api/v1/home',
    mapPoints: '/api/v1/map-points?pageSize=100',
    foods: '/api/v1/foods?pageSize=100',
    spots: '/api/v1/scenic-spots?pageSize=100',
    routes: '/api/v1/travel-routes?pageSize=100',
    products: '/api/v1/products?pageSize=100',
    lives: '/api/v1/cameras'
  },

  live: {
    provider: 'backend',
    supportVideo: true,
    supportLivePlayer: true
  },

  ai: {
    provider: 'backend-proxy',
    fallbackEnabled: true
  }
};
