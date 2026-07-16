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

function localOrder(id) {
  const item = loadUserCenter().orders.find((order) => order.id === id);
  return item ? {
    ...item,
    orderNo: item.id,
    statusText: item.status || '已提交',
    statusHistory: []
  } : null;
}

function decorate(order) {
  if (!order) return null;
  return {
    ...order,
    statusText: statusLabels[order.status] || order.status || '已提交',
    typeText: {
      product: '实物订单',
      ticket: '票券课程',
      service: '服务预约',
      stay: '民宿订单',
      venue: '场地预约'
    }[order.type] || '服务预约',
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
      canCancel: ['new', 'confirmed', 'pending_shipment', 'pending_service', 'pending_verify'].includes(decorated.status)
    });
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
