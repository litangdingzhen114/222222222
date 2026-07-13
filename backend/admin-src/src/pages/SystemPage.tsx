import { App, Button, Card, Col, Descriptions, Row, Space, Tag, Typography } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { fetchBackupBlob, fetchExportBlob, getSummary } from '../api';
import { downloadBlob } from '../utils';

const { Text } = Typography;

function boolTag(ok?: boolean, good = '正常', bad = '异常') {
  return ok ? <Tag color="green">{good}</Tag> : <Tag color="red">{bad}</Tag>;
}

export function SystemPage() {
  const { message } = App.useApp();
  const { data, isLoading } = useQuery({ queryKey: ['summary'], queryFn: getSummary });
  const system = data?.system || {};
  const security = system.security || {};

  const exportBookings = async () => {
    const blob = await fetchExportBlob('bookings');
    downloadBlob(blob, 'hailin-bookings.csv');
    message.success('预约 CSV 已导出');
  };

  const exportFeedback = async () => {
    const blob = await fetchExportBlob('feedback');
    downloadBlob(blob, 'hailin-feedback.csv');
    message.success('反馈 CSV 已导出');
  };

  const exportBackup = async () => {
    const blob = await fetchBackupBlob();
    downloadBlob(blob, `hailin-backup-${new Date().toISOString().slice(0, 10)}.json`);
    message.success('完整备份已下载');
  };

  return (
    <Space direction="vertical" size={16} className="page-stack">
      <Row gutter={[16, 16]}>
        <Col xs={24} xl={14}>
          <Card title="运行状态" loading={isLoading}>
            <Descriptions column={1} bordered>
              <Descriptions.Item label="存储">{boolTag(system.storageWritable, '可写', '不可写')}</Descriptions.Item>
              <Descriptions.Item label="运行环境">{system.environment || '-'}</Descriptions.Item>
              <Descriptions.Item label="运行时长">{Math.floor((system.uptimeSeconds || 0) / 60)} 分钟</Descriptions.Item>
              <Descriptions.Item label="后台账号">{system.adminUser || '-'}</Descriptions.Item>
              <Descriptions.Item label="AI Provider">{system.aiProvider === 'kimi' ? 'Kimi' : '本地兜底'}</Descriptions.Item>
              <Descriptions.Item label="AI Model">{system.aiModel || '-'}</Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
        <Col xs={24} xl={10}>
          <Card title="上线安全检查" loading={isLoading}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="正式域名">
                {security.publicBaseUrl ? <Text code>{security.publicBaseUrl}</Text> : <Tag color="orange">未配置</Tag>}
              </Descriptions.Item>
              <Descriptions.Item label="HTTPS">{boolTag(security.httpsEnabled, '已启用', '未启用')}</Descriptions.Item>
              <Descriptions.Item label="后台 Token">{boolTag(security.adminTokenConfigured, '已配置', '未配置')}</Descriptions.Item>
              <Descriptions.Item label="CORS">{security.corsRestricted ? <Tag color="green">已限制</Tag> : <Tag color="orange">未限制</Tag>}</Descriptions.Item>
              <Descriptions.Item label="允许来源">{security.allowedOrigins?.length ? security.allowedOrigins.join(', ') : '-'}</Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>

      <Card title="数据导出与备份">
        <Space wrap>
          <Button onClick={exportBookings}>导出预约 CSV</Button>
          <Button onClick={exportFeedback}>导出反馈 CSV</Button>
          <Button type="primary" onClick={exportBackup}>下载完整备份 JSON</Button>
        </Space>
      </Card>
    </Space>
  );
}
