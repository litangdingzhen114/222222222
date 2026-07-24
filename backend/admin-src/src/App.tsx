import {
  AuditOutlined,
  CalendarOutlined,
  DashboardOutlined,
  EnvironmentOutlined,
  ExclamationCircleOutlined,
  HomeOutlined,
  LogoutOutlined,
  MessageOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  ShoppingCartOutlined
} from '@ant-design/icons';
import { App, Button, Card, Layout, Menu, Result, Space, Tag, Typography } from 'antd';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { getConfigStatus } from './api';
import { useAuth } from './auth';
import brandLogo from './assets/hailin-logo.png';
import { AuditPage } from './pages/AuditPage';
import { BookingsPage } from './pages/BookingsPage';
import { DashboardPage } from './pages/DashboardPage';
import { FeedbackPage } from './pages/FeedbackPage';
import { HomeContentPage } from './pages/HomeContentPage';
import { LoginPage } from './pages/LoginPage';
import { LiveContentPage } from './pages/LiveContentPage';
import { OrdersPage } from './pages/OrdersPage';
import { ResourceContentPage } from './pages/ResourceContentPage';
import { SystemPage } from './pages/SystemPage';
import type { AdminRole } from './types';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

const navItems: Array<{
  key: string;
  icon: React.ReactNode;
  label: string;
  title: string;
  subtitle: string;
  roles: AdminRole[];
}> = [
  {
    key: '/dashboard',
    icon: <DashboardOutlined />,
    label: '数据概览',
    title: '数据概览',
    subtitle: '用户、订单、预约、反馈和内容运营趋势',
    roles: ['CONTENT_OPERATOR', 'MALL_OPERATOR', 'ADMIN', 'SUPER_ADMIN']
  },
  {
    key: '/home-content',
    icon: <HomeOutlined />,
    label: '首页运营',
    title: '首页运营',
    subtitle: '轮播、入口、推荐区和首页公告',
    roles: ['CONTENT_OPERATOR', 'ADMIN', 'SUPER_ADMIN']
  },
  {
    key: '/resources',
    icon: <EnvironmentOutlined />,
    label: '内容资源',
    title: '内容资源',
    subtitle: '景点、路线、美食、地图点位与农特产内容',
    roles: ['CONTENT_OPERATOR', 'MALL_OPERATOR', 'ADMIN', 'SUPER_ADMIN']
  },
  {
    key: '/lives',
    icon: <PlayCircleOutlined />,
    label: '直播设备',
    title: '直播设备',
    subtitle: '摄像头、封面、设备状态和播放地址测试',
    roles: ['CONTENT_OPERATOR', 'ADMIN', 'SUPER_ADMIN']
  },
  {
    key: '/orders',
    icon: <ShoppingCartOutlined />,
    label: '商城订单',
    title: '商城订单',
    subtitle: '订单状态、支付状态、发货状态和售后处理',
    roles: ['MALL_OPERATOR', 'ADMIN', 'SUPER_ADMIN']
  },
  {
    key: '/bookings',
    icon: <CalendarOutlined />,
    label: '采摘预约',
    title: '采摘预约',
    subtitle: '预约项目、时段、订单确认和核销',
    roles: ['CONTENT_OPERATOR', 'ADMIN', 'SUPER_ADMIN']
  },
  {
    key: '/feedback',
    icon: <MessageOutlined />,
    label: '用户反馈',
    title: '用户反馈',
    subtitle: '游客建议、问题和运营线索',
    roles: ['CONTENT_OPERATOR', 'ADMIN', 'SUPER_ADMIN']
  },
  {
    key: '/audit',
    icon: <AuditOutlined />,
    label: '操作日志',
    title: '操作日志',
    subtitle: '管理员新增、修改、上下架、发货和回复记录',
    roles: ['ADMIN', 'SUPER_ADMIN']
  },
  {
    key: '/system',
    icon: <SafetyCertificateOutlined />,
    label: '系统设置',
    title: '系统设置',
    subtitle: '数据库、Redis、第三方凭证和生产配置状态',
    roles: ['ADMIN', 'SUPER_ADMIN']
  }
];

function canAccess(role: AdminRole | undefined, item: (typeof navItems)[number]) {
  return Boolean(role && item.roles.includes(role));
}

function useVisibleNavItems(role: AdminRole | undefined) {
  return navItems.filter((item) => canAccess(role, item));
}

function ForbiddenPage() {
  return (
    <Card>
      <Result
        status="403"
        title="无权限访问"
        subTitle="当前管理员角色没有访问该页面的权限。"
      />
    </Card>
  );
}

function NotFoundPage() {
  return (
    <Card>
      <Result
        status="404"
        title="页面不存在"
        subTitle="请从左侧菜单进入后台功能。"
        icon={<ExclamationCircleOutlined />}
      />
    </Card>
  );
}

function useRouteMeta(role: AdminRole | undefined) {
  const { pathname } = useLocation();
  const item = navItems.find((nav) => nav.key === pathname) || navItems[0];
  return canAccess(role, item) ? item : { ...item, title: '无权限访问', subtitle: '当前角色不能访问该模块' };
}

function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { admin, logout } = useAuth();
  const visibleNavItems = useVisibleNavItems(admin?.role);
  const meta = useRouteMeta(admin?.role);
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  const configQuery = useQuery({
    queryKey: ['config-status'],
    queryFn: getConfigStatus,
    refetchInterval: 30000
  });

  const abnormalCount =
    configQuery.data?.items.filter((item) => item.status === 'abnormal').length ?? 0;
  const waitingCount =
    configQuery.data?.items.filter((item) => item.status === 'missing').length ?? 0;
  const serviceOk = configQuery.isSuccess && abnormalCount === 0;
  const serviceText = configQuery.isError
    ? '连接异常'
    : serviceOk
      ? waitingCount
        ? `等待凭证 ${waitingCount} 项`
        : '服务已连接'
      : '配置异常';

  const refreshAll = async () => {
    await queryClient.invalidateQueries();
    message.success('已刷新');
  };

  return (
    <Layout className="admin-layout">
      <Sider breakpoint="lg" collapsedWidth={72} width={248} className="admin-sider">
        <div className="brand-block">
          <img className="brand-logo" src={brandLogo} alt="" />
          <div className="brand-text">
            <strong>海林村文旅后台</strong>
            <span>Hailin Admin</span>
          </div>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname === '/' ? '/dashboard' : location.pathname]}
          items={visibleNavItems.map(({ key, icon, label }) => ({ key, icon, label }))}
          onClick={({ key }) => navigate(key)}
        />
        <div className="sider-status">
          <Text className="sider-status-label">当前服务</Text>
          <Tag color={serviceOk ? 'green' : 'orange'}>{serviceText}</Tag>
        </div>
      </Sider>
      <Layout>
        <Header className="admin-header">
          <div>
            <Title level={3}>{meta.title}</Title>
            <Text type="secondary">{meta.subtitle}</Text>
          </div>
          <Space>
            <Tag color="green">{admin?.displayName || admin?.username}</Tag>
            <Tag>{admin?.role || '-'}</Tag>
            <Button icon={<ReloadOutlined />} onClick={refreshAll}>刷新</Button>
            <Button icon={<LogoutOutlined />} onClick={logout}>退出</Button>
          </Space>
        </Header>
        <Content className="admin-content">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/home-content" element={canAccess(admin?.role, navItems[1]) ? <HomeContentPage /> : <ForbiddenPage />} />
            <Route path="/resources" element={canAccess(admin?.role, navItems[2]) ? <ResourceContentPage /> : <ForbiddenPage />} />
            <Route path="/lives" element={canAccess(admin?.role, navItems[3]) ? <LiveContentPage /> : <ForbiddenPage />} />
            <Route path="/orders" element={canAccess(admin?.role, navItems[4]) ? <OrdersPage /> : <ForbiddenPage />} />
            <Route path="/bookings" element={canAccess(admin?.role, navItems[5]) ? <BookingsPage /> : <ForbiddenPage />} />
            <Route path="/feedback" element={canAccess(admin?.role, navItems[6]) ? <FeedbackPage /> : <ForbiddenPage />} />
            <Route path="/audit" element={canAccess(admin?.role, navItems[7]) ? <AuditPage /> : <ForbiddenPage />} />
            <Route path="/system" element={canAccess(admin?.role, navItems[8]) ? <SystemPage /> : <ForbiddenPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
}

export function HailinAdminApp() {
  const { token } = useAuth();
  return token ? <AdminLayout /> : <LoginPage />;
}
