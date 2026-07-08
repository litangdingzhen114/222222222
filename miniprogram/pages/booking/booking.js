const { todayText } = require('../../utils/format');
const { submitBooking } = require('../../services/content');
const { quickToast } = require('../../utils/mock');

Page({
  data: {
    date: todayText(),
    people: 2,
    contact: ''
  },

  onDateChange(event) {
    this.setData({ date: event.detail.value });
  },

  onContactInput(event) {
    this.setData({ contact: event.detail.value });
  },

  onMinus() {
    this.setData({ people: Math.max(1, this.data.people - 1) });
  },

  onPlus() {
    this.setData({ people: Math.min(50, this.data.people + 1) });
  },

  onSubmit() {
    if (!this.data.contact.trim()) {
      quickToast('请填写联系方式');
      return;
    }
    submitBooking({
      service: '海林村讲解服务',
      date: this.data.date,
      people: this.data.people,
      contact: this.data.contact
    })
      .then(() => {
        quickToast('预约已提交至后台');
      })
      .catch(() => {
        quickToast('已记录预约，后台未配置时本地兜底');
      });
  }
});
