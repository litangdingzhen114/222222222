import {
  DeleteOutlined,
  EditOutlined,
  EyeInvisibleOutlined,
  PlusOutlined,
  ReloadOutlined,
  UploadOutlined
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
  Switch,
  Table,
  Tabs,
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
  offlineAdminResource,
  publishAdminResource,
  updateAdminResource
} from '../api';
import type { ApiPage, ResourceContentItem, ResourceKey } from '../types';
import { formatDate, statusColor, statusText } from '../utils';

const { Text } = Typography;

type FieldKind = 'text' | 'textarea' | 'number' | 'money' | 'tags' | 'switch' | 'select';

type ResourceField = {
  name: string;
  label: string;
  kind: FieldKind;
  required?: boolean;
  rows?: number;
  options?: Array<{ label: string; value: string }>;
  min?: number;
  placeholder?: string;
};

type ResourceConfig = {
  key: ResourceKey;
  label: string;
  adminResource: string;
  titleField: string;
  subtitleField?: string;
  imageField: string;
  statusOptions: Array<{ label: string; value: string }>;
  publishStatus: string;
  offlineStatus: string;
  createDefaults: Record<string, unknown>;
  fields: ResourceField[];
};

type EditingState = {
  mode: 'create' | 'edit';
  record: ResourceContentItem;
};

const contentStatusOptions = [
  { label: '草稿', value: 'DRAFT' },
  { label: '已发布', value: 'PUBLISHED' },
  { label: '已下架', value: 'OFFLINE' }
];

const productStatusOptions = [
  { label: '草稿', value: 'DRAFT' },
  { label: '在售', value: 'ON_SALE' },
  { label: '下架', value: 'OFF_SALE' },
  { label: '售罄', value: 'SOLD_OUT' }
];

const mapPointTypeOptions = [
  { label: '景点', value: 'SCENIC_SPOT' },
  { label: '停车场', value: 'PARKING' },
  { label: '厕所', value: 'TOILET' },
  { label: '服务中心', value: 'SERVICE_CENTER' },
  { label: '民宿', value: 'HOMESTAY' },
  { label: '美食', value: 'FOOD' },
  { label: '农场', value: 'FARM' },
  { label: '医疗', value: 'MEDICAL' },
  { label: '直播点', value: 'CAMERA' },
  { label: '其他', value: 'OTHER' }
];

const relatedEntityOptions = [
  { label: '景点', value: 'SCENIC_SPOT' },
  { label: '路线', value: 'TRAVEL_ROUTE' },
  { label: '民宿', value: 'HOMESTAY' },
  { label: '美食', value: 'FOOD' },
  { label: '农场', value: 'FARM' },
  { label: '直播点', value: 'CAMERA' },
  { label: '商品', value: 'PRODUCT' },
  { label: '活动', value: 'ACTIVITY' },
  { label: '文章', value: 'ARTICLE' }
];

const configs: ResourceConfig[] = [
  {
    key: 'spots',
    label: '景点',
    adminResource: 'scenic-spots',
    titleField: 'name',
    subtitleField: 'summary',
    imageField: 'coverImage',
    statusOptions: contentStatusOptions,
    publishStatus: 'PUBLISHED',
    offlineStatus: 'OFFLINE',
    createDefaults: {
      name: '新增景点',
      coverImage: '/assets/photos/ai-village-gate.jpg',
      summary: '',
      content: '',
      status: 'DRAFT',
      sort: 99,
      tags: [],
      images: []
    },
    fields: [
      { name: 'name', label: '景点名称', kind: 'text', required: true },
      { name: 'subtitle', label: '副标题', kind: 'text' },
      { name: 'coverImage', label: '封面图', kind: 'text', required: true },
      { name: 'images', label: '图库', kind: 'tags' },
      { name: 'summary', label: '列表摘要', kind: 'textarea', required: true, rows: 3 },
      { name: 'content', label: '详情内容', kind: 'textarea', required: true, rows: 6 },
      { name: 'address', label: '地址', kind: 'text' },
      { name: 'longitude', label: '经度', kind: 'number' },
      { name: 'latitude', label: '纬度', kind: 'number' },
      { name: 'openingHours', label: '开放时间', kind: 'text' },
      { name: 'phone', label: '电话', kind: 'text' },
      { name: 'ticketInfo', label: '门票说明', kind: 'text' },
      { name: 'suggestedDuration', label: '建议游玩', kind: 'text' },
      { name: 'tags', label: '标签', kind: 'tags' },
      { name: 'isRecommended', label: '首页推荐', kind: 'switch' },
      { name: 'sort', label: '排序', kind: 'number', min: 0 },
      { name: 'status', label: '状态', kind: 'select', options: contentStatusOptions, required: true }
    ]
  },
  {
    key: 'routes',
    label: '路线',
    adminResource: 'travel-routes',
    titleField: 'name',
    subtitleField: 'summary',
    imageField: 'coverImage',
    statusOptions: contentStatusOptions,
    publishStatus: 'PUBLISHED',
    offlineStatus: 'OFFLINE',
    createDefaults: {
      name: '新增路线',
      coverImage: '/assets/photos/ai-village-gate.jpg',
      summary: '',
      content: '',
      status: 'DRAFT',
      sort: 99,
      tags: []
    },
    fields: [
      { name: 'name', label: '路线名称', kind: 'text', required: true },
      { name: 'coverImage', label: '封面图', kind: 'text', required: true },
      { name: 'summary', label: '路线摘要', kind: 'textarea', required: true, rows: 3 },
      { name: 'content', label: '路线详情', kind: 'textarea', required: true, rows: 6 },
      { name: 'duration', label: '游玩时长', kind: 'text' },
      { name: 'distance', label: '路线距离', kind: 'text' },
      { name: 'suitableFor', label: '适合人群', kind: 'text' },
      { name: 'transportation', label: '交通方式', kind: 'text' },
      { name: 'tags', label: '标签', kind: 'tags' },
      { name: 'isRecommended', label: '首页推荐', kind: 'switch' },
      { name: 'sort', label: '排序', kind: 'number', min: 0 },
      { name: 'status', label: '状态', kind: 'select', options: contentStatusOptions, required: true }
    ]
  },
  {
    key: 'foods',
    label: '美食',
    adminResource: 'foods',
    titleField: 'name',
    subtitleField: 'description',
    imageField: 'coverImage',
    statusOptions: contentStatusOptions,
    publishStatus: 'PUBLISHED',
    offlineStatus: 'OFFLINE',
    createDefaults: {
      name: '新增美食',
      coverImage: '/assets/photos/ricefish-drying.jpg',
      description: '',
      status: 'DRAFT',
      sort: 99,
      tags: [],
      images: []
    },
    fields: [
      { name: 'name', label: '美食名称', kind: 'text', required: true },
      { name: 'coverImage', label: '封面图', kind: 'text', required: true },
      { name: 'images', label: '图库', kind: 'tags' },
      { name: 'description', label: '介绍', kind: 'textarea', required: true, rows: 5 },
      { name: 'address', label: '地址', kind: 'text' },
      { name: 'longitude', label: '经度', kind: 'number' },
      { name: 'latitude', label: '纬度', kind: 'number' },
      { name: 'phone', label: '电话', kind: 'text' },
      { name: 'businessHours', label: '营业时间', kind: 'text' },
      { name: 'avgPrice', label: '人均价格', kind: 'money', min: 0 },
      { name: 'tags', label: '标签', kind: 'tags' },
      { name: 'sort', label: '排序', kind: 'number', min: 0 },
      { name: 'status', label: '状态', kind: 'select', options: contentStatusOptions, required: true }
    ]
  },
  {
    key: 'map-points',
    label: '地图点位',
    adminResource: 'map-points',
    titleField: 'name',
    subtitleField: 'description',
    imageField: 'imageUrl',
    statusOptions: contentStatusOptions,
    publishStatus: 'PUBLISHED',
    offlineStatus: 'OFFLINE',
    createDefaults: {
      name: '新增地图点位',
      type: 'SCENIC_SPOT',
      longitude: 120.2184,
      latitude: 28.2136,
      status: 'PUBLISHED',
      sort: 99
    },
    fields: [
      { name: 'name', label: '点位名称', kind: 'text', required: true },
      { name: 'type', label: '点位类型', kind: 'select', options: mapPointTypeOptions, required: true },
      { name: 'icon', label: '图标', kind: 'text' },
      { name: 'imageUrl', label: '点位图片', kind: 'text' },
      { name: 'longitude', label: '经度', kind: 'number', required: true },
      { name: 'latitude', label: '纬度', kind: 'number', required: true },
      { name: 'address', label: '地址', kind: 'text' },
      { name: 'phone', label: '电话', kind: 'text' },
      { name: 'description', label: '描述', kind: 'textarea', rows: 4 },
      { name: 'businessHours', label: '营业时间', kind: 'text' },
      { name: 'relatedEntityType', label: '关联类型', kind: 'select', options: relatedEntityOptions },
      { name: 'relatedEntityId', label: '关联 ID', kind: 'text' },
      { name: 'sort', label: '排序', kind: 'number', min: 0 },
      { name: 'status', label: '状态', kind: 'select', options: contentStatusOptions, required: true }
    ]
  },
  {
    key: 'products',
    label: '农特产商品',
    adminResource: 'products',
    titleField: 'name',
    subtitleField: 'subtitle',
    imageField: 'coverImage',
    statusOptions: productStatusOptions,
    publishStatus: 'ON_SALE',
    offlineStatus: 'OFF_SALE',
    createDefaults: {
      name: '新增商品',
      coverImage: '/assets/photos/ai-fish-keychain.jpg',
      detail: '',
      categoryId: '',
      price: 0,
      stock: 0,
      unit: '件',
      status: 'DRAFT',
      sort: 99,
      images: []
    },
    fields: [
      { name: 'name', label: '商品名称', kind: 'text', required: true },
      { name: 'subtitle', label: '卖点', kind: 'text' },
      { name: 'coverImage', label: '封面图', kind: 'text', required: true },
      { name: 'images', label: '图库', kind: 'tags' },
      { name: 'detail', label: '商品详情', kind: 'textarea', required: true, rows: 6 },
      { name: 'categoryId', label: '分类 ID', kind: 'text', required: true },
      { name: 'price', label: '售价', kind: 'money', required: true, min: 0 },
      { name: 'originalPrice', label: '原价', kind: 'money', min: 0 },
      { name: 'stock', label: '库存', kind: 'number', required: true, min: 0 },
      { name: 'unit', label: '单位', kind: 'text', required: true },
      { name: 'specification', label: '规格', kind: 'text' },
      { name: 'sort', label: '排序', kind: 'number', min: 0 },
      { name: 'status', label: '状态', kind: 'select', options: productStatusOptions, required: true }
    ]
  },
  {
    key: 'product-categories',
    label: '商品分类',
    adminResource: 'product-categories',
    titleField: 'name',
    subtitleField: 'id',
    imageField: 'coverImage',
    statusOptions: contentStatusOptions,
    publishStatus: 'PUBLISHED',
    offlineStatus: 'OFFLINE',
    createDefaults: {
      id: '',
      name: '新增分类',
      icon: '田',
      sort: 99,
      status: 'DRAFT'
    },
    fields: [
      { name: 'id', label: '分类 ID', kind: 'text', required: true, placeholder: '例如 farm-products' },
      { name: 'name', label: '分类名称', kind: 'text', required: true },
      { name: 'icon', label: '分类图标/字', kind: 'text' },
      { name: 'parentId', label: '父级 ID', kind: 'text' },
      { name: 'sort', label: '排序', kind: 'number', min: 0 },
      { name: 'status', label: '状态', kind: 'select', options: contentStatusOptions, required: true }
    ]
  }
];

function configFor(key: ResourceKey) {
  return configs.find((item) => item.key === key) || configs[0];
}

function textValue(value: unknown, fallback = '-') {
  if (value === undefined || value === null || value === '') return fallback;
  if (Array.isArray(value)) return value.filter(Boolean).join('、') || fallback;
  if (typeof value === 'object') return fallback;
  return String(value);
}

function imageOf(record: ResourceContentItem, config: ResourceConfig) {
  const value = record[config.imageField];
  if (typeof value === 'string' && value) return value;
  if (Array.isArray(record.images) && typeof record.images[0] === 'string') return record.images[0];
  return '';
}

function statusOptionsMap(config: ResourceConfig) {
  return Object.fromEntries(config.statusOptions.map((item) => [item.value, item.label]));
}

function statusLabel(record: ResourceContentItem, config: ResourceConfig) {
  const status = textValue(record.status, '');
  return statusOptionsMap(config)[status] || statusText(status) || '-';
}

function priceText(record: ResourceContentItem) {
  const price = Number(record.price || 0);
  return price ? `¥${(price / 100).toFixed(2)}` : '-';
}

function normalizeFormValues(values: Record<string, unknown>, config: ResourceConfig) {
  const normalized: Record<string, unknown> = { ...values };
  config.fields.forEach((field) => {
    const value = normalized[field.name];
    if (field.kind === 'money') {
      normalized[field.name] = value === undefined || value === null || value === '' ? undefined : Math.round(Number(value) * 100);
    }
    if (field.kind === 'number') {
      normalized[field.name] = value === undefined || value === null || value === '' ? undefined : Number(value);
    }
  });
  return Object.fromEntries(Object.entries(normalized).filter(([, value]) => value !== undefined));
}

function toFormValues(record: ResourceContentItem, config: ResourceConfig) {
  const values: Record<string, unknown> = { ...record };
  config.fields.forEach((field) => {
    if (field.kind === 'money' && typeof values[field.name] === 'number') {
      values[field.name] = Number(values[field.name]) / 100;
    }
  });
  return values;
}

function emptyRecord(config: ResourceConfig): ResourceContentItem {
  return { ...config.createDefaults };
}

function renderField(field: ResourceField) {
  if (field.kind === 'textarea') {
    return <Input.TextArea rows={field.rows || 4} maxLength={1200} showCount placeholder={field.placeholder} />;
  }
  if (field.kind === 'number') {
    return <InputNumber min={field.min} precision={field.name.includes('longitude') || field.name.includes('latitude') ? 7 : 0} className="full-input" />;
  }
  if (field.kind === 'money') {
    return <InputNumber min={field.min} precision={2} addonAfter="元" className="full-input" />;
  }
  if (field.kind === 'tags') {
    return <Select mode="tags" tokenSeparators={[',', '，']} placeholder="输入后回车添加" />;
  }
  if (field.kind === 'switch') {
    return <Switch />;
  }
  if (field.kind === 'select') {
    return <Select allowClear showSearch optionFilterProp="label" options={field.options || []} placeholder={field.placeholder} />;
  }
  return <Input maxLength={260} showCount placeholder={field.placeholder} />;
}

function productCategoryOptions(page?: ApiPage<ResourceContentItem>) {
  return (page?.list || []).map((item) => ({
    label: textValue(item.name, String(item.id)),
    value: String(item.id)
  }));
}

export function ResourceContentPage() {
  const [activeKey, setActiveKey] = useState<ResourceKey>('spots');
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [form] = Form.useForm<Record<string, unknown>>();
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const config = configFor(activeKey);

  const query = useQuery({
    queryKey: ['admin-resource', config.adminResource, page, keyword],
    queryFn: () => listAdminResource<ResourceContentItem>(config.adminResource, { page, pageSize: 10, keyword })
  });
  const categoryQuery = useQuery({
    queryKey: ['admin-resource', 'product-categories', 'all'],
    queryFn: () => listAdminResource<ResourceContentItem>('product-categories', { page: 1, pageSize: 100 }),
    enabled: activeKey === 'products'
  });

  useEffect(() => {
    setPage(1);
    setEditing(null);
  }, [activeKey]);

  useEffect(() => {
    if (editing) {
      form.setFieldsValue(toFormValues(editing.record, config));
    } else {
      form.resetFields();
    }
  }, [config, editing, form]);

  const stats = useMemo(() => {
    const list = query.data?.list || [];
    return {
      total: query.data?.total || 0,
      published: list.filter((item) => item.status === config.publishStatus).length,
      draft: list.filter((item) => item.status === 'DRAFT').length,
      missingImage: list.filter((item) => !imageOf(item, config)).length
    };
  }, [config, query.data]);

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ['admin-resource', config.adminResource] });
    await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const values = await form.validateFields();
      const data = normalizeFormValues(values, config);
      if (editing?.mode === 'edit') {
        return updateAdminResource<ResourceContentItem>(config.adminResource, String(editing.record.id), data);
      }
      return createAdminResource<ResourceContentItem>(config.adminResource, data);
    },
    onSuccess: async () => {
      message.success('内容已保存');
      setEditing(null);
      await invalidate();
    },
    onError: (error) => message.error(error instanceof Error ? error.message : '保存失败')
  });

  const publishMutation = useMutation({
    mutationFn: (record: ResourceContentItem) => publishAdminResource<ResourceContentItem>(config.adminResource, String(record.id)),
    onSuccess: async () => {
      message.success('已发布');
      await invalidate();
    },
    onError: (error) => message.error(error instanceof Error ? error.message : '发布失败')
  });

  const offlineMutation = useMutation({
    mutationFn: (record: ResourceContentItem) => offlineAdminResource<ResourceContentItem>(config.adminResource, String(record.id)),
    onSuccess: async () => {
      message.success('已下架');
      await invalidate();
    },
    onError: (error) => message.error(error instanceof Error ? error.message : '下架失败')
  });

  const deleteMutation = useMutation({
    mutationFn: (record: ResourceContentItem) => deleteAdminResource(config.adminResource, String(record.id)),
    onSuccess: async () => {
      message.success('已删除');
      await invalidate();
    },
    onError: (error) => message.error(error instanceof Error ? error.message : '删除失败')
  });

  const columns: ColumnsType<ResourceContentItem> = [
    {
      title: '内容',
      render: (_, record) => {
        const image = imageOf(record, config);
        return (
          <Space align="start">
            {image ? (
              <Image src={image} width={64} height={48} className="resource-cover" preview={false} />
            ) : (
              <div className="resource-cover resource-cover-empty"><UploadOutlined /></div>
            )}
            <Space direction="vertical" size={2}>
              <Text strong>{textValue(record[config.titleField], '未命名')}</Text>
              <Text type="secondary" className="table-subtle">
                {textValue(config.subtitleField ? record[config.subtitleField] : record.id, '暂无摘要')}
              </Text>
              {Array.isArray(record.tags) && record.tags.length ? (
                <Space size={4} wrap>{record.tags.slice(0, 3).map((tag) => <Tag key={String(tag)}>{String(tag)}</Tag>)}</Space>
              ) : null}
            </Space>
          </Space>
        );
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 120,
      render: (_, record) => <Tag color={statusColor(String(record.status || ''))}>{statusLabel(record, config)}</Tag>
    },
    {
      title: activeKey === 'products' ? '价格/库存' : '排序',
      width: 140,
      render: (_, record) => (
        activeKey === 'products'
          ? <Text>{priceText(record)} · {textValue(record.stock, '0')} 件</Text>
          : <Text>{textValue(record.sort, '0')}</Text>
      )
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      width: 170,
      render: (value) => formatDate(value)
    },
    {
      title: '操作',
      width: 240,
      render: (_, record) => (
        <Space wrap>
          <Button icon={<EditOutlined />} onClick={() => setEditing({ mode: 'edit', record })}>编辑</Button>
          {record.status === config.publishStatus ? (
            <Button icon={<EyeInvisibleOutlined />} onClick={() => offlineMutation.mutate(record)}>下架</Button>
          ) : (
            <Button type="primary" onClick={() => publishMutation.mutate(record)}>发布</Button>
          )}
          <Popconfirm title="删除这条内容？" okText="删除" cancelText="取消" onConfirm={() => deleteMutation.mutate(record)}>
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ];
  const fields = config.fields.map((field) => {
    if (activeKey === 'products' && field.name === 'categoryId') {
      return {
        ...field,
        kind: 'select' as const,
        options: productCategoryOptions(categoryQuery.data),
        placeholder: categoryQuery.isLoading ? '正在加载分类' : '请选择商品分类'
      };
    }
    return field;
  });

  return (
    <Space direction="vertical" size={16} className="page-stack">
      <Tabs
        activeKey={activeKey}
        onChange={(key) => setActiveKey(key as ResourceKey)}
        items={configs.map((item) => ({ key: item.key, label: item.label }))}
      />

      <Row gutter={[16, 16]}>
        <Col xs={12} lg={6}><Card><Statistic title="内容总数" value={stats.total} /></Card></Col>
        <Col xs={12} lg={6}><Card><Statistic title="当前页已发布" value={stats.published} /></Card></Col>
        <Col xs={12} lg={6}><Card><Statistic title="当前页草稿" value={stats.draft} /></Card></Col>
        <Col xs={12} lg={6}><Card><Statistic title="当前页缺图" value={stats.missingImage} /></Card></Col>
      </Row>

      <Card>
        <Space wrap className="toolbar">
          <Input.Search
            allowClear
            placeholder={`搜索${config.label}名称或关键词`}
            className="search-box"
            onSearch={(value) => {
              setKeyword(value.trim());
              setPage(1);
            }}
          />
          <Button icon={<ReloadOutlined />} onClick={() => invalidate()}>刷新</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setEditing({ mode: 'create', record: emptyRecord(config) })}>
            新增{config.label}
          </Button>
        </Space>
      </Card>

      <Card title={`${config.label}列表`}>
        <Table
          rowKey={(record) => String(record.id)}
          loading={query.isLoading}
          columns={columns}
          dataSource={query.data?.list || []}
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
        title={editing?.mode === 'edit' ? `编辑${config.label}` : `新增${config.label}`}
        width={760}
        open={Boolean(editing)}
        destroyOnClose
        onClose={() => setEditing(null)}
        extra={<Button type="primary" loading={saveMutation.isPending} onClick={() => saveMutation.mutate()}>保存</Button>}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            {fields.map((field) => (
              <Col key={field.name} xs={24} md={field.kind === 'textarea' || field.kind === 'tags' ? 24 : 12}>
                <Form.Item
                  label={field.label}
                  name={field.name}
                  valuePropName={field.kind === 'switch' ? 'checked' : 'value'}
                  rules={field.required ? [{ required: true, message: `请填写${field.label}` }] : undefined}
                >
                  {renderField(field)}
                </Form.Item>
              </Col>
            ))}
          </Row>
        </Form>
      </Drawer>
    </Space>
  );
}
