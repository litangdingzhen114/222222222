import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { App, Button, Card, Col, Descriptions, Form, Input, List, Row, Space, Statistic, Tabs, Tag, Typography } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { getHomeContent, resetHomeContent, saveHomeContent } from '../api';
import type { HomeContent } from '../types';
import { formatDate } from '../utils';

const { Text } = Typography;

type CmsItem = {
  id?: string;
  title?: string;
  subtitle?: string;
  tag?: string;
  icon?: string;
  imageUrl?: string;
  buttonText?: string;
  user?: string;
};

type CmsFormValues = {
  notice?: string;
  weather?: string;
  serviceMode?: string;
  locationText?: string;
  banners?: CmsItem[];
  hotRecommends?: CmsItem[];
  feeds?: CmsItem[];
};

function homeStats(content?: HomeContent) {
  return {
    banners: content?.banners?.length || 0,
    gridItems: content?.gridPages?.reduce((total, page) => total + (page.items?.length || 0), 0) || 0,
    hotRecommends: content?.hotRecommends?.length || 0,
    feeds: content?.feeds?.length || 0
  };
}

function asCmsItems(value: unknown): CmsItem[] {
  return Array.isArray(value)
    ? value.map((item) => (item && typeof item === 'object' ? item as CmsItem : {}))
    : [];
}

function toFormValues(content?: HomeContent): CmsFormValues {
  return {
    notice: String(content?.notice || ''),
    weather: String(content?.weather || ''),
    serviceMode: String(content?.serviceMode || ''),
    locationText: String(content?.locationText || ''),
    banners: asCmsItems(content?.banners),
    hotRecommends: asCmsItems(content?.hotRecommends),
    feeds: asCmsItems(content?.feeds)
  };
}

function mergeCmsValues(base: HomeContent, values: CmsFormValues): HomeContent {
  return {
    ...base,
    notice: values.notice || '',
    weather: values.weather || '',
    serviceMode: values.serviceMode || '',
    locationText: values.locationText || '',
    banners: values.banners || [],
    hotRecommends: values.hotRecommends || [],
    feeds: values.feeds || []
  };
}

function newItem(prefix: string): CmsItem {
  return {
    id: `${prefix}-${Date.now()}`,
    title: '',
    subtitle: '',
    icon: '',
    imageUrl: ''
  };
}

export function HomeContentPage() {
  const [editorValue, setEditorValue] = useState('');
  const { message, modal } = App.useApp();
  const queryClient = useQueryClient();
  const [form] = Form.useForm<CmsFormValues>();
  const query = useQuery({ queryKey: ['home-content'], queryFn: getHomeContent });

  useEffect(() => {
    if (query.data) {
      setEditorValue(JSON.stringify(query.data.content, null, 2));
      form.setFieldsValue(toFormValues(query.data.content));
    }
  }, [form, query.data]);

  const stats = useMemo(() => query.data?.meta.stats || homeStats(query.data?.content), [query.data]);
  const previewItems = useMemo(() => {
    const content = query.data?.content || {};
    return [
      ...(content.banners || []).slice(0, 3).map((item) => ({ type: '轮播', title: String(item.title || '-'), meta: String(item.subtitle || item.tag || '-') })),
      ...(content.hotRecommends || []).slice(0, 4).map((item) => ({ type: '推荐', title: String(item.title || '-'), meta: String(item.subtitle || item.buttonText || '-') }))
    ];
  }, [query.data]);

  const parseEditor = () => {
    const parsed = JSON.parse(editorValue || '{}');
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('首页内容必须是 JSON 对象');
    }
    return parsed as HomeContent;
  };

  const saveFormMutation = useMutation({
    mutationFn: async () => {
      const values = await form.validateFields();
      return saveHomeContent(mergeCmsValues(query.data?.content || {}, values));
    },
    onSuccess: async (payload) => {
      setEditorValue(JSON.stringify(payload.content, null, 2));
      form.setFieldsValue(toFormValues(payload.content));
      message.success('首页内容已保存');
      await queryClient.invalidateQueries({ queryKey: ['home-content'] });
      await queryClient.invalidateQueries({ queryKey: ['summary'] });
    },
    onError: (error) => message.error(error instanceof Error ? error.message : '保存失败')
  });

  const saveJsonMutation = useMutation({
    mutationFn: () => saveHomeContent(parseEditor()),
    onSuccess: async (payload) => {
      setEditorValue(JSON.stringify(payload.content, null, 2));
      form.setFieldsValue(toFormValues(payload.content));
      message.success('JSON 内容已保存');
      await queryClient.invalidateQueries({ queryKey: ['home-content'] });
      await queryClient.invalidateQueries({ queryKey: ['summary'] });
    },
    onError: (error) => message.error(error instanceof Error ? error.message : '保存失败')
  });

  const resetMutation = useMutation({
    mutationFn: resetHomeContent,
    onSuccess: async (payload) => {
      setEditorValue(JSON.stringify(payload.content, null, 2));
      form.setFieldsValue(toFormValues(payload.content));
      message.success('已恢复默认首页');
      await queryClient.invalidateQueries({ queryKey: ['home-content'] });
      await queryClient.invalidateQueries({ queryKey: ['summary'] });
    }
  });

  const formatJson = () => {
    try {
      setEditorValue(JSON.stringify(parseEditor(), null, 2));
      message.success('格式化完成');
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'JSON 格式错误');
    }
  };

  const applyJsonToForm = () => {
    try {
      const parsed = parseEditor();
      form.setFieldsValue(toFormValues(parsed));
      message.success('JSON 已应用到表单');
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'JSON 格式错误');
    }
  };

  const confirmReset = () => {
    modal.confirm({
      title: '恢复默认首页内容？',
      content: '当前后台保存的首页内容会被默认内容覆盖。',
      okText: '恢复默认',
      cancelText: '取消',
      onOk: () => resetMutation.mutateAsync()
    });
  };

  return (
    <Space direction="vertical" size={16} className="page-stack">
      <Row gutter={[16, 16]}>
        <Col xs={12} lg={6}><Card><Statistic title="轮播" value={stats?.banners || 0} /></Card></Col>
        <Col xs={12} lg={6}><Card><Statistic title="入口" value={stats?.gridItems || 0} /></Card></Col>
        <Col xs={12} lg={6}><Card><Statistic title="推荐" value={stats?.hotRecommends || 0} /></Card></Col>
        <Col xs={12} lg={6}><Card><Statistic title="游记" value={stats?.feeds || 0} /></Card></Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={9}>
          <Card title="发布状态" loading={query.isLoading}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="来源">
                <Tag color={query.data?.meta.source === 'storage' ? 'green' : 'default'}>
                  {query.data?.meta.source === 'storage' ? '后台已保存' : '默认内容'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="更新时间">{formatDate(query.data?.meta.updatedAt)}</Descriptions.Item>
            </Descriptions>
            <List
              className="preview-list"
              header={<Text strong>首页重点内容</Text>}
              dataSource={previewItems}
              locale={{ emptyText: '暂无内容' }}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    title={<Space><Tag>{item.type}</Tag>{item.title}</Space>}
                    description={item.meta}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} xl={15}>
          <Card
            title="首页内容管理"
            extra={(
              <Space>
                <Button onClick={confirmReset}>恢复默认</Button>
                <Button type="primary" loading={saveFormMutation.isPending} onClick={() => saveFormMutation.mutate()}>保存表单</Button>
              </Space>
            )}
          >
            <Form
              form={form}
              layout="vertical"
              initialValues={toFormValues(query.data?.content)}
            >
              <Tabs
                items={[
                  {
                    key: 'basic',
                    label: '基础信息',
                    children: (
                      <Row gutter={16}>
                        <Col xs={24} md={12}>
                          <Form.Item label="首页公告" name="notice" rules={[{ required: true, message: '请输入首页公告' }]}>
                            <Input.TextArea rows={4} maxLength={240} showCount />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                          <Form.Item label="天气与出行提示" name="weather" rules={[{ required: true, message: '请输入天气提示' }]}>
                            <Input.TextArea rows={4} maxLength={180} showCount />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                          <Form.Item label="服务状态文案" name="serviceMode" rules={[{ required: true, message: '请输入服务状态' }]}>
                            <Input maxLength={80} showCount />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                          <Form.Item label="区位文案" name="locationText" rules={[{ required: true, message: '请输入区位文案' }]}>
                            <Input maxLength={160} showCount />
                          </Form.Item>
                        </Col>
                      </Row>
                    )
                  },
                  {
                    key: 'banners',
                    label: `轮播 ${stats?.banners || 0}`,
                    children: (
                      <EditableList
                        name="banners"
                        addLabel="新增轮播"
                        createItem={() => ({ ...newItem('banner'), tag: '', subtitle: '' })}
                        fields={[
                          { name: 'title', label: '标题', required: true },
                          { name: 'subtitle', label: '副标题' },
                          { name: 'tag', label: '标签' },
                          { name: 'icon', label: '图标字' },
                          { name: 'imageUrl', label: '图片路径' }
                        ]}
                      />
                    )
                  },
                  {
                    key: 'hot',
                    label: `热门推荐 ${stats?.hotRecommends || 0}`,
                    children: (
                      <EditableList
                        name="hotRecommends"
                        addLabel="新增推荐"
                        createItem={() => ({ ...newItem('recommend'), buttonText: '了解更多' })}
                        fields={[
                          { name: 'title', label: '标题', required: true },
                          { name: 'subtitle', label: '说明' },
                          { name: 'buttonText', label: '按钮文案' },
                          { name: 'icon', label: '图标字' },
                          { name: 'imageUrl', label: '图片路径' }
                        ]}
                      />
                    )
                  },
                  {
                    key: 'feeds',
                    label: `游记流 ${stats?.feeds || 0}`,
                    children: (
                      <EditableList
                        name="feeds"
                        addLabel="新增游记"
                        createItem={() => ({ ...newItem('feed'), user: '运营编辑' })}
                        fields={[
                          { name: 'title', label: '标题', required: true },
                          { name: 'user', label: '作者' },
                          { name: 'icon', label: '图标字' },
                          { name: 'imageUrl', label: '图片路径' }
                        ]}
                      />
                    )
                  },
                  {
                    key: 'json',
                    label: '高级 JSON',
                    children: (
                      <Space direction="vertical" className="page-stack" size={12}>
                        <Space wrap>
                          <Button onClick={formatJson}>格式化</Button>
                          <Button onClick={applyJsonToForm}>应用到表单</Button>
                          <Button type="primary" loading={saveJsonMutation.isPending} onClick={() => saveJsonMutation.mutate()}>保存 JSON</Button>
                        </Space>
                        <Input.TextArea
                          className="json-editor"
                          value={editorValue}
                          onChange={(event) => setEditorValue(event.target.value)}
                          autoSize={{ minRows: 26, maxRows: 42 }}
                          spellCheck={false}
                        />
                      </Space>
                    )
                  }
                ]}
              />
            </Form>
          </Card>
        </Col>
      </Row>
    </Space>
  );
}

type EditableListProps = {
  name: 'banners' | 'hotRecommends' | 'feeds';
  addLabel: string;
  createItem: () => CmsItem;
  fields: Array<{
    name: keyof CmsItem;
    label: string;
    required?: boolean;
  }>;
};

function EditableList({ name, addLabel, createItem, fields }: EditableListProps) {
  return (
    <Form.List name={name}>
      {(items, { add, remove }) => (
        <Space direction="vertical" size={14} className="page-stack">
          {items.map((item, index) => (
            <Card
              key={item.key}
              size="small"
              title={`${addLabel.replace('新增', '')} ${index + 1}`}
              extra={<Button danger icon={<DeleteOutlined />} onClick={() => remove(item.name)}>删除</Button>}
            >
              <Row gutter={14}>
                <Col xs={24} md={8}>
                  <Form.Item label="ID" name={[item.name, 'id']} rules={[{ required: true, message: '请输入 ID' }]}>
                    <Input placeholder="唯一标识" />
                  </Form.Item>
                </Col>
                {fields.map((field) => (
                  <Col xs={24} md={field.name === 'imageUrl' ? 16 : 8} key={String(field.name)}>
                    <Form.Item
                      label={field.label}
                      name={[item.name, field.name]}
                      rules={field.required ? [{ required: true, message: `请输入${field.label}` }] : undefined}
                    >
                      <Input />
                    </Form.Item>
                  </Col>
                ))}
              </Row>
            </Card>
          ))}
          <Button type="dashed" icon={<PlusOutlined />} onClick={() => add(createItem())} block>
            {addLabel}
          </Button>
        </Space>
      )}
    </Form.List>
  );
}
