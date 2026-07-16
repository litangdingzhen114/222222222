import type {
  AdminSummary,
  AuditRecord,
  BookingRecord,
  FeedbackRecord,
  HomeContent,
  HomeContentEnvelope,
  ListResponse,
  LiveContentEnvelope,
  LiveItem,
  OrderRecord,
  ResourceContentEnvelope,
  ResourceContentSummary,
  ResourceKey,
  RecordKind
} from './types';

export const TOKEN_KEY = 'hailin-admin-token';

type QueryParams = Record<string, string | number | undefined>;

class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function token() {
  return localStorage.getItem(TOKEN_KEY) || '';
}

function queryString(params: QueryParams = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') search.set(key, String(value));
  });
  const text = search.toString();
  return text ? `?${text}` : '';
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  const hasBody = init.body !== undefined;
  if (hasBody && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  headers.set('Authorization', `Bearer ${token()}`);

  const response = await fetch(path, { ...init, headers });
  const isJson = (response.headers.get('content-type') || '').includes('application/json');
  const payload = isJson ? await response.json() : null;

  if (response.status === 401 || response.status === 503) {
    window.dispatchEvent(new CustomEvent('hailin-admin-unauthorized'));
  }

  if (!response.ok) {
    const message = payload?.error?.message || `请求失败 ${response.status}`;
    throw new ApiError(response.status, message);
  }

  return payload?.data as T;
}

export function getSession() {
  return apiRequest<{ user: string; environment: string }>('/api/admin/session');
}

export function getSummary() {
  return apiRequest<AdminSummary>('/api/admin/summary');
}

export function getHomeContent() {
  return apiRequest<HomeContentEnvelope>('/api/admin/home-content');
}

export function saveHomeContent(content: HomeContent) {
  return apiRequest<HomeContentEnvelope>('/api/admin/home-content', {
    method: 'PUT',
    body: JSON.stringify({ content })
  });
}

export function resetHomeContent() {
  return apiRequest<HomeContentEnvelope>('/api/admin/home-content/reset', { method: 'POST' });
}

export function getLiveContent() {
  return apiRequest<LiveContentEnvelope>('/api/admin/lives');
}

export function saveLiveContent(items: LiveItem[]) {
  return apiRequest<LiveContentEnvelope>('/api/admin/lives', {
    method: 'PUT',
    body: JSON.stringify({ items })
  });
}

export function resetLiveContent() {
  return apiRequest<LiveContentEnvelope>('/api/admin/lives/reset', { method: 'POST' });
}

export function listResourceContent() {
  return apiRequest<{ items: ResourceContentSummary[] }>('/api/admin/resources');
}

export function getResourceContent(key: ResourceKey) {
  return apiRequest<ResourceContentEnvelope>(`/api/admin/resources/${key}`);
}

export function saveResourceContent(key: ResourceKey, items: ResourceContentEnvelope['items']) {
  return apiRequest<ResourceContentEnvelope>(`/api/admin/resources/${key}`, {
    method: 'PUT',
    body: JSON.stringify({ items })
  });
}

export function resetResourceContent(key: ResourceKey) {
  return apiRequest<ResourceContentEnvelope>(`/api/admin/resources/${key}/reset`, { method: 'POST' });
}

export function listBookings(params: QueryParams) {
  return apiRequest<ListResponse<BookingRecord>>(`/api/admin/bookings${queryString(params)}`);
}

export function listFeedback(params: QueryParams) {
  return apiRequest<ListResponse<FeedbackRecord>>(`/api/admin/feedback${queryString(params)}`);
}

export function listOrders(params: QueryParams) {
  return apiRequest<ListResponse<OrderRecord>>(`/api/admin/orders${queryString(params)}`);
}

export function listAudit(params: QueryParams) {
  return apiRequest<ListResponse<AuditRecord>>(`/api/admin/audit${queryString(params)}`);
}

export function updateRecordStatus(
  kind: RecordKind,
  id: string,
  payload: { status: string; note?: string }
) {
  return apiRequest<BookingRecord | FeedbackRecord>(`/api/admin/${kind}/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });
}

export function updateBulkStatus(
  kind: RecordKind,
  payload: { ids: string[]; status: string; note?: string }
) {
  return apiRequest<{ updated: number }>(`/api/admin/${kind}/bulk-status`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });
}

export function updateOrderFulfillment(
  id: string,
  payload: {
    status: string;
    note?: string;
    carrier?: string;
    trackingNo?: string;
    verifyCode?: string;
  }
) {
  return apiRequest<OrderRecord>(`/api/admin/orders/${id}/fulfillment`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });
}

export async function fetchExportBlob(type: 'bookings' | 'feedback') {
  const response = await fetch(`/api/admin/export?type=${type}`, {
    headers: { Authorization: `Bearer ${token()}` }
  });
  if (!response.ok) throw new Error('导出失败');
  return response.blob();
}

export async function fetchBackupBlob() {
  const response = await fetch('/api/admin/backup', {
    headers: { Authorization: `Bearer ${token()}` }
  });
  if (!response.ok) throw new Error('备份失败');
  return response.blob();
}
