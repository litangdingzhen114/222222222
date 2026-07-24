export type RecordKind = 'bookings' | 'feedback';

export type AdminRole = 'CONTENT_OPERATOR' | 'MALL_OPERATOR' | 'ADMIN' | 'SUPER_ADMIN';

export type AdminProfile = {
  id: string;
  username: string;
  displayName?: string;
  role: AdminRole;
  status?: string;
  lastLoginAt?: string;
  createdAt?: string;
};

export type TokenBundle = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

export type LoginResponse = TokenBundle & {
  admin: AdminProfile;
};

export type ApiPage<T> = {
  list: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type StatusOption = {
  label: string;
  value: string;
};

export const bookingStatusOptions: StatusOption[] = [
  { value: '', label: '全部' },
  { value: 'PENDING_PAYMENT', label: '待支付' },
  { value: 'PAID', label: '已支付' },
  { value: 'CONFIRMED', label: '已确认' },
  { value: 'COMPLETED', label: '已完成' },
  { value: 'CANCELLED', label: '已取消' },
  { value: 'REFUNDING', label: '退款中' },
  { value: 'REFUNDED', label: '已退款' }
];

export const feedbackStatusOptions: StatusOption[] = [
  { value: '', label: '全部' },
  { value: 'PENDING', label: '待处理' },
  { value: 'PROCESSING', label: '处理中' },
  { value: 'REPLIED', label: '已回复' },
  { value: 'CLOSED', label: '已关闭' }
];

export const orderStatusOptions: StatusOption[] = [
  { value: '', label: '全部' },
  { value: 'PENDING_PAYMENT', label: '待支付' },
  { value: 'PAID', label: '已支付' },
  { value: 'PROCESSING', label: '处理中' },
  { value: 'SHIPPED', label: '已发货' },
  { value: 'COMPLETED', label: '已完成' },
  { value: 'CANCELLED', label: '已取消' },
  { value: 'REFUNDING', label: '退款中' },
  { value: 'REFUNDED', label: '已退款' },
  { value: 'CLOSED', label: '已关闭' }
];

export const orderTypeOptions: StatusOption[] = [
  { value: '', label: '全部类型' },
  { value: 'product', label: '商城订单' }
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
  archived: '已归档',
  PENDING_PAYMENT: '待支付',
  PAID: '已支付',
  PROCESSING: '处理中',
  SHIPPED: '已发货',
  COMPLETED: '已完成',
  CANCELLED: '已取消',
  REFUNDING: '退款中',
  REFUNDED: '已退款',
  CLOSED: '已关闭',
  UNPAID: '未支付',
  PAYING: '支付中',
  FAILED: '支付失败',
  NOT_SHIPPED: '未发货',
  RECEIVED: '已收货',
  PENDING: '待处理',
  REPLIED: '已回复'
};

export const statusTransitions: Record<RecordKind, Record<string, string[]>> = {
  bookings: {
    PENDING_PAYMENT: ['CANCELLED'],
    PAID: ['CONFIRMED', 'CANCELLED', 'REFUNDING'],
    CONFIRMED: ['COMPLETED', 'CANCELLED', 'REFUNDING'],
    COMPLETED: [],
    CANCELLED: [],
    REFUNDING: ['REFUNDED'],
    REFUNDED: []
  },
  feedback: {
    PENDING: ['PROCESSING', 'REPLIED', 'CLOSED'],
    PROCESSING: ['REPLIED', 'CLOSED'],
    REPLIED: ['CLOSED'],
    CLOSED: []
  }
};

export type ListResponse<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  stats?: Record<string, number>;
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
  users: number;
  orders: number;
  reservations: number;
  activities: number;
  feedbackPending: number;
  productLowStock: number;
};

export type DashboardTrendPoint = {
  date: string;
  newUsers: number;
  orderCount: number;
  orderAmount: number;
};

export type AdminDashboard = {
  metrics: {
    users: number;
    todayUsers: number;
    scenicSpots: number;
    activities: number;
    pendingReservations: number;
    pendingShipments: number;
    todayOrderAmount: number;
    todayOrderCount: number;
    totalOrderAmount: number;
    totalOrderCount: number;
    productLowStock: number;
    feedbackPending: number;
  };
  charts: {
    trend: DashboardTrendPoint[];
    orderStatusDistribution: Array<{ status: string; count: number }>;
    popularSpots: Array<{ id: string; name: string; value: number }>;
    hotProducts: Array<{ id: string; name: string; sales: number; stock: number }>;
  };
};

export type ConfigStatusItem = {
  key: string;
  name: string;
  status: 'configured' | 'development' | 'missing' | 'abnormal';
  mode: 'official' | 'development' | 'degraded' | 'waiting_credentials';
  message: string;
};

export type ConfigStatus = {
  environment: string;
  publicBaseUrl?: string;
  items: ConfigStatusItem[];
};

export type LegacySystemSummary = {
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
