export type RecordKind = 'bookings' | 'feedback';

export type StatusOption = {
  label: string;
  value: string;
};

export const bookingStatusOptions: StatusOption[] = [
  { value: '', label: '全部' },
  { value: 'new', label: '待确认' },
  { value: 'confirmed', label: '已确认' },
  { value: 'processing', label: '处理中' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' }
];

export const feedbackStatusOptions: StatusOption[] = [
  { value: '', label: '全部' },
  { value: 'new', label: '待处理' },
  { value: 'processing', label: '处理中' },
  { value: 'resolved', label: '已解决' },
  { value: 'archived', label: '已归档' }
];

export const orderStatusOptions: StatusOption[] = [
  { value: '', label: '全部' },
  { value: 'new', label: '待确认' },
  { value: 'confirmed', label: '已确认' },
  { value: 'pending_shipment', label: '待发货' },
  { value: 'shipped', label: '已发货' },
  { value: 'received', label: '已收货' },
  { value: 'pending_service', label: '待出行' },
  { value: 'in_service', label: '服务中' },
  { value: 'pending_verify', label: '待核销' },
  { value: 'verified', label: '已核销' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' },
  { value: 'expired', label: '已过期' }
];

export const orderTypeOptions: StatusOption[] = [
  { value: '', label: '全部类型' },
  { value: 'product', label: '实物商品' },
  { value: 'service', label: '村游服务' },
  { value: 'ticket', label: '票券课程' },
  { value: 'stay', label: '民宿订单' },
  { value: 'venue', label: '场地预约' }
];

export const statusLabels: Record<string, string> = {
  new: '待处理',
  confirmed: '已确认',
  processing: '处理中',
  pending_shipment: '待发货',
  shipped: '已发货',
  received: '已收货',
  pending_service: '待出行',
  in_service: '服务中',
  pending_verify: '待核销',
  verified: '已核销',
  completed: '已完成',
  cancelled: '已取消',
  expired: '已过期',
  resolved: '已解决',
  archived: '已归档'
};

export const statusTransitions: Record<RecordKind, Record<string, string[]>> = {
  bookings: {
    new: ['confirmed', 'cancelled'],
    confirmed: ['processing', 'completed', 'cancelled'],
    processing: ['completed', 'cancelled'],
    completed: [],
    cancelled: []
  },
  feedback: {
    new: ['processing', 'resolved', 'archived'],
    processing: ['resolved', 'archived'],
    resolved: ['archived'],
    archived: []
  }
};

export type ListResponse<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
};

export type StatusHistoryEntry = {
  id?: string;
  type?: 'created' | 'status' | 'note';
  at?: string;
  by?: string;
  fromStatus?: string;
  toStatus?: string;
  note?: string;
  requestId?: string;
};

export type BookingRecord = {
  id: string;
  service?: string;
  date?: string;
  people?: number;
  contact?: string;
  remark?: string;
  source?: string;
  status?: string;
  adminNote?: string;
  statusHistory?: StatusHistoryEntry[];
  lastHandledAt?: string;
  lastHandledBy?: string;
  completedAt?: string;
  cancelledAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type FeedbackRecord = {
  id: string;
  nickname?: string;
  contact?: string;
  content?: string;
  source?: string;
  status?: string;
  adminNote?: string;
  statusHistory?: StatusHistoryEntry[];
  lastHandledAt?: string;
  lastHandledBy?: string;
  resolvedAt?: string;
  archivedAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type OrderRecord = {
  id: string;
  orderNo?: string;
  clientId?: string;
  type?: string;
  featureId?: string;
  service?: string;
  item?: string;
  date?: string;
  people?: number;
  contact?: string;
  remark?: string;
  price?: string;
  source?: string;
  status?: string;
  paymentStatus?: string;
  adminNote?: string;
  logistics?: {
    carrier?: string;
    trackingNo?: string;
    shippedAt?: string;
    receivedAt?: string;
  };
  verification?: {
    code?: string;
    verifiedAt?: string;
    verifiedBy?: string;
  };
  statusHistory?: StatusHistoryEntry[];
  lastHandledAt?: string;
  lastHandledBy?: string;
  completedAt?: string;
  cancelledAt?: string;
  expiredAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type AuditRecord = {
  id: string;
  action?: string;
  adminUser?: string;
  targetType?: string;
  targetId?: string;
  detail?: Record<string, unknown>;
  createdAt?: string;
};

export type HomeContent = {
  banners?: Array<Record<string, unknown>>;
  gridPages?: Array<{ items?: Array<Record<string, unknown>> } & Record<string, unknown>>;
  hotRecommends?: Array<Record<string, unknown>>;
  feeds?: Array<Record<string, unknown>>;
  [key: string]: unknown;
};

export type HomeContentEnvelope = {
  content: HomeContent;
  meta: {
    source?: string;
    updatedAt?: string;
    stats?: {
      banners?: number;
      gridItems?: number;
      hotRecommends?: number;
      feeds?: number;
    };
  };
};

export type LiveItem = {
  id: string;
  title: string;
  viewers?: number;
  desc?: string;
  imageClass?: string;
  icon?: string;
  coverUrl?: string;
  liveUrl?: string;
  hlsUrl?: string;
  enabled?: boolean;
  sortOrder?: number;
  statusText?: string;
};

export type LiveContentEnvelope = {
  items: LiveItem[];
  meta: {
    source?: string;
    updatedAt?: string;
    updatedBy?: string;
    stats?: {
      total?: number;
      enabled?: number;
      customSources?: number;
    };
  };
};

export type ResourceKey = 'spots' | 'routes' | 'foods' | 'map-points' | 'products';

export type ResourceContentItem = Record<string, unknown> & {
  id?: string | number;
  title?: string;
  name?: string;
  subtitle?: string;
  desc?: string;
  type?: string;
  category?: string;
  imageUrl?: string;
  coverUrl?: string;
  targetUrl?: string;
  enabled?: boolean;
  status?: string;
};

export type ResourceContentMeta = {
  source?: string;
  version?: string;
  updatedAt?: string;
  updatedBy?: string;
  stats?: {
    total?: number;
    withImage?: number;
    withTarget?: number;
    hidden?: number;
  };
};

export type ResourceContentSummary = {
  key: ResourceKey;
  label: string;
  limit: number;
  meta: ResourceContentMeta;
};

export type ResourceContentEnvelope = {
  key: ResourceKey;
  label: string;
  limit: number;
  meta: ResourceContentMeta;
  items: ResourceContentItem[];
};

export type AdminSummary = {
  counts: {
    bookings: Record<string, number>;
    feedback: Record<string, number>;
    orders?: Record<string, number>;
    lives: { total?: number; enabled?: number; customSources?: number };
    resources?: Record<string, ResourceContentMeta['stats']>;
    mapPoints?: { total: number };
    homeContent?: Record<string, number | string | undefined>;
  };
  recent: {
    orders?: OrderRecord[];
    bookings: BookingRecord[];
    feedback: FeedbackRecord[];
  };
  system: {
    environment?: string;
    adminUser?: string;
    storageWritable?: boolean;
    aiProvider?: string;
    aiModel?: string;
    publicBaseUrl?: string;
    uptimeSeconds?: number;
    security?: {
      publicBaseUrl?: string;
      httpsEnabled?: boolean;
      adminTokenConfigured?: boolean;
      corsRestricted?: boolean;
      allowedOrigins?: string[];
    };
  };
};
