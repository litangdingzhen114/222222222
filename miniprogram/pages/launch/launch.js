const {
  getHomePreloadCache,
  warmCriticalResources,
} = require("../../utils/preload");

const MIN_SHOW_TIME = 900;
const ENTER_DELAY = 180;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

Page({
  data: {
    brandKicker: "文旅导览",
    brandTitle: "一部手机游",
    brandSubtitle: "溪谷、田园、村咖和古树，等你慢慢遇见",
    progress: 12,
    progressText: "欢迎来到海林村",
    progressSubText: "从村口出发，把一天交给山风和溪水",
    steps: [
      { label: "首页", done: false },
      { label: "地图", done: false },
      { label: "农品", done: false },
      { label: "直播", done: false },
      { label: "服务", done: false },
    ],
  },

  onLoad() {
    this.entering = false;
    this.startedAt = Date.now();
    this.applyPreloadedBrand();
    this.startProgressTimer();
    this.bootstrap();
  },

  onUnload() {
    this.stopProgressTimer();
  },

  startProgressTimer() {
    this.stopProgressTimer();
    this.progressTimer = setInterval(() => {
      const next = Math.min(88, this.data.progress + 5);
      if (next !== this.data.progress) {
        this.setData({
          progress: next,
          progressText:
            next > 72
              ? "欢迎来到海林村"
              : next > 52
                ? "山风已经吹到村口"
                : next > 34
                  ? "把脚步放慢一点"
                  : "欢迎来到海林村",
          progressSubText:
            next > 72
              ? "沿着村道慢慢走，故事就在前面"
              : next > 52
                ? "溪水、竹影和田鱼，都会在路上相遇"
                : next > 34
                  ? "先看山水，再逛村咖和田园"
                  : "从村口出发，把一天交给山风和溪水",
          steps: this.data.steps.map((item, index) => ({
            ...item,
            done: index === 0 || next > 30 + index * 12,
          })),
        });
      }
    }, 180);
  },

  stopProgressTimer() {
    if (this.progressTimer) {
      clearInterval(this.progressTimer);
      this.progressTimer = null;
    }
  },

  bootstrap() {
    const preload = warmCriticalResources({
      dataTimeout: 2600,
      imageLimit: 32,
      imageTimeout: 900,
      imageConcurrency: 3,
      assetBudget: 2200,
    }).then((meta) => {
      this.applyPreloadedBrand();
      return meta;
    });

    Promise.all([preload, delay(MIN_SHOW_TIME)])
      .catch(() => [])
      .then(() => {
        this.enterHome();
      });
  },

  applyPreloadedBrand() {
    const cachedHome = getHomePreloadCache();
    const locationText = String(
      (cachedHome && cachedHome.locationText) ||
        (cachedHome &&
          cachedHome.banners &&
          cachedHome.banners[0] &&
          cachedHome.banners[0].kicker) ||
        "",
    ).trim();
    if (!locationText) return;
    this.setData({
      brandKicker: locationText,
      brandTitle: `一部手机游${locationText}`,
    });
  },

  enterHome() {
    if (this.entering) return;
    this.entering = true;
    this.stopProgressTimer();
    this.setData({
      progress: 100,
      progressText: "欢迎出发",
      progressSubText: "现在进入海林村，慢慢看见山水与人间",
      steps: this.data.steps.map((item) => ({
        ...item,
        done: true,
      })),
    });

    setTimeout(() => {
      wx.switchTab({
        url: "/pages/home/home",
        fail: () => {
          wx.reLaunch({ url: "/pages/home/home" });
        },
      });
    }, ENTER_DELAY);
  },
});
