import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, Tabs, message, Radio } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');

  const onLogin = async (values) => {
    try {
      setLoading(true);
      await login(values.username, values.password);
      message.success('登录成功');
      navigate('/');
    } catch (error) {
      message.error(error.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  const onRegister = async (values) => {
    try {
      setLoading(true);
      await register(values);
      message.success('注册成功');
      navigate('/');
    } catch (error) {
      message.error(error.message || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  const loginForm = (
    <Form onFinish={onLogin} autoComplete="off">
      <Form.Item
        name="username"
        rules={[{ required: true, message: '请输入用户名' }]}
      >
        <Input prefix={<UserOutlined />} placeholder="用户名" size="large" />
      </Form.Item>
      
      <Form.Item
        name="password"
        rules={[{ required: true, message: '请输入密码' }]}
      >
        <Input.Password prefix={<LockOutlined />} placeholder="密码" size="large" />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading} size="large" block>
          登录
        </Button>
      </Form.Item>
    </Form>
  );

  const registerForm = (
    <Form onFinish={onRegister} autoComplete="off">
      <Form.Item
        name="username"
        rules={[{ required: true, message: '请输入用户名' }]}
      >
        <Input prefix={<UserOutlined />} placeholder="用户名" size="large" />
      </Form.Item>

      <Form.Item
        name="email"
        rules={[
          { required: true, message: '请输入邮箱' },
          { type: 'email', message: '请输入有效的邮箱地址' }
        ]}
      >
        <Input prefix={<MailOutlined />} placeholder="邮箱" size="large" />
      </Form.Item>
      
      <Form.Item
        name="password"
        rules={[{ required: true, message: '请输入密码', min: 6 }]}
      >
        <Input.Password prefix={<LockOutlined />} placeholder="密码（至少6位）" size="large" />
      </Form.Item>

      <Form.Item
        name="role"
        rules={[{ required: true, message: '请选择角色' }]}
        initialValue="merchant"
      >
        <Radio.Group>
          <Radio value="merchant">商户</Radio>
          <Radio value="admin">管理员</Radio>
        </Radio.Group>
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading} size="large" block>
          注册
        </Button>
      </Form.Item>
    </Form>
  );

  return (
    <div className="login-container">
      <Card className="login-card" title="易宿酒店管理平台">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            { key: 'login', label: '登录', children: loginForm },
            { key: 'register', label: '注册', children: registerForm }
          ]}
        />
      </Card>
    </div>
  );
};

export default Login;
