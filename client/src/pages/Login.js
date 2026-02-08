import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { NavBar, Form, Input, Button, Toast } from 'antd-mobile';
import { authAPI } from '../services/api';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      const response = await authAPI.login(values);

      if (response?.success) {
        localStorage.setItem('token', response.data.accessToken);
        localStorage.setItem('user', JSON.stringify(response.data.user));

        Toast.show({
          icon: 'success',
          content: '登录成功'
        });

        navigate('/');
      } else {
        Toast.show({
          icon: 'fail',
          content: response?.message || '登录失败'
        });
      }
    } catch (error) {
      Toast.show({
        icon: 'fail',
        content: error.response?.data?.message || error.message || '登录失败'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <NavBar onBack={() => navigate(-1)}>登录</NavBar>

      <div className="login-card">
        <div className="login-title">易宿酒店</div>
        <div className="login-subtitle">使用账户登录后可加入购物车与下单</div>

        <Form
          layout="horizontal"
          onFinish={handleSubmit}
          footer={
            <Button
              block
              type="submit"
              color="primary"
              size="large"
              loading={loading}
              disabled={loading}
            >
              {loading ? '登录中...' : '登录'}
            </Button>
          }
        >
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="请输入用户名" clearable />
          </Form.Item>

          <Form.Item
            name="password"
            label="密码"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input type="password" placeholder="请输入密码" clearable />
          </Form.Item>
        </Form>

        <div className="login-demo">
          <div className="demo-title">演示账号</div>
          <div className="demo-item">商户：merchant / merchant123</div>
          <div className="demo-item">管理员：admin / admin123</div>
        </div>

        <div className="login-footer">
          <Link to="/" className="back-home">返回首页</Link>
        </div>
      </div>
    </div>
  );
}
