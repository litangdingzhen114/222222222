import { CodeOutlined, PlusOutlined, ReloadOutlined, SaveOutlined } from '@ant-design/icons';
import { App, Button, Card, Col, Descriptions, Input, Row, Space, Statistic, Table, Tabs, Tag, Typography } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { getResourceContent, listResourceContent, resetResourceContent, saveResourceContent } from '../api';
import type { ResourceContentEnvelope, ResourceContentItem, ResourceKey } from '../types';
import { formatDate } from '../utils';

const { Text } = Typography;

const resourceTabs: Array<{ key: ResourceKey; label: string }> = [
  { key: 'spots', label: '景点' },
  { key: 'routes', label: '路线' },
  { key: 'foods', label: '美食' },
  { key: 'map-points', label: '地图点位' },
  { key: 'products', label: '文创商品' }
];

function asText(value: unknown, fallback = '-') {
  if (value == null || value === '') return fallback;
  if (Array.isArray(value)) return value.map((item) => asText(item, '')).filter(Boolean).join('、') || fallback;
  if (typeof value === 'object') return fallback;
  return String(value);
}

function ellipsis(value: unknown, length = 72) {
  const text = asText(value, '');
  return text.length > length ? `${text.slice(0, length)}...` : text;
}

function itemTitle(item: ResourceContentItem) {
  return asText(item.name || item.title || item.id, '未命名');
}

function itemSubtitle(item: ResourceContentItem) {
  return ellipsis(item.subtitle || item.desc || item.reason || item.tips || item.price || '', 88);
}

function hasImage(item: ResourceContentItem) {
  return Boolean(item.imageUrl || item.coverUrl || (Array.isArray(item.imageUrls) && item.imageUrls.length));
}

function hasTarget(item: ResourceContentItem) {
  return Boolean(item.targetUrl || item.bookingUrl || item.refId);
}

function isHidden(item: ResourceContentItem) {
  return item.enabled === false || item.status === 'disabled';
}

function templateFor(key: ResourceKey): ResourceContentItem {
  const stamp = Date.now();
  const baseId = `${key}-${stamp}`;
  if (key === 'map-points') {
    return {
      id: Number(String(stamp).slice(-6)),
      title: '新增地图点位',
      type: '景点',
      subType: '核心景区',
      distance: '0.1公里',
      desc: '',
      openTime: '全天开放',
      tips: '',
      actionText: '查看详情',
      latitude: 28.2136,
      longitude: 120.2184,
      refType: 'spot',
      refId: ''
    };
  }
  if (key === 'routes') {
    return {
      id: baseId,
      name: '新增路线',
      subtitle: '',
      reason: '',
      duration: '约 2 小时',
      audience: '',
      cost: '',
      imageUrl: '',
      timeline: [],
      included: [],
      prepares: [],
      bookingUrl: '/pages/mine-feature/mine-feature?id=tour'
    };
  }
  if (key === 'foods') {
    return {
      id: baseId,
      name: '新增美食',
      perCapita: '',
      distance: '',
      desc: '',
      tags: [],
      icon: '食',
      imageUrl: ''
    };
  }
  if (key === 'products') {
    return {
      id: baseId,
      title: '新增文创商品',
      price: '',
      icon: '物',
      imageUrl: ''
    };
  }
  return {
    id: baseId,
    name: '新增景点',
    category: '自然风光',
    tags: [],
    openTime: '全天开放',
    duration: '',
    distance: '',
    desc: '',
    coverUrl: '',
    imageUrls: [],
    highlights: [],
    visitTips: [],
    services: []
  };
}

function parseItems(editorValue: string) {
  const parsed = JSON.parse(editorValue || '[]');
  if (!Array.isArray(parsed)) throw new Error('资源内容必须是 JSON 数组');
  return parsed as ResourceContentItem[];
}

export function ResourceContentPage() {
  const [activeKey, setActiveKey] = useState<ResourceKey>('spots');
  const [editorValue, setEditorValue] = useState('[]');
  const { message, modal } = App.useApp();
  const queryClient = useQueryClient();

  const indexQuery = useQuery({ queryKey: ['resources'], queryFn: listResourceContent });
  const detailQuery = useQuery({
    queryKey: ['resource-content', activeKey],
    queryFn: () => getResourceContent(activeKey)
  });

  useEffect(() => {
    if (detailQuery.data) {
      setEditorValue(JSON.stringify(detailQuery.data.items, null, 2));
    }
  }, [detailQuery.data]);

  const activeSummary = useMemo(
    () => indexQuery.data?.items.find((item) => item.key === activeKey),
    [activeKey, indexQuery.data]
  );
  const envelope = detailQuery.data;
  const items = envelope?.items || [];
  const stats = envelope?.meta.stats || activeSummary?.meta.stats || {};

  const saveMutation = useMutation({
    mutationFn: () => saveResourceContent(activeKey, parseItems(editorValue)),
    onSuccess: async (payload: ResourceContentEnvelope) => {
      setEditorValue(JSON.stringify(payload.items, null, 2));
      message.success('资源内容已保存');
      await queryClient.invalidateQueries({ queryKey: ['resource-content', activeKey] });
      await queryClient.invalidateQueries({ queryKey: ['resources'] });
      await queryClient.invalidateQueries({ queryKey: ['summary'] });
    },
    onError: (error) => message.error(error instanceof Error ? error.message : '保存失败')
  });

  const resetMutation = useMutation({
    mutationFn: () => resetResourceContent(activeKey),
    onSuccess: async (payload: ResourceContentEnvelope) => {
      setEditorValue(JSON.stringify(payload.items, null, 2));
      message.success('已恢复默认内容');
      await queryClient.invalidateQueries({ queryKey: ['resource-content', activeKey] });
      await queryClient.invalidateQueries({ queryKey: ['resources'] });
      await queryClient.invalidateQueries({ queryKey: ['summary'] });
    },
    onError: (error) => message.error(error instanceof Error ? error.message : '恢复失败')
  });

  const formatJson = () => {
    try {
      setEditorValue(JSON.stringify(parseItems(editorValue), null, 2));
      message.success('格式化完成');
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'JSON 格式错误');
    }
  };

  const addTemplate = () => {
    try {
      const nextItems = [templateFor(activeKey), ...parseItems(editorValue)];
      setEditorValue(JSON.stringify(nextItems, null, 2));
      message.success('已新增一条内容');
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'JSON 格式错误');
    }
  };

  const confirmReset = () => {
    modal.confirm({
      title: `恢复默认${envelope?.label || activeSummary?.label || ''}？`,
      content: '当前后台保存的资源内容会被默认内容覆盖。',
      okText: '恢复默认',
      cancelText: '取消',
      onOk: () => resetMutation.mutateAsync()
    });
  };

  return (
    <Space direction="vertical" size={16} className="page-stack">
      <Tabs
        activeKey={activeKey}
        onChange={(key) => setActiveKey(key as ResourceKey)}
        items={resourceTabs.map((item) => ({
          key: item.key,
          label: item.label
        }))}
      />

      <Row gutter={[16, 16]}>
        <Col xs={12} lg={6}><Card><Statistic title="内容总数" value={stats.total || 0} /></Card></Col>
        <Col xs={12} lg={6}><Card><Statistic title="含图片" value={stats.withImage || 0} /></Card></Col>
        <Col xs={12} lg={6}><Card><Statistic title="可跳转" value={stats.withTarget || 0} /></Card></Col>
        <Col xs={12} lg={6}><Card><Statistic title="已隐藏" value={stats.hidden || 0} /></Card></Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={14}>
          <Card
            title={`${envelope?.label || activeSummary?.label || ''}列表`}
            loading={detailQuery.isLoading}
            extra={(
              <Space>
                <Tag color={envelope?.meta.source === 'storage' ? 'green' : 'default'}>
                  {envelope?.meta.source === 'storage' ? '后台已保存' : '默认内容'}
                </Tag>
              </Space>
            )}
          >
            <Descriptions column={{ xs: 1, md: 3 }} size="small" className="resource-descriptions">
              <Descriptions.Item label="更新时间">{formatDate(envelope?.meta.updatedAt)}</Descriptions.Item>
              <Descriptions.Item label="更新人">{envelope?.meta.updatedBy || '-'}</Descriptions.Item>
              <Descriptions.Item label="上限">{envelope?.limit || activeSummary?.limit || '-'}</Descriptions.Item>
            </Descriptions>
            <Table<ResourceContentItem>
              rowKey={(record, index) => String(record.id ?? index)}
              dataSource={items}
              pagination={{ pageSize: 8 }}
              size="small"
              columns={[
                {
                  title: '内容',
                  render: (_, record) => (
                    <Space direction="vertical" size={0}>
                      <Text strong>{itemTitle(record)}</Text>
                      <span className="table-subtle">{itemSubtitle(record)}</span>
                    </Space>
                  )
                },
                {
                  title: '分类',
                  width: 130,
                  render: (_, record) => asText(record.category || record.type || record.subType)
                },
                {
                  title: '素材',
                  width: 90,
                  render: (_, record) => <Tag color={hasImage(record) ? 'green' : 'default'}>{hasImage(record) ? '有图' : '无图'}</Tag>
                },
                {
                  title: '跳转',
                  width: 90,
                  render: (_, record) => <Tag color={hasTarget(record) ? 'blue' : 'default'}>{hasTarget(record) ? '已配' : '无'}</Tag>
                },
                {
                  title: '状态',
                  width: 90,
                  render: (_, record) => <Tag color={isHidden(record) ? 'default' : 'green'}>{isHidden(record) ? '隐藏' : '启用'}</Tag>
                }
              ]}
            />
          </Card>
        </Col>

        <Col xs={24} xl={10}>
          <Card
            title="JSON 编辑"
            extra={(
              <Space wrap>
                <Button icon={<PlusOutlined />} onClick={addTemplate}>新增</Button>
                <Button icon={<CodeOutlined />} onClick={formatJson}>格式化</Button>
                <Button icon={<ReloadOutlined />} onClick={confirmReset}>恢复默认</Button>
                <Button type="primary" icon={<SaveOutlined />} loading={saveMutation.isPending} onClick={() => saveMutation.mutate()}>保存</Button>
              </Space>
            )}
          >
            <Input.TextArea
              className="json-editor resource-json-editor"
              value={editorValue}
              onChange={(event) => setEditorValue(event.target.value)}
              autoSize={{ minRows: 24, maxRows: 40 }}
              spellCheck={false}
            />
          </Card>
        </Col>
      </Row>
    </Space>
  );
}
