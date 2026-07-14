import { LockOutlined } from '@ant-design/icons';
import { App, Button, Card, Form, Input, Typography } from 'antd';
import { getSession } from '../api';
import brandLogo from '../assets/hailin-logo.png';
import loginVisual from '../assets/hailin-ricefish-hero-ai.jpg';
import { useAuth } from '../auth';

const { Title, Text } = Typography;

type LoginValues = {
  token: string;
};

export function LoginPage() {
  const { login } = useAuth();
  const { message } = App.useApp();
  const [form] = Form.useForm<LoginValues>();
  const showDevTokenTip = import.meta.env.DEV;

  const submit = async (values: LoginValues) => {
    const token = values.token.trim();
    login(token);
    try {
      await getSession();
      message.success('已进入后台');
    } catch (error) {
      login('');
      message.error(error instanceof Error ? error.message : 'Token 无效');
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
              label="管理 Token"
              name="token"
              rules={[{ required: true, message: '请输入 ADMIN_TOKEN' }]}
            >
              <Input.Password
                size="large"
                prefix={<LockOutlined />}
                placeholder="输入 ADMIN_TOKEN"
              />
            </Form.Item>
            <Button type="primary" htmlType="submit" size="large" block>
              进入后台
            </Button>
          </Form>
          {showDevTokenTip ? (
            <Text className="login-tip" type="secondary">
              本地开发默认 Token：hailin-admin-dev-token
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
