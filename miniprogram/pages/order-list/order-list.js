const { loadOrders } = require('../../services/content');
const { getClientId, loadUserCenter } = require('../../utils/userCenter');
const { quickToast } = require('../../utils/mock');

const statusFilters = [
  { value: '', label: '全部' },
  { value: 'new', label: '待确认' },
  { value: 'pending_shipment', label: '待发货' },
  { value: 'shipped', label: '已发货' },
  { value: 'pending_verify', label: '待核销' },
  { value: 'pending_service', label: '待出行' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' }
];

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

function localOrders() {
  return loadUserCenter().orders.map((item) => ({
    ...item,
    orderNo: item.id,
    statusText: item.status || '已提交',
    item: item.item || item.service,
    type: 'service'
  }));
}

function decorateOrder(order) {
  return {
    ...order,
    statusText: statusLabels[order.status] || order.status || '已提交',
    typeText: {
      product: '实物订单',
      ticket: '票券课程',
      service: '服务预约',
      stay: '民宿订单',
      venue: '场地预约'
    }[order.type] || '服务预约'
  };
}

Page({
  data: {
    statusFilters,
    activeStatus: '',
    orders: [],
    filteredOrders: [],
    loading: false
  },

  onShow() {
    this.loadPage();
  },

  loadPage() {
    this.setData({ loading: true });
    loadOrders(getClientId())
      .then((payload) => {
        const remoteOrders = Array.isArray(payload.items) ? payload.items.map(decorateOrder) : [];
        const orders = remoteOrders.length ? remoteOrders : localOrders();
        this.setData({ orders, loading: false });
        this.applyFilter(this.data.activeStatus, orders);
      })
      .catch(() => {
        const orders = localOrders();
        this.setData({ orders, loading: false });
        this.applyFilter(this.data.activeStatus, orders);
      });
  },

  applyFilter(status, source = this.data.orders) {
    this.setData({
      activeStatus: status,
      filteredOrders: status ? source.filter((item) => item.status === status) : source
    });
  },

  onFilterTap(event) {
    this.applyFilter(event.currentTarget.dataset.status || '');
  },

  onOrderTap(event) {
    const id = event.currentTarget.dataset.id;
    if (!id) {
      quickToast('订单信息不完整');
      return;
    }
    wx.navigateTo({ url: `/pages/order-detail/order-detail?id=${id}` });
  }
});
