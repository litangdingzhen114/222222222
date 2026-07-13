import {
  ArrowRightOutlined,
  CalendarOutlined,
  FileTextOutlined,
  MessageOutlined,
  PlayCircleOutlined
} from '@ant-design/icons';
import { Button, Card, Col, Descriptions, Empty, List, Row, Skeleton, Space, Statistic, Tag, Typography } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getSummary } from '../api';
import { formatDate, maskContact, statusColor, statusText } from '../utils';

const { Text } = Typography;

export function DashboardPage() {
  const { data, isLoading } = useQuery({ queryKey: ['summary'], queryFn: getSummary });

  if (isLoading) {
    return <Skeleton active paragraph={{ rows: 8 }} />;
  }

  if (!data) {
    return <Empty description="暂无总览数据" />;
  }

  const bookings = data.counts.bookings || {};
  const feedback = data.counts.feedback || {};
  const lives = data.counts.lives || {};
  const system = data.system || {};
  const workItems = [
    { title: '待确认预约', value: bookings.new || 0, unit: '条', to: '/bookings?status=new', tag: '预约' },
    { title: '处理中预约', value: bookings.processing || 0, unit: '条', to: '/bookings?status=processing', tag: '预约' },
    { title: '待处理反馈', value: feedback.new || 0, unit: '条', to: '/feedback?status=new', tag: '反馈' },
    { title: '直播自定义源', value: lives.customSources || 0, unit: '个', to: '/lives', tag: '慢直播' }
  ];

  return (
    <Space direction="vertical" size={18} className="page-stack">
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} xl={6}>
          <Card>
            <Statistic title="今日预约" value={bookings.today || 0} prefix={<CalendarOutlined />} />
            <Text type="secondary">总计 {bookings.total || 0}</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card>
            <Statistic title="待处理反馈" value={(feedback.new || 0) + (feedback.processing || 0)} prefix={<MessageOutlined />} />
            <Text type="secondary">总计 {feedback.total || 0}</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card>
            <Statistic title="AI 导游" value={system.aiProvider === 'kimi' ? 'Kimi' : '本地'} prefix={<FileTextOutlined />} />
            <Text type="secondary">{system.aiModel || '兜底回复'}</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card>
            <Statistic title="慢直播" value={lives.enabled || 0} suffix={`/ ${lives.total || 0}`} prefix={<PlayCircleOutlined />} />
            <Text type="secondary">{lives.customSources || 0} 个自定义播放源</Text>
          </Card>
        </Col>
      </Row>

      <Card title="运营待办">
        <List
          grid={{ gutter: 12, xs: 1, sm: 2, xl: 4 }}
          dataSource={workItems}
          renderItem={(item) => (
            <List.Item>
              <div className="work-item">
                <Space direction="vertical" size={8}>
                  <Tag>{item.tag}</Tag>
                  <strong>{item.title}</strong>
                  <span><b>{item.value}</b> {item.unit}</span>
                </Space>
                <Button type="text" icon={<ArrowRightOutlined />}><Link to={item.to}>处理</Link></Button>
              </div>
            </List.Item>
          )}
        />
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={14}>
          <Card
            title="最新动态"
            extra={<Button type="link"><Link to="/bookings">查看预约</Link></Button>}
          >
            <List
              locale={{ emptyText: '暂无动态' }}
              dataSource={[
                ...data.recent.bookings.map((item) => ({ type: '预约', kind: 'bookings' as const, title: item.service || '预约记录', meta: `${formatDate(item.createdAt)} · ${maskContact(item.contact)}`, status: item.status })),
                ...data.recent.feedback.map((item) => ({ type: '反馈', kind: 'feedback' as const, title: item.nickname || '游客反馈', meta: `${formatDate(item.createdAt)} · ${item.content || '-'}`, status: item.status }))
              ].slice(0, 8)}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    title={<Space><Tag>{item.type}</Tag><span>{item.title}</span><Tag color={statusColor(item.status)}>{statusText(item.status, item.kind)}</Tag></Space>}
                    description={item.meta}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} xl={10}>
          <Card title="系统状态">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="存储">{system.storageWritable ? <Tag color="green">可写</Tag> : <Tag color="red">异常</Tag>}</Descriptions.Item>
              <Descriptions.Item label="环境">{system.environment || '-'}</Descriptions.Item>
              <Descriptions.Item label="后台账号">{system.adminUser || '-'}</Descriptions.Item>
              <Descriptions.Item label="正式域名">{system.security?.publicBaseUrl || '未配置'}</Descriptions.Item>
              <Descriptions.Item label="HTTPS">{system.security?.httpsEnabled ? '已启用' : '未启用'}</Descriptions.Item>
              <Descriptions.Item label="CORS">{system.security?.corsRestricted ? '已限制' : '未限制'}</Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>
    </Space>
  );
}
