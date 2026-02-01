import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout, Menu, Button, Avatar, Dropdown } from 'antd';
import {
  HomeOutlined,
  BuildOutlined,  // 替换 HotelOutlined
  UserOutlined,
  LogoutOutlined
} from '@ant-design/icons';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import HotelManagement from './pages/HotelManagement';
import './App.css';

const { Header, Sider, Content } = Layout;

const AppLayout = ({ children }) => {
  const { user, logout } = useAuth();

  const menuItems = [
  {
    key: '/',
    icon: <HomeOutlined />,
    label: '首页'
  },
  {
    key: '/hotels',
    icon: <BuildOutlined />,  // 替换 HotelOutlined
    label: user?.role === 'admin' ? '酒店审核' : '酒店管理'
  }
];

  const userMenu = {
    items: [
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: '退出登录',
        onClick: logout
      }
    ]
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ color: '#fff', fontSize: 20, fontWeight: 'bold' }}>
          易宿酒店管理平台
        </div>
        <Dropdown menu={userMenu} placement="bottomRight">
          <div style={{ cursor: 'pointer', color: '#fff' }}>
            <Avatar icon={<UserOutlined />} style={{ marginRight: 8 }} />
            {user?.username}
          </div>
        </Dropdown>
      </Header>
      <Layout>
        <Sider width={200} theme="light">
          <Menu
            mode="inline"
            defaultSelectedKeys={['/']}
            items={menuItems}
          />
        </Sider>
        <Layout style={{ padding: '24px' }}>
          <Content
            style={{
              background: '#fff',
              padding: 24,
              margin: 0,
              minHeight: 280,
            }}
          >
            {children}
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return <AppLayout>{children}</AppLayout>;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <HotelManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hotels"
            element={
              <ProtectedRoute>
                <HotelManagement />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
