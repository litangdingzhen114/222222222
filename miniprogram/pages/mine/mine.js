const user = require('../../data/user');
const { quickToast } = require('../../utils/mock');
const { getMergedUser, resetUserCenter } = require('../../utils/userCenter');

Page({
  data: {
    user
  },

  onShow() {
    this.refreshUser();
  },

  refreshUser() {
    this.setData({
      user: getMergedUser(user)
    });
  },

  onEditProfile() {
    wx.navigateTo({ url: '/pages/profile-edit/profile-edit' });
  },

  onStatTap(event) {
    wx.navigateTo({
      url: `/pages/user-list/user-list?type=${event.currentTarget.dataset.id}`
    });
  },

  onOrderTap(event) {
    wx.navigateTo({
      url: `/pages/mine-feature/mine-feature?id=${event.currentTarget.dataset.id}`
    });
  },

  onOrderCenterTap() {
    wx.navigateTo({ url: '/pages/order-list/order-list' });
  },

  onRightTap(event) {
    wx.navigateTo({
      url: `/pages/mine-feature/mine-feature?id=${event.currentTarget.dataset.id}`
    });
  },

  onFeedbackTap() {
    wx.navigateTo({ url: '/pages/feedback/feedback' });
  },

  onCooperationTap() {
    wx.navigateTo({ url: '/pages/mine-feature/mine-feature?id=cooperation' });
  },

  onLogout() {
    wx.showModal({
      title: '退出登录',
      content: '会清除本机资料、游记、订单和权益记录，并恢复游客身份。',
      confirmText: '退出',
      confirmColor: '#0F6B67',
      success: (result) => {
        if (!result.confirm) return;
        resetUserCenter();
        this.refreshUser();
        quickToast('已恢复游客身份');
      }
    });
  },

  onPublish() {
    wx.navigateTo({ url: '/pages/publish/publish' });
  }
});
