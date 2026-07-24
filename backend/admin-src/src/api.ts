import type {
  AdminDashboard,
  AdminProfile,
  AdminSummary,
  ApiPage,
  AuditRecord,
  BookingRecord,
  ConfigStatus,
  FeedbackRecord,
  HomeContent,
  HomeContentEnvelope,
  ListResponse,
  LiveContentEnvelope,
  LiveItem,
  LoginResponse,
  OrderRecord,
  ResourceContentEnvelope,
  ResourceContentSummary,
  ResourceKey,
  TokenBundle
} from './types';

export const ACCESS_TOKEN_KEY = 'hailin-admin-access-token';
export const REFRESH_TOKEN_KEY = 'hailin-admin-refresh-token';
export const ADMIN_PROFILE_KEY = 'hailin-admin-profile';
export const TOKEN_KEY = ACCESS_TOKEN_KEY;

type QueryParams = Record<string, string | number | boolean | undefined | null>;

type ApiEnvelope<T> = {
  code?: number;
  message?: string;
  data?: T;
  requestId?: string;
  timestamp?: number;
};

type RawUser = {
  id?: string;
  nickname?: string;
  phone?: string;
  avatarUrl?: string;
};

type RawOrderItem = {
  productName?: string;
  productImage?: string;
  specification?: string | null;
  unitPrice?: number;
  quantity?: number;
  totalAmount?: number;
};

type RawOrder = {
  id: string;
  orderNo?: string;
  userId?: string;
  user?: RawUser | null;
  addressSnapshot?: unknown;
  payableAmount?: number;
  paidAmount?: number;
  status?: string;
  paymentStatus?: string;
  shippingStatus?: string;
  remark?: string | null;
  logisticsCompany?: string | null;
  logisticsNo?: string | null;
  paidAt?: string | null;
  shippedAt?: string | null;
  completedAt?: string | null;
  cancelledAt?: string | null;
  closedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  items?: RawOrderItem[];
};

type RawReservationOrder = {
  id: string;
  orderNo?: string;
  userId?: string;
  user?: RawUser | null;
  item?: {
    id?: string;
    title?: string;
    type?: string;
    unit?: string;
  } | null;
  slot?: {
    id?: string;
    date?: string;
    startTime?: string;
    endTime?: string;
  } | null;
  contactName?: string;
  contactPhone?: string;
  quantity?: number;
  amount?: number;
  status?: string;
  remark?: string | null;
  paidAt?: string | null;
  cancelledAt?: string | null;
  verifiedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

type RawFeedback = {
  id: string;
  user?: RawUser | null;
  type?: string;
  content?: string;
  images?: string[];
  contact?: string | null;
  status?: string;
  adminReply?: string | null;
  repliedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

class ApiError extends Error {
  status: number;
  code?: number;

  constructor(status: number, message: string, code?: number) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

let refreshPromise: Promise<TokenBundle> | null = null;

function rawBaseUrl() {
  return String(import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/+$/, '');
}

export function apiBaseUrl() {
  return rawBaseUrl();
}

function accessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY) || '';
}

function refreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY) || '';
}

export function saveTokens(tokens: TokenBundle) {
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(ADMIN_PROFILE_KEY);
}

export function saveAdminProfile(admin: AdminProfile) {
  localStorage.setItem(ADMIN_PROFILE_KEY, JSON.stringify(admin));
}

export function storedAdminProfile(): AdminProfile | null {
  const text = localStorage.getItem(ADMIN_PROFILE_KEY);
  if (!text) return null;
  try {
    return JSON.parse(text) as AdminProfile;
  } catch {
    return null;
  }
}

export function queryString(params: QueryParams = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') search.set(key, String(value));
  });
  const text = search.toString();
  return text ? `?${text}` : '';
}

function buildUrl(path: string) {
  if (/^https?:\/\//.test(path)) return path;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (cleanPath.startsWith('/api/')) return cleanPath;
  return `${apiBaseUrl()}${cleanPath}`;
}

async function parsePayload<T>(response: Response): Promise<ApiEnvelope<T> | T | null> {
  const isJson = (response.headers.get('content-type') || '').includes('application/json');
  if (!isJson) return null;
  return (await response.json()) as ApiEnvelope<T> | T;
}

function unwrap<T>(payload: ApiEnvelope<T> | T | null): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as ApiEnvelope<T>).data as T;
  }
  return payload as T;
}

function errorMessage(payload: unknown, status: number) {
  if (payload && typeof payload === 'object') {
    if ('message' in payload && typeof payload.message === 'string') return payload.message;
    if ('error' in payload && payload.error && typeof payload.error === 'object') {
      const error = payload.error as { message?: unknown };
      if (typeof error.message === 'string') return error.message;
    }
  }
  return `请求失败 ${status}`;
}

async function refreshTokens() {
  if (refreshPromise) return refreshPromise;
  const token = refreshToken();
  if (!token) throw new ApiError(401, '登录已失效');

  refreshPromise = fetch(buildUrl('/auth/refresh'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: token })
  })
    .then(async (response) => {
      const payload = await parsePayload<TokenBundle>(response);
      if (!response.ok) throw new ApiError(response.status, errorMessage(payload, response.status));
      const tokens = unwrap<TokenBundle>(payload);
      saveTokens(tokens);
      return tokens;
    })
    .finally(() => {
      refreshPromise = null;
    });
  return refreshPromise;
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  options: { retryOnUnauthorized?: boolean } = {}
): Promise<T> {
  const retryOnUnauthorized = options.retryOnUnauthorized !== false;
  const headers = new Headers(init.headers);
  const hasBody = init.body !== undefined;
  if (hasBody && !headers.has('Content-Type') && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  const token = accessToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(buildUrl(path), {
    ...init,
    headers,
    signal: init.signal ?? AbortSignal.timeout(15000)
  });
  const payload = await parsePayload<T>(response);

  if (response.status === 401 && retryOnUnauthorized && refreshToken()) {
    try {
      await refreshTokens();
      return apiRequest<T>(path, init, { retryOnUnauthorized: false });
    } catch {
      clearTokens();
      window.dispatchEvent(new CustomEvent('hailin-admin-unauthorized'));
      throw new ApiError(401, '登录已失效，请重新登录');
    }
  }

  if (!response.ok) {
    if (response.status === 401) {
      clearTokens();
      window.dispatchEvent(new CustomEvent('hailin-admin-unauthorized'));
    }
    const code =
      payload && typeof payload === 'object' && 'code' in payload
        ? Number((payload as ApiEnvelope<T>).code)
        : undefined;
    throw new ApiError(response.status, errorMessage(payload, response.status), code);
  }

  return unwrap<T>(payload);
}

function toLegacyList<T, U = T>(
  page: ApiPage<T>,
  mapper?: (item: T) => U,
  stats?: Record<string, number>
): ListResponse<U> {
  return {
    items: mapper ? page.list.map(mapper) : (page.list as unknown as U[]),
    page: page.page,
    pageSize: page.pageSize,
    total: page.total,
    stats
  };
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function firstText(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return '';
}

function centsText(value?: number) {
  return `¥${((value || 0) / 100).toFixed(2)}`;
}

function dateText(value?: string | null) {
  if (!value) return '';
  return value.slice(0, 10);
}

function bookingDateText(slot?: RawReservationOrder['slot']) {
  if (!slot) return '';
  const date = dateText(slot.date);
  const time = [slot.startTime, slot.endTime].filter(Boolean).join('-');
  return [date, time].filter(Boolean).join(' ');
}

function statusStats<T extends { status?: string }>(items: T[]) {
  return items.reduce<Record<string, number>>((stats, item) => {
    const key = item.status || 'UNKNOWN';
    stats[key] = (stats[key] || 0) + 1;
    return stats;
  }, {});
}

function mapOrder(record: RawOrder): OrderRecord {
  const snapshot = asObject(record.addressSnapshot);
  const items = record.items || [];
  const itemName = items.map((item) => item.productName).filter(Boolean).join('、');
  const quantity = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const contactName = firstText(snapshot.contactName, snapshot.name);
  const contactPhone = firstText(snapshot.phone, record.user?.phone);
  return {
    id: record.id,
    orderNo: record.orderNo,
    clientId: record.userId,
    type: 'product',
    featureId: items[0]?.productName,
    service: '农特产商城',
    item: itemName || record.orderNo || record.id,
    date: dateText(record.createdAt),
    people: quantity || undefined,
    contact: [contactName, contactPhone].filter(Boolean).join(' '),
    remark: record.remark || '',
    price: centsText(record.payableAmount),
    source: 'api-v1',
    status: record.status,
    paymentStatus: record.paymentStatus,
    logistics: {
      carrier: record.logisticsCompany || '',
      trackingNo: record.logisticsNo || '',
      shippedAt: record.shippedAt || ''
    },
    lastHandledAt: record.updatedAt,
    completedAt: record.completedAt || undefined,
    cancelledAt: record.cancelledAt || record.closedAt || undefined,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt
  };
}

function mapReservationOrder(record: RawReservationOrder): BookingRecord {
  return {
    id: record.id,
    service: record.item?.title || record.orderNo || '预约项目',
    date: bookingDateText(record.slot),
    people: record.quantity,
    contact: [record.contactName, record.contactPhone].filter(Boolean).join(' '),
    remark: record.remark || '',
    source: 'api-v1',
    status: record.status,
    adminNote: record.amount ? `金额 ${centsText(record.amount)}` : '',
    lastHandledAt: record.updatedAt,
    completedAt: record.verifiedAt || undefined,
    cancelledAt: record.cancelledAt || undefined,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt
  };
}

function mapFeedback(record: RawFeedback): FeedbackRecord {
  return {
    id: record.id,
    nickname: record.user?.nickname || '游客',
    contact: firstText(record.contact, record.user?.phone),
    content: record.content || '',
    source: record.type || 'api-v1',
    status: record.status,
    adminNote: record.adminReply || '',
    lastHandledAt: record.repliedAt || record.updatedAt,
    resolvedAt: record.repliedAt || undefined,
    archivedAt: record.status === 'CLOSED' ? record.updatedAt : undefined,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt
  };
}

function csvValue(value: unknown) {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function csvBlob(headers: string[], rows: Array<Record<string, unknown>>) {
  const lines = [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => csvValue(row[header])).join(','))
  ];
  return new Blob([`\ufeff${lines.join('\n')}`], { type: 'text/csv;charset=utf-8' });
}

export async function loginAdmin(payload: { username: string; password: string }) {
  const result = await apiRequest<LoginResponse>('/admin/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  saveTokens(result);
  saveAdminProfile(result.admin);
  return result;
}

export function refreshAdminToken() {
  return refreshTokens();
}

export function getSession() {
  return apiRequest<{ admin: AdminProfile }>('/admin/me');
}

export function getAdminMe() {
  return apiRequest<{ admin: AdminProfile }>('/admin/me');
}

export function getSummary() {
  return apiRequest<AdminSummary>('/admin/overview');
}

export function getDashboard() {
  return apiRequest<AdminDashboard>('/admin/dashboard');
}

export function getConfigStatus() {
  return apiRequest<ConfigStatus>('/admin/config-status');
}

export function listAdminResource<T>(resource: string, params: QueryParams = {}) {
  return apiRequest<ApiPage<T>>(`/admin/${resource}${queryString(params)}`);
}

export function getAdminResource<T>(resource: string, id: string) {
  return apiRequest<T>(`/admin/${resource}/${encodeURIComponent(id)}`);
}

export function createAdminResource<T>(resource: string, data: Record<string, unknown>) {
  return apiRequest<T>(`/admin/${resource}`, {
    method: 'POST',
    body: JSON.stringify({ data })
  });
}

export function updateAdminResource<T>(resource: string, id: string, data: Record<string, unknown>) {
  return apiRequest<T>(`/admin/${resource}/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify({ data })
  });
}

export function deleteAdminResource(resource: string, id: string) {
  return apiRequest<{ ok: boolean }>(`/admin/${resource}/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  });
}

export function publishAdminResource<T>(resource: string, id: string) {
  return apiRequest<T>(`/admin/${resource}/${encodeURIComponent(id)}/publish`, { method: 'POST' });
}

export function offlineAdminResource<T>(resource: string, id: string) {
  return apiRequest<T>(`/admin/${resource}/${encodeURIComponent(id)}/offline`, { method: 'POST' });
}

export function shipOrder(
  id: string,
  payload: {
    logisticsCompany: string;
    logisticsNo: string;
  }
) {
  return apiRequest<OrderRecord>(`/admin/orders/${encodeURIComponent(id)}/ship`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function markOrderRefunding(id: string) {
  return apiRequest<OrderRecord>(`/admin/orders/${encodeURIComponent(id)}/refunding`, {
    method: 'POST'
  });
}

export function markOrderRefunded(id: string) {
  return apiRequest<OrderRecord>(`/admin/orders/${encodeURIComponent(id)}/refunded`, {
    method: 'POST'
  });
}

export function replyFeedback(id: string, adminReply: string) {
  return apiRequest<FeedbackRecord>(`/admin/feedback/${encodeURIComponent(id)}/reply`, {
    method: 'POST',
    body: JSON.stringify({ adminReply })
  });
}

export function getHomeContent() {
  return apiRequest<HomeContent>('/home').then((content) => ({
    content: content as unknown as HomeContent,
    meta: { source: 'api-v1' }
  }));
}

export function saveHomeContent(content: HomeContent) {
  return Promise.resolve({ content, meta: { source: 'readonly' } });
}

export function resetHomeContent() {
  return getHomeContent();
}

export function getLiveContent() {
  return apiRequest<ApiPage<LiveItem>>('/cameras').then((page) => ({
    items: page.list,
    meta: {
      source: 'api-v1',
      stats: { total: page.total, enabled: page.list.length, customSources: 0 }
    }
  }));
}

export function saveLiveContent(items: LiveItem[]) {
  return Promise.resolve({ items, meta: { source: 'readonly' } });
}

export function resetLiveContent() {
  return getLiveContent();
}

export function listResourceContent() {
  const resources: ResourceContentSummary[] = [
    { key: 'spots', label: '景点', limit: 100, meta: { source: 'api-v1' } },
    { key: 'routes', label: '路线', limit: 100, meta: { source: 'api-v1' } },
    { key: 'foods', label: '美食', limit: 100, meta: { source: 'api-v1' } },
    { key: 'map-points', label: '地图点位', limit: 100, meta: { source: 'api-v1' } },
    { key: 'products', label: '商品', limit: 100, meta: { source: 'api-v1' } }
  ];
  return Promise.resolve({ items: resources });
}

const resourceEndpointMap: Record<ResourceKey, string> = {
  spots: 'scenic-spots',
  routes: 'travel-routes',
  foods: 'foods',
  'map-points': 'map-points',
  products: 'products'
};

export function getResourceContent(key: ResourceKey) {
  const resource = resourceEndpointMap[key];
  return apiRequest<ApiPage<Record<string, unknown>>>(`/${resource}?pageSize=100`).then((page) => ({
    key,
    label: key,
    limit: 100,
    meta: { source: 'api-v1', stats: { total: page.total } },
    items: page.list
  }));
}

export function saveResourceContent(key: ResourceKey, items: ResourceContentEnvelope['items']) {
  return Promise.resolve({ key, label: key, limit: 100, meta: { source: 'readonly' }, items });
}

export function resetResourceContent(key: ResourceKey) {
  return getResourceContent(key);
}

export function listBookings(params: QueryParams) {
  return listAdminResource<RawReservationOrder>('reservation-orders', params).then((page) =>
    toLegacyList(page, mapReservationOrder, statusStats(page.list))
  );
}

export function listFeedback(params: QueryParams) {
  return listAdminResource<RawFeedback>('feedback', params).then((page) =>
    toLegacyList(page, mapFeedback, statusStats(page.list))
  );
}

export function listOrders(params: QueryParams) {
  return listAdminResource<RawOrder>('orders', params).then((page) =>
    toLegacyList(page, mapOrder, statusStats(page.list))
  );
}

export function listAudit(params: QueryParams) {
  return apiRequest<ApiPage<AuditRecord>>(`/admin/audit-logs${queryString(params)}`).then(
    toLegacyList
  );
}

export function updateRecordStatus(
  kind: 'bookings' | 'feedback',
  id: string,
  payload: { status: string; note?: string }
) {
  if (kind === 'bookings') {
    const data: Record<string, unknown> = { status: payload.status };
    if (payload.status === 'COMPLETED') data.verifiedAt = new Date().toISOString();
    if (payload.status === 'CANCELLED') data.cancelledAt = new Date().toISOString();
    return updateAdminResource<RawReservationOrder>('reservation-orders', id, data).then(
      mapReservationOrder
    );
  }
  if (payload.status === 'REPLIED') {
    return replyFeedback(id, payload.note || '已处理').then((record) =>
      mapFeedback(record as unknown as RawFeedback)
    );
  }
  return updateAdminResource<RawFeedback>('feedback', id, {
    status: payload.status,
    ...(payload.note ? { adminReply: payload.note } : {})
  }).then(mapFeedback);
}

export async function updateBulkStatus(
  kind: 'bookings' | 'feedback',
  payload: { ids: string[]; status: string; note?: string }
) {
  await Promise.all(
    payload.ids.map((id) => updateRecordStatus(kind, id, { status: payload.status, note: payload.note }))
  );
  return { updated: payload.ids.length };
}

export function updateOrderFulfillment(
  id: string,
  payload: {
    status: string;
    note?: string;
    carrier?: string;
    trackingNo?: string;
  }
) {
  if (payload.status === 'SHIPPED') {
    return shipOrder(id, {
      logisticsCompany: payload.carrier || '',
      logisticsNo: payload.trackingNo || ''
    }).then((record) => mapOrder(record as unknown as RawOrder));
  }
  return updateAdminResource<RawOrder>('orders', id, {
    status: payload.status,
    ...(payload.status === 'COMPLETED' ? { completedAt: new Date().toISOString() } : {}),
    ...(payload.status === 'CANCELLED' ? { cancelledAt: new Date().toISOString() } : {}),
    ...(payload.note ? { remark: payload.note } : {})
  }).then(mapOrder);
}

export async function fetchExportBlob(
  collection: 'bookings' | 'feedback' | 'orders',
  params: QueryParams = {}
) {
  if (collection === 'orders') {
    const result = await listOrders({ ...params, page: 1, pageSize: 100 });
    return csvBlob(
      ['orderNo', 'item', 'status', 'paymentStatus', 'price', 'contact', 'createdAt'],
      result.items.map((item) => ({
        orderNo: item.orderNo,
        item: item.item,
        status: item.status,
        paymentStatus: item.paymentStatus,
        price: item.price,
        contact: item.contact,
        createdAt: item.createdAt
      }))
    );
  }
  if (collection === 'bookings') {
    const result = await listBookings({ ...params, page: 1, pageSize: 100 });
    return csvBlob(
      ['service', 'date', 'people', 'status', 'contact', 'createdAt'],
      result.items.map((item) => ({
        service: item.service,
        date: item.date,
        people: item.people,
        status: item.status,
        contact: item.contact,
        createdAt: item.createdAt
      }))
    );
  }
  const result = await listFeedback({ ...params, page: 1, pageSize: 100 });
  return csvBlob(
    ['nickname', 'content', 'status', 'contact', 'createdAt'],
    result.items.map((item) => ({
      nickname: item.nickname,
      content: item.content,
      status: item.status,
      contact: item.contact,
      createdAt: item.createdAt
    }))
  );
}

export async function fetchBackupBlob() {
  const [dashboard, config] = await Promise.all([getDashboard(), getConfigStatus()]);
  return new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), dashboard, config }, null, 2)], {
    type: 'application/json'
  });
}
