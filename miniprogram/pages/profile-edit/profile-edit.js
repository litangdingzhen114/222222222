const { loadUserCenter, saveProfile } = require('../../utils/userCenter');
const { quickToast } = require('../../utils/mock');

Page({
  data: {
    nickname: '',
    avatarText: '',
    avatarUrl: '',
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
      avatarUrl: profile.avatarUrl,
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

    if (!nickname) {
      quickToast('请填写昵称');
      return;
    }

    saveProfile({
      nickname,
      avatarText: this.data.avatarText.trim(),
      avatarUrl: this.data.avatarUrl,
      contact: this.data.contact.trim(),
      intro: this.data.intro.trim()
    });
    quickToast('资料已保存');
    setTimeout(() => wx.navigateBack({ delta: 1 }), 500);
  }
});
