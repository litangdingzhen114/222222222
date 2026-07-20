import { App, Button, Card, Col, Descriptions, Drawer, Form, Input, Row, Select, Space, Statistic, Table, Tag, Timeline, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchExportBlob, listOrders, updateOrderFulfillment } from '../api';
import type { OrderRecord } from '../types';
import { orderStatusOptions, orderTypeOptions } from '../types';
import { downloadBlob, formatDate, maskContact, statusColor, statusText } from '../utils';

const { Text } = Typography;
const pageSize = 10;

const orderTypeText: Record<string, string> = {
  product: '实物商品',
  service: '村游服务',
  ticket: '票券课程',
  stay: '民宿订单',
  venue: '场地预约'
};

const nextStatusMap: Record<string, Record<string, string[]>> = {
  product: {
    new: ['confirmed', 'cancelled'],
    confirmed: ['pending_shipment', 'cancelled'],
    pending_shipment: ['shipped', 'cancelled'],
    shipped: ['received', 'completed'],
    received: ['completed']
  },
  service: {
    new: ['confirmed', 'cancelled'],
    confirmed: ['pending_service', 'cancelled'],
    pending_service: ['in_service', 'cancelled'],
    in_service: ['completed', 'cancelled']
  },
  ticket: {
    new: ['confirmed', 'cancelled'],
    confirmed: ['pending_verify', 'cancelled'],
    pending_verify: ['verified', 'expired', 'cancelled'],
    verified: ['completed']
  },
  stay: {
    new: ['confirmed', 'cancelled'],
    confirmed: ['pending_service', 'cancelled'],
    pending_service: ['in_service', 'cancelled'],
    in_service: ['completed', 'cancelled']
  },
  venue: {
    new: ['confirmed', 'cancelled'],
    confirmed: ['pending_service', 'cancelled'],
    pending_service: ['in_service', 'cancelled'],
    in_service: ['completed', 'cancelled']
  }
};

function nextOrderStatusOptions(record?: OrderRecord | null) {
  if (!record) return orderStatusOptions.filter((item) => item.value);
  const current = record.status || 'new';
  const allowed = new Set([current, ...(nextStatusMap[record.type || 'service']?.[current] || [])]);
  return orderStatusOptions.filter((item) => item.value && allowed.has(item.value));
}

type FulfillmentForm = {
  status: string;
  note?: string;
  carrier?: string;
  trackingNo?: string;
  verifyCode?: string;
};

function OrderDetailDrawer({
  open,
  record,
  saving,
  onClose,
  onSave
}: {
  open: boolean;
  record: OrderRecord | null;
  saving?: boolean;
  onClose: () => void;
  onSave: (values: FulfillmentForm) => void;
}) {
  const [form] = Form.useForm<FulfillmentForm>();

  useEffect(() => {
    if (!record) return;
    form.setFieldsValue({
      status: record.status || 'new',
      note: record.adminNote || '',
      carrier: record.logistics?.carrier || '',
      trackingNo: record.logistics?.trackingNo || '',
      verifyCode: record.verification?.code || ''
    });
  }, [form, record]);

  const status = Form.useWatch('status', form);
  const showLogistics = record?.type === 'product' && status === 'shipped';
  const showVerify = record?.type === 'ticket' && status === 'verified';

  return (
    <Drawer
      title={record?.item || record?.service || '订单详情'}
      width={620}
      open={open}
      onClose={onClose}
      destroyOnClose
      extra={<Tag color={statusColor(record?.status)}>{statusText(record?.status)}</Tag>}
    >
      {record ? (
        <Space direction="vertical" size={18} className="page-stack">
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="订单号">{record.orderNo || record.id}</Descriptions.Item>
            <Descriptions.Item label="类型">{orderTypeText[record.type || 'service'] || record.type}</Descriptions.Item>
            <Descriptions.Item label="服务">{record.service || '-'}</Descriptions.Item>
            <Descriptions.Item label="项目">{record.item || '-'}</Descriptions.Item>
            <Descriptions.Item label="日期">{record.date || '-'}</Descriptions.Item>
            <Descriptions.Item label="人数/份数">{record.people || '-'}</Descriptions.Item>
            <Descriptions.Item label="价格">{record.price || '-'}</Descriptions.Item>
            <Descriptions.Item label="联系方式">{record.contact || '-'}</Descriptions.Item>
            <Descriptions.Item label="游客备注">{record.remark || '无'}</Descriptions.Item>
            <Descriptions.Item label="游客标识">{record.clientId || '-'}</Descriptions.Item>
            <Descriptions.Item label="来源">{record.source || '-'}</Descriptions.Item>
            <Descriptions.Item label="提交时间">{formatDate(record.createdAt)}</Descriptions.Item>
          </Descriptions>

          <Form form={form} layout="vertical" onFinish={onSave}>
            <Form.Item label="处理状态" name="status" rules={[{ required: true, message: '请选择状态' }]}>
              <Select options={nextOrderStatusOptions(record)} />
            </Form.Item>
            {showLogistics ? (
              <Space className="toolbar" align="start">
                <Form.Item label="物流公司" name="carrier" rules={[{ required: true, message: '请填写物流公司' }]}>
                  <Input placeholder="顺丰 / 中通 / 到村自提" />
                </Form.Item>
                <Form.Item label="快递单号" name="trackingNo" rules={[{ required: true, message: '请填写快递单号' }]}>
                  <Input placeholder="快递单号或自提码" />
                </Form.Item>
              </Space>
            ) : null}
            {showVerify ? (
              <Form.Item label="核销码" name="verifyCode" rules={[{ required: true, message: '请填写核销码' }]}>
                <Input placeholder="现场核销码" />
              </Form.Item>
            ) : null}
            <Form.Item label="处理备注" name="note">
              <Input.TextArea rows={4} placeholder="记录发货、核销、改期、取消原因或服务安排" />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={saving}>保存履约</Button>
          </Form>

          <div className="history-panel">
            <Text strong>履约记录</Text>
            <Timeline
              className="record-timeline"
              items={[...(record.statusHistory || [])].reverse().map((entry) => ({
                color: statusColor(entry.toStatus),
                children: (
                  <Space direction="vertical" size={2}>
                    <Space wrap>
                      <Tag>{entry.type === 'created' ? '提交订单' : '状态流转'}</Tag>
                      <Text>{statusText(entry.fromStatus)} → {statusText(entry.toStatus)}</Text>
                    </Space>
                    <Text type="secondary">{formatDate(entry.at)} · {entry.by || '-'}</Text>
                    {entry.note ? <Text>{entry.note}</Text> : null}
                  </Space>
                )
              }))}
            />
          </div>
        </Space>
      ) : null}
    </Drawer>
  );
}

export function OrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [detail, setDetail] = useState<OrderRecord | null>(null);
  const { message } = App.useApp();
  const queryClient = useQueryClient();

  const page = Number(searchParams.get('page') || 1);
  const status = searchParams.get('status') || '';
  const type = searchParams.get('type') || '';
  const q = searchParams.get('q') || '';

  const query = useQuery({
    queryKey: ['orders', { page, status, type, q }],
    queryFn: () => listOrders({ page, pageSize, status, type, q })
  });

  const mutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: FulfillmentForm }) => updateOrderFulfillment(id, values),
    onSuccess: async () => {
      message.success('订单履约已更新');
      setDetail(null);
      await queryClient.invalidateQueries({ queryKey: ['orders'] });
      await queryClient.invalidateQueries({ queryKey: ['summary'] });
    },
    onError: (error) => message.error(error instanceof Error ? error.message : '订单处理失败')
  });

  const stats = query.data?.stats || {};
  const pendingFulfillment = (stats.pendingShipment || 0) + (stats.pendingService || 0) + (stats.pendingVerify || 0);

  const exportData = async () => {
    const blob = await fetchExportBlob('orders', { status, orderType: type, q });
    downloadBlob(blob, 'hailin-orders.csv');
    message.success('订单 CSV 已导出');
  };

  const setParam = (key: string, value: string | number) => {
    const next = new URLSearchParams(searchParams);
    if (value === '') next.delete(key);
    else next.set(key, String(value));
    if (key !== 'page') next.set('page', '1');
    setSearchParams(next);
  };

  const columns = useMemo<ColumnsType<OrderRecord>>(() => [
    {
      title: '订单',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <strong>{record.item || record.service || '-'}</strong>
          <span className="table-subtle">{record.orderNo || record.id}</span>
        </Space>
      )
    },
    {
      title: '类型',
      dataIndex: 'type',
      width: 110,
      render: (value) => orderTypeText[value] || value || '-'
    },
    { title: '日期', dataIndex: 'date', width: 120 },
    { title: '人数/份数', dataIndex: 'people', width: 100 },
    { title: '联系方式', dataIndex: 'contact', width: 150, render: (value) => maskContact(value) },
    {
      title: '状态',
      dataIndex: 'status',
      width: 120,
      render: (value) => <Tag color={statusColor(value)}>{statusText(value)}</Tag>
    },
    {
      title: '操作',
      width: 110,
      render: (_, record) => <Button type="link" onClick={() => setDetail(record)}>履约</Button>
    }
  ], []);

  return (
    <Space direction="vertical" size={16} className="page-stack">
      <Row gutter={[16, 16]}>
        <Col xs={12} lg={6}>
          <Card>
            <Statistic title="当前筛选" value={stats.total ?? query.data?.total ?? 0} suffix="单" />
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card>
            <Statistic title="待确认" value={stats.new || 0} suffix="单" />
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card>
            <Statistic title="待履约" value={pendingFulfillment} suffix="单" />
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card>
            <Statistic title="已完成" value={stats.completed || 0} suffix="单" />
          </Card>
        </Col>
      </Row>

      <Card>
        <Space wrap className="toolbar">
          <Select value={type} options={orderTypeOptions} onChange={(value) => setParam('type', value)} className="status-filter" />
          <Select value={status} options={orderStatusOptions} onChange={(value) => setParam('status', value)} className="status-filter" />
          <Input.Search
            allowClear
            defaultValue={q}
            placeholder="搜索订单号、项目、联系人或备注"
            onSearch={(value) => setParam('q', value.trim())}
            className="search-box"
          />
          <Button onClick={exportData}>导出 CSV</Button>
        </Space>
      </Card>

      <Card>
        <Table
          rowKey="id"
          loading={query.isLoading}
          dataSource={query.data?.items || []}
          columns={columns}
          pagination={{
            current: page,
            pageSize,
            total: query.data?.total || 0,
            showSizeChanger: false,
            onChange: (nextPage) => setParam('page', nextPage)
          }}
        />
      </Card>

      <OrderDetailDrawer
        open={Boolean(detail)}
        record={detail}
        saving={mutation.isPending}
        onClose={() => setDetail(null)}
        onSave={(values) => detail && mutation.mutate({ id: detail.id, values })}
      />
    </Space>
  );
}
