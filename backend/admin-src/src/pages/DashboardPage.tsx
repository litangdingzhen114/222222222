import {
  ArrowRightOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  MessageOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
  WarningOutlined
} from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  Empty,
  List,
  Progress,
  Row,
  Skeleton,
  Space,
  Statistic,
  Table,
  Tag,
  Typography
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getDashboard } from '../api';
import type { DashboardTrendPoint } from '../types';
import { formatMoney, statusColor, statusText } from '../utils';

const { Text } = Typography;

function maxValue(values: number[]) {
  return Math.max(1, ...values);
}

export function DashboardPage() {
  const { data, isLoading } = useQuery({ queryKey: ['dashboard'], queryFn: getDashboard });

  if (isLoading) {
    return <Skeleton active paragraph={{ rows: 10 }} />;
  }

  if (!data) {
    return <Empty description="暂无总览数据" />;
  }

  const { metrics, charts } = data;
  const maxOrderAmount = maxValue(charts.trend.map((item) => item.orderAmount));
  const maxViews = maxValue(charts.popularSpots.map((item) => item.value));

  const workItems = [
    {
      title: '待处理预约',
      value: metrics.pendingReservations,
      unit: '条',
      to: '/bookings?status=PAID',
      tag: '预约'
    },
    {
      title: '待发货订单',
      value: metrics.pendingShipments,
      unit: '单',
      to: '/orders?status=PAID',
      tag: '商城'
    },
    {
      title: '待回复反馈',
      value: metrics.feedbackPending,
      unit: '条',
      to: '/feedback?status=PENDING',
      tag: '服务'
    },
    {
      title: '低库存商品',
      value: metrics.productLowStock,
      unit: '个',
      to: '/resources',
      tag: '库存'
    }
  ];

  const trendColumns: ColumnsType<DashboardTrendPoint> = [
    { title: '日期', dataIndex: 'date', width: 120 },
    { title: '新增用户', dataIndex: 'newUsers', width: 100 },
    { title: '支付订单', dataIndex: 'orderCount', width: 100 },
    {
      title: '成交金额',
      dataIndex: 'orderAmount',
      width: 160,
      render: (value: number) => formatMoney(value)
    },
    {
      title: '走势',
      dataIndex: 'orderAmount',
      render: (value: number) => (
        <Progress
          percent={Math.round((value / maxOrderAmount) * 100)}
          showInfo={false}
          strokeColor="#0f6b67"
          trailColor="#e4eeec"
        />
      )
    }
  ];

  return (
    <Space direction="vertical" size={18} className="page-stack">
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} xl={6}>
          <Card>
            <Statistic title="用户总数" value={metrics.users} prefix={<TeamOutlined />} />
            <Text type="secondary">今日新增 {metrics.todayUsers}</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card>
            <Statistic title="今日成交" value={formatMoney(metrics.todayOrderAmount)} prefix={<ShoppingCartOutlined />} />
            <Text type="secondary">{metrics.todayOrderCount} 笔支付订单</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card>
            <Statistic title="内容资源" value={metrics.scenicSpots} prefix={<EnvironmentOutlined />} />
            <Text type="secondary">活动 {metrics.activities} 场</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card>
            <Statistic title="运营待办" value={metrics.pendingReservations + metrics.pendingShipments + metrics.feedbackPending} prefix={<WarningOutlined />} />
            <Text type="secondary">库存预警 {metrics.productLowStock} 个</Text>
          </Card>
        </Col>
      </Row>

      <Card title="今日工作台">
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
                <Link to={item.to}>
                  <Button type="text" icon={<ArrowRightOutlined />}>处理</Button>
                </Link>
              </div>
            </List.Item>
          )}
        />
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={15}>
          <Card title="近七日交易与用户">
            <Table
              rowKey="date"
              dataSource={charts.trend}
              columns={trendColumns}
              size="small"
              pagination={false}
            />
          </Card>
        </Col>
        <Col xs={24} xl={9}>
          <Card title="订单状态分布">
            <List
              locale={{ emptyText: '暂无订单' }}
              dataSource={charts.orderStatusDistribution}
              renderItem={(item) => (
                <List.Item>
                  <Space>
                    <Tag color={statusColor(item.status)}>{statusText(item.status)}</Tag>
                    <Text>{item.count} 单</Text>
                  </Space>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={12}>
          <Card title="热门景点">
            <List
              locale={{ emptyText: '暂无景点浏览数据' }}
              dataSource={charts.popularSpots}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<EnvironmentOutlined className="list-icon" />}
                    title={item.name}
                    description={`浏览 ${item.value} 次`}
                  />
                  <Progress
                    type="circle"
                    size={42}
                    percent={Math.round((item.value / maxViews) * 100)}
                    showInfo={false}
                    strokeColor="#0f6b67"
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} xl={12}>
          <Card title="热销农特产">
            <List
              locale={{ emptyText: '暂无商品销量数据' }}
              dataSource={charts.hotProducts}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<ShoppingCartOutlined className="list-icon" />}
                    title={item.name}
                    description={`销量 ${item.sales} · 库存 ${item.stock}`}
                  />
                  {item.stock <= 10 ? <Tag color="orange">低库存</Tag> : <Tag color="green">正常</Tag>}
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Space wrap>
          <Tag color="green">累计成交 {formatMoney(metrics.totalOrderAmount)}</Tag>
          <Tag>累计支付订单 {metrics.totalOrderCount} 单</Tag>
          <Tag icon={<CalendarOutlined />}>预约、订单和反馈数据均来自 PostgreSQL</Tag>
        </Space>
      </Card>
    </Space>
  );
}
