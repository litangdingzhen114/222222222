const { submitFeedback } = require('../../services/content');
const { quickToast } = require('../../utils/mock');

Page({
  data: {
    types: ['功能建议', '内容纠错', '服务投诉', '合作咨询'],
    activeType: '功能建议',
    content: '',
    contact: ''
  },

  onTypeTap(event) {
    this.setData({ activeType: event.currentTarget.dataset.type });
  },

  onContentInput(event) {
    this.setData({ content: event.detail.value });
  },

  onContactInput(event) {
    this.setData({ contact: event.detail.value });
  },

  onSubmit() {
    if (!this.data.content.trim()) {
      quickToast('请填写反馈内容');
      return;
    }
    submitFeedback({
      type: this.data.activeType,
      content: this.data.content,
      contact: this.data.contact
    })
      .then(() => {
        quickToast('反馈已提交至后台');
      })
      .catch(() => {
        quickToast('反馈已记录，后台未配置时本地兜底');
      });
  }
});
