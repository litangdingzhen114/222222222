const { cancelOrder, loadOrderDetail } = require('../../services/content');
const { getClientId, loadUserCenter } = require('../../utils/userCenter');
const { quickToast } = require('../../utils/mock');

const statusLabels = {
  new: '待确认',
  confirmed: '已确认',
  pending_shipment: '待发货',
  shipped: '已发货',
  received: '已收货',
  pending_service: '待出行',
  in_service: '服务中',
  pending_verify: '待核销',
  verified: '已核销',
  completed: '已完成',
  cancelled: '已取消',
  expired: '已过期'
};

const localStatusMap = {
  已提交: 'new',
  待确认: 'new',
  已确认: 'confirmed',
  待发货: 'pending_shipment',
  已发货: 'shipped',
  已收货: 'received',
  待出行: 'pending_service',
  服务中: 'in_service',
  待核销: 'pending_verify',
  已核销: 'verified',
  已完成: 'completed',
  已取消: 'cancelled',
  已过期: 'expired'
};

const statusClassMap = {
  new: 'status-waiting',
  confirmed: 'status-confirmed',
  pending_shipment: 'status-warning',
  shipped: 'status-shipped',
  received: 'status-done',
  pending_service: 'status-warning',
  in_service: 'status-shipped',
  pending_verify: 'status-warning',
  verified: 'status-done',
  completed: 'status-done',
  cancelled: 'status-muted',
  expired: 'status-muted'
};

const statusHints = {
  new: '订单已提交，后台会确认库存、场次或服务人员。',
  confirmed: '后台已确认订单，将继续安排履约资源。',
  pending_shipment: '商家正在备货，发货后会同步快递单号。',
  shipped: '商品已发出，可复制快递单号查看物流。',
  received: '商品已签收，感谢支持海林村共富集市。',
  pending_service: '请按约定时间到达集合点，工作人员会提前联系。',
  in_service: '服务正在进行中，后续状态会继续同步。',
  pending_verify: '到场后向工作人员出示核销码完成入场。',
  verified: '票券已核销，可在订单进度中查看核销记录。',
  completed: '订单已完成，欢迎再次预约海林村服务。',
  cancelled: '订单已取消，如需调整可重新预约。',
  expired: '订单已过期，如仍需服务请重新提交。'
};

const progressTemplates = {
  product: [
    { key: 'submit', title: '提交', statuses: ['new'] },
    { key: 'confirm', title: '确认', statuses: ['confirmed', 'pending_shipment'] },
    { key: 'ship', title: '发货', statuses: ['shipped'] },
    { key: 'finish', title: '完成', statuses: ['received', 'completed'] }
  ],
  ticket: [
    { key: 'submit', title: '提交', statuses: ['new'] },
    { key: 'confirm', title: '确认', statuses: ['confirmed'] },
    { key: 'verify', title: '核销', statuses: ['pending_verify', 'verified'] },
    { key: 'finish', title: '完成', statuses: ['completed'] }
  ],
  service: [
    { key: 'submit', title: '提交', statuses: ['new'] },
    { key: 'confirm', title: '确认', statuses: ['confirmed'] },
    { key: 'serve', title: '履约', statuses: ['pending_service', 'in_service'] },
    { key: 'finish', title: '完成', statuses: ['completed'] }
  ]
};

const typeByFeatureId = {
  mall: 'product',
  ticket: 'ticket',
  stay: 'stay',
  venue: 'venue',
  guide: 'service',
  tour: 'service',
  activity: 'service',
  build: 'service'
};

function getStatusKey(order) {
  if (statusLabels[order.remoteStatus]) return order.remoteStatus;
  if (statusLabels[order.status]) return order.status;
  if (localStatusMap[order.status]) return localStatusMap[order.status];
  if (statusLabels[order.statusKey]) return order.statusKey;
  return order.remoteStatus || order.statusKey || order.status || 'new';
}

function getTypeText(type) {
  return {
    product: '实物订单',
    ticket: '票券课程',
    service: '服务预约',
    stay: '民宿订单',
    venue: '场地预约'
  }[type] || '服务预约';
}

function getProgressSteps(order, statusKey) {
  const template = progressTemplates[order.type || typeByFeatureId[order.featureId]] || progressTemplates.service;
  const currentIndex = template.findIndex((step) => step.statuses.includes(statusKey));
  const safeIndex = currentIndex >= 0 ? currentIndex : 0;

  return template.map((step, index) => ({
    ...step,
    stateClass: index < safeIndex ? 'done' : index === safeIndex ? 'active' : 'pending'
  }));
}

function localOrder(id) {
  const item = loadUserCenter().orders.find((order) => order.id === id || order.remoteId === id || order.orderNo === id);
  return item ? {
    ...item,
    orderNo: item.id,
    statusText: item.status || '已提交',
    statusHistory: []
  } : null;
}

function decorate(order) {
  if (!order) return null;
  const statusKey = getStatusKey(order);
  const type = order.type || typeByFeatureId[order.featureId] || 'service';
  const logistics = order.logistics || {};
  const verification = order.verification || {};

  return {
    ...order,
    type,
    title: order.item || order.service || '海林村服务',
    statusKey,
    statusText: statusLabels[statusKey] || order.status || '待确认',
    statusClass: statusClassMap[statusKey] || 'status-waiting',
    statusHint: statusHints[statusKey] || '后台确认后会同步履约进度。',
    typeText: getTypeText(type),
    peopleText: order.people ? `${order.people} 人/份` : '待确认',
    dateText: order.date || order.createdAt || '待确认',
    logistics,
    verification,
    hasLogistics: type === 'product',
    canCopyTracking: Boolean(logistics.trackingNo),
    hasVerification: type === 'ticket' || Boolean(verification.code),
    progressSteps: getProgressSteps({ ...order, type }, statusKey),
    timeline: (order.statusHistory || []).map((item) => ({
      ...item,
      title: statusLabels[item.toStatus] || item.toStatus || '提交订单'
    })).reverse()
  };
}

Page({
  data: {
    id: '',
    order: null,
    canCancel: false,
    cancelling: false
  },

  onLoad(options) {
    this.setData({ id: options.id || '' });
    this.loadPage(options.id);
  },

  loadPage(id) {
    loadOrderDetail(id, getClientId())
      .then((order) => this.applyOrder(order))
      .catch(() => this.applyOrder(localOrder(id)));
  },

  applyOrder(order) {
    const decorated = decorate(order);
    if (!decorated) {
      quickToast('订单不存在');
      setTimeout(() => wx.navigateBack({ delta: 1 }), 500);
      return;
    }
    this.setData({
      order: decorated,
      canCancel: ['new', 'confirmed', 'pending_shipment', 'pending_service', 'pending_verify'].includes(decorated.statusKey)
    });
  },

  onBookAgain() {
    const order = this.data.order;
    if (!order) return;
    const featureId = order.featureId || {
      product: 'mall',
      ticket: 'ticket',
      stay: 'stay',
      venue: 'venue',
      service: 'tour'
    }[order.type] || 'tour';
    const item = encodeURIComponent(order.item || '');
    wx.navigateTo({ url: `/pages/mine-feature/mine-feature?id=${featureId}&item=${item}` });
  },

  onCancelOrder() {
    if (!this.data.order || !this.data.canCancel) return;
    wx.showModal({
      title: '取消订单',
      content: '取消后后台会同步看到该订单状态。',
      confirmText: '取消订单',
      confirmColor: '#C2412D',
      success: (result) => {
        if (!result.confirm) return;
        this.setData({ cancelling: true });
        cancelOrder(this.data.order.id, getClientId(), '游客主动取消')
          .then((order) => {
            quickToast('订单已取消');
            this.applyOrder(order);
          })
          .catch(() => quickToast('当前订单暂不能取消'))
          .then(() => this.setData({ cancelling: false }));
      }
    });
  },

  onCopyTracking() {
    const trackingNo = this.data.order && this.data.order.logistics && this.data.order.logistics.trackingNo;
    if (!trackingNo) {
      quickToast('暂无快递单号');
      return;
    }
    wx.setClipboardData({ data: trackingNo });
  }
});
