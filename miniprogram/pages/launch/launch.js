const { warmCriticalResources } = require("../../utils/preload");

const MIN_SHOW_TIME = 900;
const ENTER_DELAY = 180;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

Page({
  data: {
    progress: 12,
    progressText: "正在准备首页内容",
    steps: [
      { label: "首页", done: false },
      { label: "地图", done: false },
      { label: "农品", done: false },
    ],
  },

  onLoad() {
    this.entering = false;
    this.startedAt = Date.now();
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
          progressText: next > 52 ? "正在预热首屏图片" : "正在准备首页内容",
          steps: this.data.steps.map((item, index) => ({
            ...item,
            done: index === 0 || next > 48 + index * 16,
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
    Promise.all([
      warmCriticalResources({
        dataTimeout: 2600,
        imageLimit: 6,
        imageTimeout: 1200,
      }),
      delay(MIN_SHOW_TIME),
    ])
      .catch(() => [])
      .then(() => {
        this.enterHome();
      });
  },

  enterHome() {
    if (this.entering) return;
    this.entering = true;
    this.stopProgressTimer();
    this.setData({
      progress: 100,
      progressText: "准备完成",
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

  onSkip() {
    this.enterHome();
  },
});
