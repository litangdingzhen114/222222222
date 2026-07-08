App({
  globalData: {
    appName: '一部手机游海林村',
    villageName: '海林村'
  },

  onLaunch() {
    wx.setStorageSync('hailin_app_ready', true);
  }
});
