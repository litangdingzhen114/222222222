import {
  DeleteOutlined,
  EditOutlined,
  LinkOutlined,
  PlusOutlined,
  PlayCircleOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import {
  App,
  Button,
  Card,
  Col,
  Drawer,
  Form,
  Image,
  Input,
  InputNumber,
  Popconfirm,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Typography
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import {
  createAdminResource,
  deleteAdminResource,
  listAdminResource,
  testCameraPlayUrl,
  updateAdminResource
} from '../api';
import { formatDate, statusColor } from '../utils';

const { Text } = Typography;

type CameraRecord = {
  id: string;
  name: string;
  coverImage: string;
  deviceSerial: string;
  channelNo: number;
  ezvizDeviceId?: string | null;
  location?: string | null;
  longitude?: number | string | null;
  latitude?: number | string | null;
  description?: string | null;
  status: 'ONLINE' | 'OFFLINE' | 'DISABLED';
  sort?: number;
  createdAt?: string;
  updatedAt?: string;
};

type CameraFormValues = Omit<CameraRecord, 'id' | 'createdAt' | 'updatedAt'>;

type EditingState = {
  mode: 'create' | 'edit';
  record: Partial<CameraRecord>;
};

const statusOptions = [
  { label: '在线', value: 'ONLINE' },
  { label: '离线', value: 'OFFLINE' },
  { label: '停用', value: 'DISABLED' }
];

const statusLabels = Object.fromEntries(statusOptions.map((item) => [item.value, item.label]));

function emptyCamera(): CameraFormValues {
  return {
    name: '新增直播点位',
    coverImage: '/assets/photos/ai-village-gate.jpg',
    deviceSerial: '',
    channelNo: 1,
    ezvizDeviceId: '',
    location: '',
    longitude: undefined,
    latitude: undefined,
    description: '',
    status: 'DISABLED',
    sort: 99
  };
}

function normalizeCamera(values: CameraFormValues) {
  return {
    ...values,
    channelNo: Number(values.channelNo || 1),
    sort: Number(values.sort || 0),
    longitude: values.longitude === undefined || values.longitude === null || values.longitude === '' ? undefined : Number(values.longitude),
    latitude: values.latitude === undefined || values.latitude === null || values.latitude === '' ? undefined : Number(values.latitude)
  };
}

export function LiveContentPage() {
  const { message, modal } = App.useApp();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [form] = Form.useForm<CameraFormValues>();

  const query = useQuery({
    queryKey: ['admin-resource', 'cameras', page, keyword],
    queryFn: () => listAdminResource<CameraRecord>('cameras', { page, pageSize: 10, keyword })
  });

  useEffect(() => {
    if (editing) form.setFieldsValue(editing.record as CameraFormValues);
    else form.resetFields();
  }, [editing, form]);

  const stats = useMemo(() => {
    const list = query.data?.list || [];
    return {
      total: query.data?.total || 0,
      online: list.filter((item) => item.status === 'ONLINE').length,
      offline: list.filter((item) => item.status === 'OFFLINE').length,
      disabled: list.filter((item) => item.status === 'DISABLED').length
    };
  }, [query.data]);

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ['admin-resource', 'cameras'] });
    await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const values = normalizeCamera(await form.validateFields());
      if (editing?.mode === 'edit') {
        return updateAdminResource<CameraRecord>('cameras', String(editing.record.id), values);
      }
      return createAdminResource<CameraRecord>('cameras', values);
    },
    onSuccess: async () => {
      message.success('直播设备已保存');
      setEditing(null);
      await invalidate();
    },
    onError: (error) => message.error(error instanceof Error ? error.message : '保存失败')
  });

  const statusMutation = useMutation({
    mutationFn: ({ record, status }: { record: CameraRecord; status: CameraRecord['status'] }) =>
      updateAdminResource<CameraRecord>('cameras', record.id, { status }),
    onSuccess: async (_, variables) => {
      message.success(`${variables.record.name} 已更新为${statusLabels[variables.status]}`);
      await invalidate();
    },
    onError: (error) => message.error(error instanceof Error ? error.message : '状态更新失败')
  });

  const deleteMutation = useMutation({
    mutationFn: (record: CameraRecord) => deleteAdminResource('cameras', record.id),
    onSuccess: async () => {
      message.success('直播设备已删除');
      await invalidate();
    },
    onError: (error) => message.error(error instanceof Error ? error.message : '删除失败')
  });

  const playUrlMutation = useMutation({
    mutationFn: (record: CameraRecord) => testCameraPlayUrl(record.id),
    onSuccess: (payload) => {
      modal.info({
        title: payload.mode === 'official' ? '正式播放地址' : '开发模式播放地址',
        content: (
          <Space direction="vertical" className="page-stack">
            <Text copyable>{payload.playUrl}</Text>
            <Text type="secondary">过期时间：{formatDate(payload.expireAt)}</Text>
          </Space>
        )
      });
    },
    onError: (error) => message.error(error instanceof Error ? error.message : '播放地址获取失败')
  });

  const columns: ColumnsType<CameraRecord> = [
    {
      title: '直播点位',
      render: (_, record) => (
        <Space align="start">
          <Image src={record.coverImage} width={72} height={52} className="resource-cover" preview={false} />
          <Space direction="vertical" size={2}>
            <Text strong>{record.name}</Text>
            <Text type="secondary" className="table-subtle">{record.location || record.description || '-'}</Text>
            <Text type="secondary" className="table-subtle">{record.deviceSerial} · 通道 {record.channelNo}</Text>
          </Space>
        </Space>
      )
    },
    { title: '排序', dataIndex: 'sort', width: 80 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 120,
      render: (value) => <Tag color={statusColor(value)}>{statusLabels[value] || value}</Tag>
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      width: 170,
      render: (value) => formatDate(value)
    },
    {
      title: '操作',
      width: 300,
      render: (_, record) => (
        <Space wrap>
          <Button icon={<EditOutlined />} onClick={() => setEditing({ mode: 'edit', record })}>编辑</Button>
          <Button icon={<LinkOutlined />} loading={playUrlMutation.isPending} onClick={() => playUrlMutation.mutate(record)}>测试播放</Button>
          {record.status === 'DISABLED' ? (
            <Button type="primary" onClick={() => statusMutation.mutate({ record, status: 'ONLINE' })}>启用</Button>
          ) : (
            <Button onClick={() => statusMutation.mutate({ record, status: 'DISABLED' })}>停用</Button>
          )}
          <Popconfirm title="删除这个直播设备？" okText="删除" cancelText="取消" onConfirm={() => deleteMutation.mutate(record)}>
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <Space direction="vertical" size={16} className="page-stack">
      <Row gutter={[16, 16]}>
        <Col xs={12} lg={6}><Card><Statistic title="设备总数" value={stats.total} prefix={<PlayCircleOutlined />} /></Card></Col>
        <Col xs={12} lg={6}><Card><Statistic title="在线" value={stats.online} /></Card></Col>
        <Col xs={12} lg={6}><Card><Statistic title="离线" value={stats.offline} /></Card></Col>
        <Col xs={12} lg={6}><Card><Statistic title="停用" value={stats.disabled} /></Card></Col>
      </Row>

      <Card>
        <Space wrap className="toolbar">
          <Input.Search
            allowClear
            placeholder="搜索点位、设备序列号或位置"
            className="search-box"
            onSearch={(value) => {
              setKeyword(value.trim());
              setPage(1);
            }}
          />
          <Button icon={<ReloadOutlined />} onClick={() => invalidate()}>刷新</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setEditing({ mode: 'create', record: emptyCamera() })}>新增设备</Button>
        </Space>
      </Card>

      <Card title="慢直播设备">
        <Table
          rowKey="id"
          loading={query.isLoading}
          dataSource={query.data?.list || []}
          columns={columns}
          pagination={{
            current: page,
            pageSize: 10,
            total: query.data?.total || 0,
            showSizeChanger: false,
            onChange: setPage
          }}
        />
      </Card>

      <Drawer
        title={editing?.mode === 'edit' ? '编辑直播设备' : '新增直播设备'}
        width={700}
        open={Boolean(editing)}
        destroyOnClose
        onClose={() => setEditing(null)}
        extra={<Button type="primary" loading={saveMutation.isPending} onClick={() => saveMutation.mutate()}>保存</Button>}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="点位名称" name="name" rules={[{ required: true, message: '请输入点位名称' }]}>
                <Input maxLength={80} showCount />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="状态" name="status" rules={[{ required: true, message: '请选择状态' }]}>
                <Select options={statusOptions} />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item label="封面图" name="coverImage" rules={[{ required: true, message: '请输入封面图路径' }]}>
                <Input placeholder="/assets/photos/ai-village-gate.jpg" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="萤石设备序列号" name="deviceSerial" rules={[{ required: true, message: '请输入设备序列号' }]}>
                <Input maxLength={80} showCount />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="通道号" name="channelNo" rules={[{ required: true, message: '请输入通道号' }]}>
                <InputNumber min={1} max={64} precision={0} className="full-input" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="萤石设备 ID" name="ezvizDeviceId">
                <Input maxLength={120} showCount />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="位置" name="location">
                <Input maxLength={120} showCount />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="经度" name="longitude">
                <InputNumber precision={7} className="full-input" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="纬度" name="latitude">
                <InputNumber precision={7} className="full-input" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="排序" name="sort">
                <InputNumber min={0} max={9999} precision={0} className="full-input" />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item label="说明" name="description">
                <Input.TextArea rows={4} maxLength={600} showCount />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Drawer>
    </Space>
  );
}
