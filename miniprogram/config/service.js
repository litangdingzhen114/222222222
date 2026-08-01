module.exports = {
  villageName: "黄湖林场",
  locationText: "黄湖林场",
  regionKeywords: ["瓯江", "古树文化", "田鱼", "侨乡", "山水村落"],

  // 上线后端域名。真机和正式版必须使用 HTTPS，并配置到微信 request 合法域名。
  // 小程序端不保存 AI key、直播密钥或管理后台 token，统一由后端代理。
  apiBaseUrl: "https://api.hailin.store",
  // 微信开发者工具偶发会受本机代理/Fake-IP 影响导致 api 子域名握手中断；
  // www 域名只做 HTTPS 入口兜底，实际请求仍会转发到阿里云后端。
  devtoolsApiBaseUrl: "https://www.hailin.store",
  apiFallbackBaseUrls: ["https://www.hailin.store"],
  devApiBaseUrl: "http://127.0.0.1:8787",
  useDevApiInDevtools: false,
  requestTimeout: 3000,
  reviewMode: false,
  // 生产接口不可达、备案未生效或微信合法域名未通过时，先展示本地审核友好内容，
  // 后台连通后会自动用远端数据覆盖，避免首页出现空壳。
  contentFallbackEnabled: true,
  legacyApiFallbackEnabled: true,

  endpoints: {
    home: "/api/hailin/home",
    mapPoints: "/api/hailin/map-points",
    foods: "/api/hailin/foods",
    spots: "/api/hailin/spots",
    routes: "/api/hailin/routes",
    products: "/api/hailin/products",
    lives: "/api/hailin/lives",
    aiGuide: "/api/hailin/ai-guide",
    booking: "/api/hailin/bookings",
    feedback: "/api/hailin/feedback",
    orders: "/api/hailin/orders",
  },

  v1Endpoints: {
    home: "/api/v1/home",
    mapPoints: "/api/v1/map-points?pageSize=100",
    foods: "/api/v1/foods?pageSize=100",
    spots: "/api/v1/scenic-spots?pageSize=100",
    routes: "/api/v1/travel-routes?pageSize=100",
    productCategories: "/api/v1/product-categories?pageSize=100",
    products: "/api/v1/products?pageSize=100",
    lives: "/api/v1/cameras",
    aiGuide: "/api/v1/ai-guide/chat",
  },

  live: {
    provider: "backend",
    supportVideo: true,
    supportLivePlayer: true,
  },

  ai: {
    provider: "backend-proxy",
    fallbackEnabled: true,
    legacyFallbackEnabled: false,
    requestTimeout: 20000,
  },
};
