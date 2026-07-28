import {
  ApiOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CloudServerOutlined,
  ExclamationCircleOutlined,
  ExperimentOutlined,
  SaveOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Col,
  Collapse,
  Descriptions,
  Form,
  Input,
  List,
  Row,
  Space,
  Statistic,
  Tag,
  Typography,
  message,
} from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getConfigStatus,
  getIntegrationConfigs,
  testIntegrationConfig,
  updateIntegrationConfig,
} from '../api';
import type { ConfigStatusItem, IntegrationConfigField, IntegrationConfigGroup } from '../types';
import { useEffect, type ReactNode } from 'react';

const { Text } = Typography;

const statusMeta: Record<
  ConfigStatusItem['status'],
  { color: string; label: string; icon: ReactNode }
> = {
  configured: { color: 'green', label: '已配置', icon: <CheckCircleOutlined /> },
  development: { color: 'blue', label: '开发模式', icon: <ApiOutlined /> },
  missing: { color: 'orange', label: '等待凭证', icon: <ExclamationCircleOutlined /> },
  abnormal: { color: 'red', label: '异常', icon: <CloseCircleOutlined /> },
};

const modeLabel: Record<ConfigStatusItem['mode'], string> = {
  official: '正式接入',
  development: '开发适配',
  degraded: '降级运行',
  waiting_credentials: '等待正式凭证',
};

function configStatusTag(item: ConfigStatusItem) {
  const meta = statusMeta[item.status];
  return (
    <Tag color={meta.color} icon={meta.icon}>
      {meta.label}
    </Tag>
  );
}

const sourceLabel: Record<IntegrationConfigField['source'], { color: string; text: string }> = {
  database: { color: 'green', text: '后台配置' },
  env: { color: 'blue', text: '环境变量' },
  none: { color: 'orange', text: '未填写' },
};

function errorText(error: unknown) {
  return error instanceof Error ? error.message : '操作失败';
}

function ConfigGroupForm({ group }: { group: IntegrationConfigGroup }) {
  const [form] = Form.useForm<Record<string, string>>();
  const queryClient = useQueryClient();

  useEffect(() => {
    form.setFieldsValue(
      Object.fromEntries(
        group.fields
          .filter((field) => !field.secret)
          .map((field) => [field.key, field.displayValue || '']),
      ),
    );
  }, [form, group]);

  const saveMutation = useMutation({
    mutationFn: (values: Record<string, string>) =>
      updateIntegrationConfig(group.service, { values }),
    onSuccess: async () => {
      message.success('配置已保存');
      form.resetFields(group.fields.filter((field) => field.secret).map((field) => field.key));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['integration-configs'] }),
        queryClient.invalidateQueries({ queryKey: ['config-status'] }),
      ]);
    },
    onError: (error) => message.error(errorText(error)),
  });

  const testMutation = useMutation({
    mutationFn: () => testIntegrationConfig(group.service),
    onSuccess: (result) => {
      if (result.ok) message.success(result.message);
      else message.warning(result.message);
    },
    onError: (error) => message.error(errorText(error)),
  });

  const clearMutation = useMutation({
    mutationFn: (key: string) =>
      updateIntegrationConfig(group.service, { values: {}, clearKeys: [key] }),
    onSuccess: async () => {
      message.success('配置项已清除');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['integration-configs'] }),
        queryClient.invalidateQueries({ queryKey: ['config-status'] }),
      ]);
    },
    onError: (error) => message.error(errorText(error)),
  });

  const submit = () => {
    const raw = form.getFieldsValue();
    const values = Object.fromEntries(
      Object.entries(raw)
        .map(([key, value]) => [key, String(value || '').trim()])
        .filter(([, value]) => value),
    );
    if (!Object.keys(values).length) {
      message.warning('请填写至少一个要保存的配置项');
      return;
    }
    saveMutation.mutate(values);
  };

  return (
    <Form form={form} layout="vertical">
      <Row gutter={[16, 0]}>
        {group.fields.map((field) => {
          const source = sourceLabel[field.source];
          const placeholder =
            field.secret && field.configured
              ? `已配置：${field.valuePreview || '******'}；留空表示不修改`
              : field.placeholder || '填写后保存';
          return (
            <Col xs={24} md={12} key={field.key}>
              <Form.Item
                name={field.key}
                label={
                  <Space wrap size={6}>
                    <span>{field.label}</span>
                    {field.required ? <Tag color="red">必填</Tag> : null}
                    <Tag color={source.color}>{source.text}</Tag>
                  </Space>
                }
                extra={
                  field.help || (field.secret ? '保存后只显示脱敏预览，不会回显明文。' : undefined)
                }
              >
                <Input.Group compact>
                  {field.secret ? (
                    <Input.Password
                      autoComplete="new-password"
                      placeholder={placeholder}
                      style={{ width: field.configured ? 'calc(100% - 72px)' : '100%' }}
                    />
                  ) : (
                    <Input
                      placeholder={placeholder}
                      style={{ width: field.configured ? 'calc(100% - 72px)' : '100%' }}
                    />
                  )}
                  {field.configured ? (
                    <Button danger onClick={() => clearMutation.mutate(field.key)}>
                      清除
                    </Button>
                  ) : null}
                </Input.Group>
              </Form.Item>
            </Col>
          );
        })}
      </Row>
      <Space wrap>
        <Button
          type="primary"
          icon={<SaveOutlined />}
          loading={saveMutation.isPending}
          onClick={submit}
        >
          保存配置
        </Button>
        <Button
          icon={<ExperimentOutlined />}
          loading={testMutation.isPending}
          onClick={() => testMutation.mutate()}
        >
          测试连接
        </Button>
        {group.updatedAt ? (
          <Text type="secondary">
            最近更新：{new Date(group.updatedAt).toLocaleString()} {group.updatedBy || ''}
          </Text>
        ) : null}
      </Space>
    </Form>
  );
}

export function SystemPage() {
  const { data, isLoading } = useQuery({ queryKey: ['config-status'], queryFn: getConfigStatus });
  const { data: integrationData, isLoading: integrationLoading } = useQuery({
    queryKey: ['integration-configs'],
    queryFn: getIntegrationConfigs,
  });
  const abnormalCount = data?.items.filter((item) => item.status === 'abnormal').length ?? 0;
  const missingCount = data?.items.filter((item) => item.status === 'missing').length ?? 0;
  const developmentCount = data?.items.filter((item) => item.status === 'development').length ?? 0;

  return (
    <Space direction="vertical" size={16} className="page-stack">
      <Row gutter={[16, 16]}>
        <Col xs={12} lg={6}>
          <Card loading={isLoading}>
            <Statistic
              title="配置项"
              value={data?.items.length || 0}
              prefix={<CloudServerOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card loading={isLoading}>
            <Statistic
              title="等待凭证"
              value={missingCount}
              prefix={<ExclamationCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card loading={isLoading}>
            <Statistic title="开发模式" value={developmentCount} prefix={<ApiOutlined />} />
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card loading={isLoading}>
            <Statistic title="异常" value={abnormalCount} prefix={<CloseCircleOutlined />} />
          </Card>
        </Col>
      </Row>

      <Card title="运行环境" loading={isLoading}>
        <Descriptions column={{ xs: 1, md: 2 }} bordered>
          <Descriptions.Item label="环境">{data?.environment || '-'}</Descriptions.Item>
          <Descriptions.Item label="对外域名">
            {data?.publicBaseUrl ? (
              <Text code>{data.publicBaseUrl}</Text>
            ) : (
              <Tag color="orange">未配置</Tag>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="接口前缀">
            <Text code>/api/v1</Text>
          </Descriptions.Item>
          <Descriptions.Item label="密钥返回策略">
            <Tag color="green" icon={<SafetyCertificateOutlined />}>
              不向前端返回第三方密钥
            </Tag>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {missingCount || developmentCount ? (
        <Alert
          showIcon
          type="warning"
          message="仍有第三方服务等待正式凭证配置"
          description="可以在下方填写正式凭证。密钥会加密保存到后端数据库，页面只展示脱敏预览；没有凭证的服务仍会保持等待配置或 fallback 状态。"
        />
      ) : null}

      <Card title="API 凭证配置" loading={integrationLoading}>
        <Alert
          showIcon
          type="info"
          message="只有超级管理员可以保存第三方凭证"
          description="后台保存的配置优先级高于服务器环境变量；清除后台配置后会自动回退到 .env。请不要在这里填写测试支付成功之类的假值。"
          style={{ marginBottom: 16 }}
        />
        <Collapse
          bordered={false}
          items={(integrationData?.groups || []).map((group) => ({
            key: group.service,
            label: (
              <Space wrap>
                <Text strong>{group.name}</Text>
                <Text type="secondary">{group.description}</Text>
              </Space>
            ),
            children: <ConfigGroupForm group={group} />,
          }))}
        />
      </Card>

      <Card title="第三方服务与基础设施">
        <List
          loading={isLoading}
          locale={{ emptyText: '暂无配置状态' }}
          dataSource={data?.items || []}
          renderItem={(item) => (
            <List.Item>
              <List.Item.Meta
                avatar={<CloudServerOutlined className="list-icon" />}
                title={
                  <Space wrap>
                    <Text strong>{item.name}</Text>
                    {configStatusTag(item)}
                    <Tag>{modeLabel[item.mode]}</Tag>
                  </Space>
                }
                description={item.message}
              />
            </List.Item>
          )}
        />
      </Card>
    </Space>
  );
}
