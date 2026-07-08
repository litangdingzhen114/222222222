const { loadUserCenter, saveProfile } = require('../../utils/userCenter');
const { quickToast } = require('../../utils/mock');

Page({
  data: {
    nickname: '',
    avatarText: '',
    contact: '',
    intro: ''
  },

  onLoad() {
    this.loadProfile();
  },

  onShow() {
    this.loadProfile();
  },

  loadProfile() {
    const { profile } = loadUserCenter();
    this.setData({
      nickname: profile.nickname,
      avatarText: profile.avatarText,
      contact: profile.contact,
      intro: profile.intro
    });
  },

  onInput(event) {
    const field = event.currentTarget.dataset.field;
    this.setData({ [field]: event.detail.value });
  },

  onSave() {
    const nickname = this.data.nickname.trim();
    const avatarText = this.data.avatarText.trim();

    if (!nickname) {
      quickToast('请填写昵称');
      return;
    }
    if (!avatarText) {
      quickToast('请填写头像文字');
      return;
    }

    saveProfile({
      nickname,
      avatarText,
      contact: this.data.contact.trim(),
      intro: this.data.intro.trim()
    });
    quickToast('资料已保存');
    setTimeout(() => wx.navigateBack({ delta: 1 }), 500);
  }
});
