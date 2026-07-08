const { todayText } = require('../../utils/format');
const { submitBooking } = require('../../services/content');
const { quickToast } = require('../../utils/mock');

const serviceOptions = [
  {
    id: 'guide',
    title: '村游讲解',
    service: '海林村讲解服务',
    desc: '村情馆、稻鱼田、溪谷步道、青田石纹手作点讲解。',
    tag: '60-90 分钟'
  },
  {
    id: 'activity',
    title: '研学课程',
    service: '海林村研学课程',
    desc: '稻鱼共生、青田石纹、侨乡故事和自然观察课程。',
    tag: '亲子/学校'
  },
  {
    id: 'tour',
    title: '村游套餐',
    service: '海林村村游套餐',
    desc: '集合、讲解、餐食、手作和返程建议一并安排。',
    tag: '半日/一日'
  },
  {
    id: 'venue',
    title: '场地活动',
    service: '海林村场地预约',
    desc: '会客点、研学教室、溪谷草坪和共富集市场地。',
    tag: '团队可用'
  }
];

const quickPlans = [
  { id: 'family', title: '亲子家庭', desc: '2 大 1 小，稻鱼田讲解 + 手作体验。', people: 3 },
  { id: 'team', title: '团队团建', desc: '20 人左右，村情馆讲解 + 田鱼家宴 + 手作。', people: 20 },
  { id: 'school', title: '研学班级', desc: '30 人以上，课程任务卡 + 老师带队 + 安全提示。', people: 30 }
];

Page({
  data: {
    serviceOptions,
    selectedServiceId: serviceOptions[0].id,
    selectedService: serviceOptions[0],
    quickPlans,
    bookingTips: ['提交后后台会生成预约记录', '真实上线可接短信/微信通知', '团队需求建议提前 1 天确认'],
    date: todayText(),
    people: 2,
    contact: '',
    remark: ''
  },

  onServiceTap(event) {
    const selectedService = serviceOptions.find((item) => item.id === event.currentTarget.dataset.id) || serviceOptions[0];
    this.setData({
      selectedServiceId: selectedService.id,
      selectedService
    });
  },

  onQuickPlanTap(event) {
    const plan = quickPlans.find((item) => item.id === event.currentTarget.dataset.id);
    if (!plan) return;
    this.setData({
      people: plan.people,
      remark: plan.desc
    });
  },

  onDateChange(event) {
    this.setData({ date: event.detail.value });
  },

  onContactInput(event) {
    this.setData({ contact: event.detail.value });
  },

  onRemarkInput(event) {
    this.setData({ remark: event.detail.value });
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
      service: this.data.selectedService.service,
      item: this.data.selectedService.title,
      date: this.data.date,
      people: this.data.people,
      contact: this.data.contact,
      remark: this.data.remark,
      source: 'booking-page'
    })
      .then(() => {
        quickToast('预约已提交至后台');
      })
      .catch(() => {
        quickToast('已记录预约，后台未配置时本地兜底');
      });
  }
});
