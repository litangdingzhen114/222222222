import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { App, Button, Card, Form, Input, Typography } from 'antd';
import brandLogo from '../assets/hailin-logo.png';
import loginVisual from '../assets/hailin-ricefish-hero-ai.jpg';
import { useAuth } from '../auth';

const { Title, Text } = Typography;

type LoginValues = {
  username: string;
  password: string;
};

export function LoginPage() {
  const { login } = useAuth();
  const { message } = App.useApp();
  const [form] = Form.useForm<LoginValues>();
  const showDevTokenTip = import.meta.env.DEV;

  const submit = async (values: LoginValues) => {
    try {
      await login({
        username: values.username.trim(),
        password: values.password
      });
      message.success('已进入后台');
    } catch (error) {
      message.error(error instanceof Error ? error.message : '登录失败');
    }
  };

  return (
    <main className="login-screen">
      <section className="login-shell">
        <Card className="login-card">
          <div className="login-brand">
            <img className="brand-logo large" src={brandLogo} alt="海林村文旅后台" />
            <div>
              <Title level={2}>海林村文旅后台</Title>
              <Text type="secondary">海林村数字文旅运营中心</Text>
            </div>
          </div>
          <Form form={form} layout="vertical" onFinish={submit} autoComplete="off">
            <Form.Item
              label="管理员账号"
              name="username"
              initialValue="hailin-admin"
              rules={[{ required: true, message: '请输入管理员账号' }]}
            >
              <Input size="large" prefix={<UserOutlined />} placeholder="请输入管理员账号" />
            </Form.Item>
            <Form.Item
              label="管理员密码"
              name="password"
              rules={[{ required: true, message: '请输入管理员密码' }]}
            >
              <Input.Password
                size="large"
                prefix={<LockOutlined />}
                placeholder="请输入管理员密码"
              />
            </Form.Item>
            <Button type="primary" htmlType="submit" size="large" block>
              登录后台
            </Button>
          </Form>
          {showDevTokenTip ? (
            <Text className="login-tip" type="secondary">
              开发账号由 Prisma seed 初始化，密码来自 SEED_ADMIN_PASSWORD。
            </Text>
          ) : null}
        </Card>
        <div className="login-visual-panel" aria-hidden="true">
          <img src={loginVisual} alt="" />
          <div className="login-visual-caption">
            <strong>海林村数字文旅运营中心</strong>
            <span>山水村落与游客服务的日常中枢</span>
          </div>
        </div>
      </section>
    </main>
  );
}
