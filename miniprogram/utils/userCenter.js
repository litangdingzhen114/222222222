const baseUser = require('../data/user');
const {
  coupons,
  defaultLists,
  defaultProfile,
  pointTasks
} = require('../data/mineFeatures');

const STORAGE_KEY = 'hailin_user_center';
const memoryStore = {};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function wxReady() {
  return typeof wx !== 'undefined' && wx && wx.getStorageSync && wx.setStorageSync;
}

function readStorage() {
  if (wxReady()) {
    try {
      return wx.getStorageSync(STORAGE_KEY);
    } catch (error) {
      return null;
    }
  }
  return memoryStore[STORAGE_KEY] || null;
}

function writeStorage(value) {
  if (wxReady()) {
    wx.setStorageSync(STORAGE_KEY, value);
    return;
  }
  memoryStore[STORAGE_KEY] = value;
}

function removeStorage() {
  if (wxReady() && wx.removeStorageSync) {
    wx.removeStorageSync(STORAGE_KEY);
    return;
  }
  delete memoryStore[STORAGE_KEY];
}

function pad(value) {
  return String(value).padStart(2, '0');
}

function formatDate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatDateTime(date) {
  return `${formatDate(date)} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function createDefaultState() {
  return {
    profile: clone(defaultProfile),
    notes: clone(defaultLists.notes),
    favorites: clone(defaultLists.favorites),
    likes: clone(defaultLists.likes),
    coupons: clone(coupons),
    points: 128,
    completedTasks: {},
    checkinDate: '',
    checkinHistory: [],
    orders: [],
    verifications: [],
    cooperationLeads: []
  };
}

function normalizeState(rawState) {
  const defaults = createDefaultState();
  const raw = rawState && typeof rawState === 'object' ? rawState : {};

  return {
    ...defaults,
    ...raw,
    profile: {
      ...defaults.profile,
      ...(raw.profile || {})
    },
    notes: Array.isArray(raw.notes) ? raw.notes : defaults.notes,
    favorites: Array.isArray(raw.favorites) ? raw.favorites : defaults.favorites,
    likes: Array.isArray(raw.likes) ? raw.likes : defaults.likes,
    coupons: Array.isArray(raw.coupons) ? raw.coupons : defaults.coupons,
    completedTasks: raw.completedTasks || defaults.completedTasks,
    checkinHistory: Array.isArray(raw.checkinHistory) ? raw.checkinHistory : defaults.checkinHistory,
    orders: Array.isArray(raw.orders) ? raw.orders : defaults.orders,
    verifications: Array.isArray(raw.verifications) ? raw.verifications : defaults.verifications,
    cooperationLeads: Array.isArray(raw.cooperationLeads) ? raw.cooperationLeads : defaults.cooperationLeads
  };
}

function loadUserCenter() {
  return normalizeState(readStorage());
}

function saveUserCenter(state) {
  const normalized = normalizeState(state);
  writeStorage(normalized);
  return normalized;
}

function resetUserCenter() {
  removeStorage();
  const state = createDefaultState();
  writeStorage(state);
  return state;
}

function getStats(state = loadUserCenter()) {
  return {
    notes: state.notes.length,
    favorites: state.favorites.length,
    likes: state.likes.length
  };
}

function getMergedUser(user = baseUser) {
  const state = loadUserCenter();
  const stats = getStats(state);

  return {
    ...user,
    nickname: state.profile.nickname,
    avatarText: state.profile.avatarText,
    contact: state.profile.contact,
    intro: state.profile.intro,
    stats: user.stats.map((item) => ({
      ...item,
      value: stats[item.id] || 0
    }))
  };
}

function saveProfile(profile) {
  const state = loadUserCenter();
  state.profile = {
    ...state.profile,
    ...profile,
    nickname: String(profile.nickname || state.profile.nickname).trim() || defaultProfile.nickname,
    avatarText: String(profile.avatarText || state.profile.avatarText).trim().slice(0, 2) || defaultProfile.avatarText
  };
  if (!state.completedTasks.profile) {
    state.completedTasks.profile = true;
    state.points += 10;
  }
  return saveUserCenter(state);
}

function publishNote(payload) {
  const state = loadUserCenter();
  const content = String(payload.content || '').trim();
  const createdAt = formatDateTime(new Date());
  const note = {
    id: `note-${Date.now()}`,
    title: String(payload.title || '').trim(),
    topic: payload.topic || '海林村游记',
    summary: content.length > 64 ? `${content.slice(0, 64)}...` : content,
    content,
    imagePath: payload.imagePath || '',
    createdAt
  };

  state.notes.unshift(note);
  state.points += 8;
  state.completedTasks.publish = true;
  saveUserCenter(state);
  return note;
}

function addOrder(featureId, payload) {
  const state = loadUserCenter();
  const order = {
    id: `order-${Date.now()}`,
    featureId,
    status: '已提交',
    createdAt: formatDateTime(new Date()),
    ...payload
  };

  state.orders.unshift(order);
  state.points += 12;
  state.completedTasks.booking = true;
  saveUserCenter(state);
  return order;
}

function claimCoupon(couponId) {
  const state = loadUserCenter();
  const coupon = state.coupons.find((item) => item.id === couponId);
  if (!coupon) return { ok: false, message: '优惠券不存在' };
  if (coupon.status !== '可领取') return { ok: false, message: '这张券已处理过' };

  coupon.status = '已领取';
  saveUserCenter(state);
  return { ok: true, coupon };
}

function useCoupon(couponId) {
  const state = loadUserCenter();
  const coupon = state.coupons.find((item) => item.id === couponId);
  if (!coupon) return { ok: false, message: '优惠券不存在' };
  if (coupon.status === '已使用') return { ok: false, message: '这张券已使用' };

  coupon.status = '已使用';
  saveUserCenter(state);
  return { ok: true, coupon };
}

function completePointTask(taskId) {
  const state = loadUserCenter();
  const task = pointTasks.find((item) => item.id === taskId);
  if (!task) return { ok: false, message: '任务不存在' };
  if (state.completedTasks[taskId]) {
    return { ok: false, message: '任务已完成', points: state.points };
  }

  state.completedTasks[taskId] = true;
  state.points += task.points;
  saveUserCenter(state);
  return { ok: true, task, points: state.points };
}

function checkIn(dateText = formatDate(new Date())) {
  const state = loadUserCenter();
  if (state.checkinDate === dateText) {
    return { ok: false, message: '今天已经签到', points: state.points };
  }

  state.checkinDate = dateText;
  state.points += 5;
  state.checkinHistory.unshift({
    id: `checkin-${Date.now()}`,
    date: dateText,
    points: 5
  });
  saveUserCenter(state);
  return { ok: true, points: state.points };
}

function recordVerification(payload) {
  const state = loadUserCenter();
  const verification = {
    id: `verify-${Date.now()}`,
    status: '核销成功',
    createdAt: formatDateTime(new Date()),
    ...payload
  };

  state.verifications.unshift(verification);
  saveUserCenter(state);
  return verification;
}

function addCooperationLead(payload) {
  const state = loadUserCenter();
  const lead = {
    id: `lead-${Date.now()}`,
    status: '已提交',
    createdAt: formatDateTime(new Date()),
    ...payload
  };

  state.cooperationLeads.unshift(lead);
  saveUserCenter(state);
  return lead;
}

function decorateTasks(state = loadUserCenter()) {
  return pointTasks.map((task) => ({
    ...task,
    done: Boolean(state.completedTasks[task.id])
  }));
}

module.exports = {
  addCooperationLead,
  addOrder,
  checkIn,
  claimCoupon,
  completePointTask,
  decorateTasks,
  formatDate,
  getMergedUser,
  getStats,
  loadUserCenter,
  publishNote,
  recordVerification,
  resetUserCenter,
  saveProfile,
  saveUserCenter,
  useCoupon
};
