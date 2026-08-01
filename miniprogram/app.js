const { getClientId, migrateUserCenter } = require('./utils/userCenter');
const { ensureSession } = require('./services/session');

App({
  globalData: {
    appName: '一部手机游黄湖林场',
    villageName: '黄湖林场'
  },

  onLaunch() {
    wx.setStorageSync('hailin_app_ready', true);
    migrateUserCenter();
    getClientId();
    ensureSession().catch((error) => {
      console.warn('hailin session init failed', error);
    });
  }
});
