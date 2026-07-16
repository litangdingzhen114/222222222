const { featureMap } = require('../../data/mineFeatures');
const { submitFeedback, submitOrder } = require('../../services/content');
const { todayText } = require('../../utils/format');
const { quickToast } = require('../../utils/mock');
const {
  addCooperationLead,
  addOrder,
  checkIn,
  claimCoupon,
  completePointTask,
  decorateTasks,
  getClientId,
  loadUserCenter,
  recordVerification,
  updateOrder,
  useCoupon
} = require('../../utils/userCenter');

function orderTypeByFeature(featureId) {
  if (featureId === 'mall') return 'product';
  if (featureId === 'ticket') return 'ticket';
  if (featureId === 'stay') return 'stay';
  if (featureId === 'venue') return 'venue';
  return 'service';
}

Page({
  data: {
    id: '',
    feature: {},
    selectedIndex: 0,
    date: todayText(),
    people: 2,
    contact: '',
    remark: '',
    verifyCode: '',
    coupons: [],
    points: 0,
    tasks: [],
    checkinDone: false,
    orders: [],
    verifications: [],
    cooperationTypes: [],
    activeCooperationType: '',
    cooperationContent: '',
    cooperationLeads: [],
    submitting: false
  },

  onLoad(options) {
    const id = options.id || 'mall';
    const feature = featureMap[id];

    if (!feature) {
      quickToast('功能不存在');
      setTimeout(() => wx.navigateBack({ delta: 1 }), 500);
      return;
    }
    if (feature.type === 'publish') {
      wx.redirectTo({ url: '/pages/publish/publish' });
      return;
    }
    if (feature.type === 'list') {
      wx.redirectTo({ url: `/pages/user-list/user-list?type=${id}` });
      return;
    }

    const state = loadUserCenter();
    const targetItem = decodeURIComponent(options.item || '');
    const selectedIndex = targetItem
      ? Math.max(0, (feature.cards || []).findIndex((item) => item.title === targetItem || targetItem.includes(item.title)))
      : 0;
    this.setData({
      id,
      feature,
      selectedIndex,
      contact: state.profile.contact || '',
      people: feature.id === 'mall' ? 1 : 2,
      cooperationTypes: feature.types || [],
      activeCooperationType: feature.types ? feature.types[0] : ''
    });
    wx.setNavigationBarTitle({ title: feature.title });
    this.refreshState();
  },

  onShow() {
    if (this.data.id) {
      this.refreshState();
    }
  },

  refreshState() {
    const state = loadUserCenter();
    const id = this.data.id;
    const orders = state.orders.filter((item) => item.featureId === id);

    this.setData({
      coupons: state.coupons,
      points: state.points,
      tasks: decorateTasks(state),
      checkinDone: state.checkinDate === todayText(),
      orders,
      verifications: state.verifications.slice(0, 5),
      cooperationLeads: state.cooperationLeads.slice(0, 5),
      contact: this.data.contact || state.profile.contact || ''
    });
  },

  onCardTap(event) {
    this.setData({
      selectedIndex: Number(event.currentTarget.dataset.index)
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
    this.setData({ people: Math.min(200, this.data.people + 1) });
  },

  onSubmitService() {
    const contact = this.data.contact.trim();
    if (!contact) {
      quickToast('请填写联系方式');
      return;
    }

    const feature = this.data.feature;
    const card = feature.cards[this.data.selectedIndex] || feature.cards[0];
    const payload = {
      service: feature.service,
      featureId: feature.id,
      item: card.title,
      date: this.data.date,
      people: this.data.people,
      contact,
      remark: this.data.remark,
      price: card.price
    };
    const order = addOrder(feature.id, payload);

    this.setData({ submitting: true });
    this.refreshState();

    submitOrder({
      ...payload,
      clientId: getClientId(),
      orderType: orderTypeByFeature(feature.id),
      orderId: order.id,
      source: 'mine-page'
    })
      .then((remoteOrder) => {
        updateOrder(order.id, {
          id: remoteOrder.id || order.id,
          remoteId: remoteOrder.id || '',
          orderNo: remoteOrder.orderNo || '',
          remoteStatus: remoteOrder.status || 'new',
          status: '待确认'
        });
        quickToast('订单已提交至后台');
      })
      .catch(() => {
        quickToast('已本地记录，后端接通后同步');
      })
      .then(() => {
        this.setData({ submitting: false, remark: '' });
        this.refreshState();
      });
  },

  onOrderRecordTap(event) {
    wx.navigateTo({
      url: `/pages/order-detail/order-detail?id=${event.currentTarget.dataset.id}`
    });
  },

  onVerifyInput(event) {
    this.setData({ verifyCode: event.detail.value });
  },

  onVerifyCode() {
    const feature = this.data.feature;
    const code = this.data.verifyCode.trim().toUpperCase();
    const matched = (feature.codes || []).find((item) => item.code === code);

    if (!code) {
      quickToast('请输入核销码');
      return;
    }
    if (!matched) {
      quickToast('核销码无效');
      return;
    }

    recordVerification({
      code,
      service: matched.service
    });
    quickToast('核销成功');
    this.setData({ verifyCode: '' });
    this.refreshState();
  },

  onClaimCoupon(event) {
    const result = claimCoupon(event.currentTarget.dataset.id);
    quickToast(result.ok ? '优惠券已领取' : result.message);
    this.refreshState();
  },

  onUseCoupon(event) {
    const result = useCoupon(event.currentTarget.dataset.id);
    quickToast(result.ok ? '优惠券已使用' : result.message);
    this.refreshState();
  },

  onTaskTap(event) {
    const result = completePointTask(event.currentTarget.dataset.id);
    if (!result.ok) {
      quickToast(result.message);
      return;
    }
    quickToast(`已获得${result.task.points}积分`);
    this.refreshState();
  },

  onCheckIn() {
    const result = checkIn();
    quickToast(result.ok ? '签到成功，积分+5' : result.message);
    this.refreshState();
  },

  onCoopTypeTap(event) {
    this.setData({ activeCooperationType: event.currentTarget.dataset.type });
  },

  onCooperationInput(event) {
    this.setData({ cooperationContent: event.detail.value });
  },

  onSubmitCooperation() {
    const content = this.data.cooperationContent.trim();
    const contact = this.data.contact.trim();
    if (!content) {
      quickToast('请填写合作内容');
      return;
    }
    if (!contact) {
      quickToast('请填写联系方式');
      return;
    }

    const payload = {
      type: this.data.activeCooperationType,
      content,
      contact
    };
    addCooperationLead(payload);
    this.setData({ submitting: true });
    this.refreshState();

    submitFeedback({
      type: `招商合作-${payload.type}`,
      content: payload.content,
      contact: payload.contact,
      source: 'mine-page'
    })
      .then(() => {
        quickToast('合作意向已提交');
      })
      .catch(() => {
        quickToast('已本地记录，后端接通后同步');
      })
      .then(() => {
        this.setData({ submitting: false, cooperationContent: '' });
        this.refreshState();
      });
  }
});
