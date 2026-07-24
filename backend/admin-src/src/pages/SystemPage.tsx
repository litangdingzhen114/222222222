import {
  ApiOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CloudServerOutlined,
  ExclamationCircleOutlined,
  SafetyCertificateOutlined
} from '@ant-design/icons';
import { Alert, Card, Col, Descriptions, List, Row, Space, Statistic, Tag, Typography } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { getConfigStatus } from '../api';
import type { ConfigStatusItem } from '../types';
import type { ReactNode } from 'react';

const { Text } = Typography;

const statusMeta: Record<
  ConfigStatusItem['status'],
  { color: string; label: string; icon: ReactNode }
> = {
  configured: { color: 'green', label: '已配置', icon: <CheckCircleOutlined /> },
  development: { color: 'blue', label: '开发模式', icon: <ApiOutlined /> },
  missing: { color: 'orange', label: '等待凭证', icon: <ExclamationCircleOutlined /> },
  abnormal: { color: 'red', label: '异常', icon: <CloseCircleOutlined /> }
};

const modeLabel: Record<ConfigStatusItem['mode'], string> = {
  official: '正式接入',
  development: '开发适配',
  degraded: '降级运行',
  waiting_credentials: '等待正式凭证'
};

function configStatusTag(item: ConfigStatusItem) {
  const meta = statusMeta[item.status];
  return <Tag color={meta.color} icon={meta.icon}>{meta.label}</Tag>;
}

export function SystemPage() {
  const { data, isLoading } = useQuery({ queryKey: ['config-status'], queryFn: getConfigStatus });
  const abnormalCount = data?.items.filter((item) => item.status === 'abnormal').length ?? 0;
  const missingCount = data?.items.filter((item) => item.status === 'missing').length ?? 0;
  const developmentCount = data?.items.filter((item) => item.status === 'development').length ?? 0;

  return (
    <Space direction="vertical" size={16} className="page-stack">
      <Row gutter={[16, 16]}>
        <Col xs={12} lg={6}>
          <Card loading={isLoading}>
            <Statistic title="配置项" value={data?.items.length || 0} prefix={<CloudServerOutlined />} />
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card loading={isLoading}>
            <Statistic title="等待凭证" value={missingCount} prefix={<ExclamationCircleOutlined />} />
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
            {data?.publicBaseUrl ? <Text code>{data.publicBaseUrl}</Text> : <Tag color="orange">未配置</Tag>}
          </Descriptions.Item>
          <Descriptions.Item label="接口前缀">
            <Text code>/api/v1</Text>
          </Descriptions.Item>
          <Descriptions.Item label="密钥返回策略">
            <Tag color="green" icon={<SafetyCertificateOutlined />}>不向前端返回第三方密钥</Tag>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {missingCount || developmentCount ? (
        <Alert
          showIcon
          type="warning"
          message="仍有第三方服务等待正式凭证配置"
          description="当前接口适配器和环境变量结构已经预留；微信、微信支付、萤石云、高德、COS 或 LLM 未配置时，只能按开发或 fallback 模式运行。"
        />
      ) : null}

      <Card title="第三方服务与基础设施">
        <List
          loading={isLoading}
          locale={{ emptyText: '暂无配置状态' }}
          dataSource={data?.items || []}
          renderItem={(item) => (
            <List.Item>
              <List.Item.Meta
                avatar={<CloudServerOutlined className="list-icon" />}
                title={(
                  <Space wrap>
                    <Text strong>{item.name}</Text>
                    {configStatusTag(item)}
                    <Tag>{modeLabel[item.mode]}</Tag>
                  </Space>
                )}
                description={item.message}
              />
            </List.Item>
          )}
        />
      </Card>
    </Space>
  );
}
