import {
  AuditOutlined,
  CalendarOutlined,
  DashboardOutlined,
  EnvironmentOutlined,
  HomeOutlined,
  LogoutOutlined,
  MessageOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined
} from '@ant-design/icons';
import { App, Button, Layout, Menu, Space, Tag, Typography } from 'antd';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { getSummary } from './api';
import { useAuth } from './auth';
import brandLogo from './assets/hailin-logo.png';
import { AuditPage } from './pages/AuditPage';
import { BookingsPage } from './pages/BookingsPage';
import { DashboardPage } from './pages/DashboardPage';
import { FeedbackPage } from './pages/FeedbackPage';
import { HomeContentPage } from './pages/HomeContentPage';
import { LoginPage } from './pages/LoginPage';
import { LiveContentPage } from './pages/LiveContentPage';
import { ResourceContentPage } from './pages/ResourceContentPage';
import { SystemPage } from './pages/SystemPage';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

const navItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: '总览', title: '运营总览', subtitle: '预约、反馈、AI 导游与慢直播服务状态' },
  { key: '/home-content', icon: <HomeOutlined />, label: '首页内容', title: '首页内容', subtitle: '轮播、入口、推荐区和首页公告' },
  { key: '/resources', icon: <EnvironmentOutlined />, label: '内容资源', title: '内容资源', subtitle: '景点、路线、美食、地图点位与文创商品' },
  { key: '/lives', icon: <PlayCircleOutlined />, label: '慢直播管理', title: '慢直播管理', subtitle: '直播点位、播放源、启停状态与排序' },
  { key: '/bookings', icon: <CalendarOutlined />, label: '预约管理', title: '预约管理', subtitle: '讲解、活动、团建与服务预约' },
  { key: '/feedback', icon: <MessageOutlined />, label: '反馈处理', title: '反馈处理', subtitle: '游客建议、问题和运营线索' },
  { key: '/audit', icon: <AuditOutlined />, label: '操作审计', title: '操作审计', subtitle: '记录预约、反馈、导出、备份和后台处理动作' },
  { key: '/system', icon: <SafetyCertificateOutlined />, label: '系统健康', title: '系统健康', subtitle: '生产配置、存储、安全与运行状态' }
];

function useRouteMeta() {
  const { pathname } = useLocation();
  return navItems.find((item) => item.key === pathname) || navItems[0];
}

function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const meta = useRouteMeta();
  const { logout } = useAuth();
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  const summaryQuery = useQuery({
    queryKey: ['summary'],
    queryFn: getSummary,
    refetchInterval: 30000
  });

  const serviceOk = Boolean(summaryQuery.data?.system.storageWritable);
  const serviceText = serviceOk ? '真实服务已连接' : summaryQuery.isError ? '连接异常' : '正在连接';

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
          items={navItems.map(({ key, icon, label }) => ({ key, icon, label }))}
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
            <Button icon={<ReloadOutlined />} onClick={refreshAll}>刷新</Button>
            <Button icon={<LogoutOutlined />} onClick={logout}>退出</Button>
          </Space>
        </Header>
        <Content className="admin-content">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/home-content" element={<HomeContentPage />} />
            <Route path="/resources" element={<ResourceContentPage />} />
            <Route path="/lives" element={<LiveContentPage />} />
            <Route path="/bookings" element={<BookingsPage />} />
            <Route path="/feedback" element={<FeedbackPage />} />
            <Route path="/audit" element={<AuditPage />} />
            <Route path="/system" element={<SystemPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
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
