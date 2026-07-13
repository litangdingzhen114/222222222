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

export const statusLabels: Record<string, string> = {
  new: '待处理',
  confirmed: '已确认',
  processing: '处理中',
  completed: '已完成',
  cancelled: '已取消',
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

export type AdminSummary = {
  counts: {
    bookings: Record<string, number>;
    feedback: Record<string, number>;
    lives: { total?: number; enabled?: number; customSources?: number };
    mapPoints?: { total: number };
    homeContent?: Record<string, number | string | undefined>;
  };
  recent: {
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
