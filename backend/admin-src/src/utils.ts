import dayjs from 'dayjs';
import {
  bookingStatusOptions,
  feedbackStatusOptions,
  statusLabels,
  statusTransitions,
  type RecordKind,
  type StatusOption
} from './types';

export function formatDate(value?: string) {
  if (!value) return '-';
  const date = dayjs(value);
  return date.isValid() ? date.format('YYYY-MM-DD HH:mm') : value;
}

export function maskContact(value?: string) {
  const text = String(value || '').trim();
  if (!text) return '-';
  if (/^1\d{10}$/.test(text)) return `${text.slice(0, 3)}****${text.slice(-4)}`;
  if (text.includes('@')) {
    const [name, domain] = text.split('@');
    return `${name.slice(0, 2)}***@${domain || ''}`;
  }
  if (text.length <= 4) return `${text[0] || '*'}***`;
  return `${text.slice(0, 2)}***${text.slice(-2)}`;
}

export function statusText(status?: string, kind?: RecordKind) {
  if (!status) return '-';
  if (kind) {
    const options = kind === 'bookings' ? bookingStatusOptions : feedbackStatusOptions;
    return options.find((option) => option.value === status)?.label || status;
  }
  return statusLabels[status] || status;
}

export function canTransitionStatus(kind: RecordKind, currentStatus: string | undefined, nextStatus: string) {
  const current = currentStatus || 'new';
  if (current === nextStatus) return true;
  return (statusTransitions[kind][current] || []).includes(nextStatus);
}

export function nextStatusOptions(kind: RecordKind, currentStatus: string | undefined, options: StatusOption[]) {
  const current = currentStatus || 'new';
  return options.filter((option) => {
    if (!option.value) return false;
    return option.value === current || canTransitionStatus(kind, current, option.value);
  });
}

export function historyActionText(type?: string) {
  return {
    created: '提交记录',
    status: '状态流转',
    note: '更新备注'
  }[type || ''] || '处理记录';
}

export function statusColor(status?: string) {
  return {
    new: 'orange',
    confirmed: 'blue',
    processing: 'geekblue',
    completed: 'green',
    cancelled: 'red',
    resolved: 'green',
    archived: 'default'
  }[status || ''] || 'default';
}

export function auditActionText(action?: string) {
  return {
    'booking.created': '提交预约',
    'feedback.created': '提交反馈',
    'booking.status.updated': '更新预约状态',
    'feedback.status.updated': '更新反馈状态',
    'booking.bulk-status.updated': '批量处理预约',
    'feedback.bulk-status.updated': '批量处理反馈',
    'home-content.updated': '更新首页内容',
    'home-content.reset': '恢复默认首页',
    'lives-content.updated': '更新慢直播',
    'lives-content.reset': '恢复默认慢直播',
    'bookings.csv.exported': '导出预约 CSV',
    'feedback.csv.exported': '导出反馈 CSV',
    'backup.exported': '下载完整备份'
  }[action || ''] || action || '系统操作';
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function compactJson(value: unknown) {
  try {
    return JSON.stringify(value || {}, null, 2);
  } catch {
    return '{}';
  }
}
