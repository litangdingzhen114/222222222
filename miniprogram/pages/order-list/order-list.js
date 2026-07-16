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

const settledStatuses = ['received', 'verified', 'completed', 'cancelled', 'expired'];
const shippingStatuses = ['pending_shipment', 'shipped', 'received'];
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
  return order.statusKey || localStatusMap[order.status] || order.remoteStatus || order.status || 'new';
}

function localOrders() {
  return loadUserCenter().orders.map((item) => decorateOrder({
    ...item,
    orderNo: item.orderNo || item.id,
    item: item.item || item.service,
    type: item.type || typeByFeatureId[item.featureId] || 'service'
  }));
}

function decorateOrder(order) {
  const statusKey = getStatusKey(order);
  const title = order.item || order.service || '海林村服务';
  const type = order.type || typeByFeatureId[order.featureId] || 'service';
  return {
    ...order,
    type,
    title,
    statusKey,
    statusText: statusLabels[statusKey] || order.status || '待确认',
    statusClass: statusClassMap[statusKey] || 'status-waiting',
    typeText: {
      product: '实物订单',
      ticket: '票券课程',
      service: '服务预约',
      stay: '民宿订单',
      venue: '场地预约'
    }[type] || '服务预约',
    peopleText: order.people ? `${order.people} 人/份` : '待确认',
    dateText: order.date || order.createdAt || '待确认',
    descText: order.remark || order.price || order.adminNote || '后台确认后会同步履约进度'
  };
}

function buildSummary(orders) {
  const activeOrders = orders.filter((item) => !settledStatuses.includes(item.statusKey));
  const shippingOrders = orders.filter((item) => shippingStatuses.includes(item.statusKey));
  return {
    total: orders.length,
    active: activeOrders.length,
    shipping: shippingOrders.length
  };
}

Page({
  data: {
    statusFilters,
    activeStatus: '',
    summary: {
      total: 0,
      active: 0,
      shipping: 0
    },
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
        this.setData({ orders, summary: buildSummary(orders), loading: false });
        this.applyFilter(this.data.activeStatus, orders);
      })
      .catch(() => {
        const orders = localOrders();
        this.setData({ orders, summary: buildSummary(orders), loading: false });
        this.applyFilter(this.data.activeStatus, orders);
      });
  },

  applyFilter(status, source = this.data.orders) {
    this.setData({
      activeStatus: status,
      filteredOrders: status ? source.filter((item) => item.statusKey === status) : source
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
  },

  onExploreTap() {
    wx.navigateTo({ url: '/pages/mine-feature/mine-feature?id=tour' });
  }
});
