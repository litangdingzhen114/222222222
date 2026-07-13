import { DeleteOutlined, EditOutlined, PlusOutlined, PlayCircleOutlined } from '@ant-design/icons';
import {
  App,
  Button,
  Card,
  Col,
  Descriptions,
  Drawer,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  Row,
  Space,
  Statistic,
  Switch,
  Table,
  Tag
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { getLiveContent, resetLiveContent, saveLiveContent } from '../api';
import type { LiveItem } from '../types';
import { formatDate } from '../utils';

type EditingState = {
  mode: 'create' | 'edit';
  item: LiveItem;
};

function sourceTag(item: LiveItem) {
  if (item.hlsUrl) return <Tag color="purple">HLS</Tag>;
  if (item.liveUrl) return <Tag color="blue">自定义视频</Tag>;
  return <Tag>后端示例视频</Tag>;
}

function emptyLiveItem(): LiveItem {
  return {
    id: `live-${Date.now()}`,
    title: '',
    viewers: 0,
    desc: '',
    imageClass: '',
    icon: '播',
    coverUrl: '',
    liveUrl: '',
    hlsUrl: '',
    enabled: true,
    sortOrder: 99,
    statusText: '直播中'
  };
}

export function LiveContentPage() {
  const { message, modal } = App.useApp();
  const queryClient = useQueryClient();
  const [items, setItems] = useState<LiveItem[]>([]);
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [form] = Form.useForm<LiveItem>();

  const query = useQuery({ queryKey: ['lives-content'], queryFn: getLiveContent });

  useEffect(() => {
    if (query.data?.items) setItems(query.data.items);
  }, [query.data]);

  useEffect(() => {
    if (editing) form.setFieldsValue(editing.item);
  }, [editing, form]);

  const stats = query.data?.meta.stats || {};
  const sortedItems = useMemo(() => [...items].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)), [items]);

  const saveMutation = useMutation({
    mutationFn: () => saveLiveContent(sortedItems),
    onSuccess: async (payload) => {
      setItems(payload.items);
      message.success('慢直播配置已保存');
      await queryClient.invalidateQueries({ queryKey: ['lives-content'] });
      await queryClient.invalidateQueries({ queryKey: ['summary'] });
    },
    onError: (error) => message.error(error instanceof Error ? error.message : '保存失败')
  });

  const resetMutation = useMutation({
    mutationFn: resetLiveContent,
    onSuccess: async (payload) => {
      setItems(payload.items);
      message.success('已恢复默认直播点位');
      await queryClient.invalidateQueries({ queryKey: ['lives-content'] });
      await queryClient.invalidateQueries({ queryKey: ['summary'] });
    }
  });

  const openCreate = () => setEditing({ mode: 'create', item: emptyLiveItem() });
  const openEdit = (item: LiveItem) => setEditing({ mode: 'edit', item });

  const submitDrawer = async () => {
    const values = await form.validateFields();
    if (editing?.mode === 'edit') {
      setItems((current) => current.map((item) => item.id === editing.item.id ? values : item));
    } else {
      setItems((current) => [...current, values]);
    }
    setEditing(null);
    message.success('已更新本地编辑，记得保存配置');
  };

  const removeItem = (id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
    message.success('已移除点位，记得保存配置');
  };

  const updateEnabled = (id: string, enabled: boolean) => {
    setItems((current) => current.map((item) => item.id === id ? { ...item, enabled } : item));
  };

  const confirmReset = () => {
    modal.confirm({
      title: '恢复默认慢直播点位？',
      content: '当前后台保存的慢直播配置会被默认点位覆盖。',
      okText: '恢复默认',
      cancelText: '取消',
      onOk: () => resetMutation.mutateAsync()
    });
  };

  const columns: ColumnsType<LiveItem> = [
    {
      title: '点位',
      dataIndex: 'title',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <strong>{record.title || '-'}</strong>
          <span className="table-subtle">{record.id}</span>
        </Space>
      )
    },
    { title: '排序', dataIndex: 'sortOrder', width: 80 },
    { title: '观看人数', dataIndex: 'viewers', width: 110 },
    {
      title: '播放源',
      width: 140,
      render: (_, record) => sourceTag(record)
    },
    {
      title: '状态',
      width: 150,
      render: (_, record) => (
        <Space>
          <Switch checked={record.enabled !== false} onChange={(checked) => updateEnabled(record.id, checked)} />
          <Tag color={record.enabled !== false ? 'green' : 'default'}>{record.enabled !== false ? record.statusText || '直播中' : '已停用'}</Tag>
        </Space>
      )
    },
    {
      title: '操作',
      width: 170,
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => openEdit(record)}>编辑</Button>
          <Popconfirm title="移除这个点位？" okText="移除" cancelText="取消" onConfirm={() => removeItem(record.id)}>
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <Space direction="vertical" size={16} className="page-stack">
      <Row gutter={[16, 16]}>
        <Col xs={12} lg={6}><Card><Statistic title="点位总数" value={stats.total || items.length} prefix={<PlayCircleOutlined />} /></Card></Col>
        <Col xs={12} lg={6}><Card><Statistic title="启用点位" value={stats.enabled || items.filter((item) => item.enabled !== false).length} /></Card></Col>
        <Col xs={12} lg={6}><Card><Statistic title="自定义源" value={stats.customSources || items.filter((item) => item.liveUrl || item.hlsUrl).length} /></Card></Col>
        <Col xs={12} lg={6}><Card><Statistic title="默认示例源" value={items.filter((item) => !item.liveUrl && !item.hlsUrl).length} /></Card></Col>
      </Row>

      <Card>
        <Descriptions column={{ xs: 1, md: 3 }} size="small">
          <Descriptions.Item label="来源"><Tag color={query.data?.meta.source === 'storage' ? 'green' : 'default'}>{query.data?.meta.source === 'storage' ? '后台已保存' : '默认点位'}</Tag></Descriptions.Item>
          <Descriptions.Item label="更新时间">{formatDate(query.data?.meta.updatedAt)}</Descriptions.Item>
          <Descriptions.Item label="更新人">{query.data?.meta.updatedBy || '-'}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card
        title="慢直播点位"
        extra={(
          <Space>
            <Button icon={<PlusOutlined />} onClick={openCreate}>新增点位</Button>
            <Button onClick={confirmReset}>恢复默认</Button>
            <Button type="primary" loading={saveMutation.isPending} onClick={() => saveMutation.mutate()}>保存配置</Button>
          </Space>
        )}
      >
        <Table
          rowKey="id"
          loading={query.isLoading}
          dataSource={sortedItems}
          columns={columns}
          pagination={false}
        />
      </Card>

      <Drawer
        title={editing?.mode === 'edit' ? '编辑直播点位' : '新增直播点位'}
        width={620}
        open={Boolean(editing)}
        destroyOnClose
        onClose={() => setEditing(null)}
        extra={<Button type="primary" onClick={submitDrawer}>应用编辑</Button>}
      >
        <Form form={form} layout="vertical">
          <Row gutter={14}>
            <Col xs={24} md={12}>
              <Form.Item label="点位 ID" name="id" rules={[{ required: true, message: '请输入点位 ID' }]}>
                <Input disabled={editing?.mode === 'edit'} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="标题" name="title" rules={[{ required: true, message: '请输入标题' }]}>
                <Input maxLength={100} showCount />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="观看人数" name="viewers">
                <InputNumber min={0} max={999999} className="full-input" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="排序" name="sortOrder">
                <InputNumber min={0} max={9999} className="full-input" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="图标字" name="icon">
                <Input maxLength={8} showCount />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="状态文案" name="statusText">
                <Input maxLength={40} showCount />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item label="说明" name="desc">
                <Input.TextArea rows={3} maxLength={500} showCount />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="封面路径" name="coverUrl">
                <Input placeholder="/assets/photos/..." />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="封面样式类" name="imageClass">
                <Input placeholder="ph-oujiang" />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item label="视频地址 MP4/FLV" name="liveUrl">
                <Input placeholder="留空则使用后端示例视频 /media/hailin-live.mp4" />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item label="HLS 地址" name="hlsUrl">
                <Input placeholder="https://.../index.m3u8" />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item label="启用" name="enabled" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Drawer>
    </Space>
  );
}
