import { Alert, App, Button, Descriptions, Drawer, Form, Input, Select, Space, Tag, Timeline, Typography } from 'antd';
import { useEffect } from 'react';
import type { BookingRecord, FeedbackRecord, RecordKind, StatusOption } from '../types';
import { formatDate, historyActionText, maskContact, nextStatusOptions, statusColor, statusText } from '../utils';

type DetailRecord = BookingRecord | FeedbackRecord;

const { Text } = Typography;

type RecordDetailDrawerProps = {
  kind: RecordKind;
  open: boolean;
  record: DetailRecord | null;
  statusOptions: StatusOption[];
  saving?: boolean;
  onClose: () => void;
  onSave: (payload: { status: string; note?: string }) => void;
};

export function RecordDetailDrawer({
  kind,
  open,
  record,
  statusOptions,
  saving,
  onClose,
  onSave
}: RecordDetailDrawerProps) {
  const { message } = App.useApp();
  const [form] = Form.useForm<{ status: string; note?: string }>();

  useEffect(() => {
    if (record) {
      form.setFieldsValue({
        status: record.status || (kind === 'bookings' ? 'PENDING_PAYMENT' : 'PENDING'),
        note: record.adminNote || ''
      });
    }
  }, [form, record]);

  const copyContact = async () => {
    const contact = record?.contact || '';
    if (!contact) {
      message.warning('没有联系方式');
      return;
    }
    await navigator.clipboard.writeText(contact);
    message.success('联系方式已复制');
  };

  const title = kind === 'bookings'
    ? ((record as BookingRecord | null)?.service || '预约详情')
    : ((record as FeedbackRecord | null)?.nickname || '反馈详情');
  const allowedStatusOptions = record ? nextStatusOptions(kind, record.status, statusOptions) : statusOptions.filter((item) => item.value);
  const canMoveNext = allowedStatusOptions.length > 1;
  const history = record?.statusHistory || [];

  return (
    <Drawer
      title={title}
      width={520}
      open={open}
      onClose={onClose}
      destroyOnClose
      extra={<Tag color={statusColor(record?.status)}>{statusText(record?.status, kind)}</Tag>}
    >
      {record && (
        <Space direction="vertical" size={18} className="page-stack">
          {kind === 'bookings' ? (
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="服务">{(record as BookingRecord).service || '-'}</Descriptions.Item>
              <Descriptions.Item label="预约日期">{(record as BookingRecord).date || '-'}</Descriptions.Item>
              <Descriptions.Item label="人数">{(record as BookingRecord).people || '-'}</Descriptions.Item>
              <Descriptions.Item label="联系方式">{record.contact || '-'}</Descriptions.Item>
              <Descriptions.Item label="游客备注">{(record as BookingRecord).remark || '无'}</Descriptions.Item>
              <Descriptions.Item label="处理备注">{record.adminNote || '无'}</Descriptions.Item>
              <Descriptions.Item label="最近处理">{formatDate(record.lastHandledAt)}</Descriptions.Item>
              <Descriptions.Item label="处理人">{record.lastHandledBy || '-'}</Descriptions.Item>
              <Descriptions.Item label="完成时间">{formatDate((record as BookingRecord).completedAt)}</Descriptions.Item>
              <Descriptions.Item label="取消时间">{formatDate((record as BookingRecord).cancelledAt)}</Descriptions.Item>
              <Descriptions.Item label="来源">{record.source || '-'}</Descriptions.Item>
              <Descriptions.Item label="提交时间">{formatDate(record.createdAt)}</Descriptions.Item>
              <Descriptions.Item label="更新时间">{formatDate(record.updatedAt)}</Descriptions.Item>
            </Descriptions>
          ) : (
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="游客">{(record as FeedbackRecord).nickname || '游客'}</Descriptions.Item>
              <Descriptions.Item label="联系方式">{record.contact || '未留联系方式'}</Descriptions.Item>
              <Descriptions.Item label="反馈内容">{(record as FeedbackRecord).content || '-'}</Descriptions.Item>
              <Descriptions.Item label="处理备注">{record.adminNote || '无'}</Descriptions.Item>
              <Descriptions.Item label="最近处理">{formatDate(record.lastHandledAt)}</Descriptions.Item>
              <Descriptions.Item label="处理人">{record.lastHandledBy || '-'}</Descriptions.Item>
              <Descriptions.Item label="解决时间">{formatDate((record as FeedbackRecord).resolvedAt)}</Descriptions.Item>
              <Descriptions.Item label="归档时间">{formatDate((record as FeedbackRecord).archivedAt)}</Descriptions.Item>
              <Descriptions.Item label="来源">{record.source || '-'}</Descriptions.Item>
              <Descriptions.Item label="提交时间">{formatDate(record.createdAt)}</Descriptions.Item>
              <Descriptions.Item label="更新时间">{formatDate(record.updatedAt)}</Descriptions.Item>
            </Descriptions>
          )}

          <Alert
            type={canMoveNext ? 'info' : 'warning'}
            showIcon
            message={canMoveNext ? '处理状态只显示当前记录允许执行的下一步' : '当前记录已处于终态，可继续补充处理备注'}
          />

          <Form form={form} layout="vertical" onFinish={onSave}>
            <Form.Item label="处理状态" name="status" rules={[{ required: true, message: '请选择状态' }]}>
              <Select options={allowedStatusOptions} />
            </Form.Item>
            <Form.Item label="处理备注" name="note">
              <Input.TextArea rows={4} placeholder="记录电话确认、现场跟进、归档原因等" />
            </Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={saving}>保存处理</Button>
              <Button onClick={copyContact}>复制联系方式</Button>
            </Space>
          </Form>

          <div className="history-panel">
            <Text strong>处理历史</Text>
            {history.length > 0 ? (
              <Timeline
                className="record-timeline"
                items={[...history].reverse().map((entry) => ({
                  color: statusColor(entry.toStatus),
                  children: (
                    <Space direction="vertical" size={2}>
                      <Space wrap>
                        <Tag>{historyActionText(entry.type)}</Tag>
                        <Text>{statusText(entry.fromStatus, kind)} → {statusText(entry.toStatus, kind)}</Text>
                      </Space>
                      <Text type="secondary">{formatDate(entry.at)} · {entry.by || '-'}</Text>
                      {entry.note ? <Text>{entry.note}</Text> : null}
                    </Space>
                  )
                }))}
              />
            ) : (
              <Text type="secondary">暂无处理历史</Text>
            )}
          </div>

          <div className="masked-tip">列表默认脱敏展示：{maskContact(record.contact)}</div>
        </Space>
      )}
    </Drawer>
  );
}
