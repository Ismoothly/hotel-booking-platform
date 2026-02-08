import { View, Input, Button, Text } from '@tarojs/components'
import { useState } from 'react'
import Taro, { useLoad } from '@tarojs/taro'
import { authAPI } from '../../services/api'
import './index.scss'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  useLoad(() => {
    // 检查是否已登录
    const token = Taro.getStorageSync('user_token')
    if (token) {
      Taro.switchTab({ url: '/pages/index/index' })
    }
  })

  const handleLogin = async () => {
    if (!username || !password) {
      Taro.showToast({
        title: '请输入用户名和密码',
        icon: 'none'
      })
      return
    }

    setLoading(true)
    try {
      const response = await authAPI.login(username, password)
      if (response.success) {
        // 保存 token 和用户信息
        Taro.setStorageSync('user_token', response.data.accessToken)
        Taro.setStorageSync('user_info', response.data.user)
        
        Taro.showToast({
          title: '登录成功',
          icon: 'success'
        })

        // 延迟跳转到首页
        setTimeout(() => {
          Taro.switchTab({ url: '/pages/index/index' })
        }, 1000)
      }
    } catch (error: any) {
      Taro.showToast({
        title: error.message || '登录失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = () => {
    Taro.navigateTo({ url: '/pages/register/index' })
  }

  return (
    <View className='login-page'>
      <View className='login-container'>
        <View className='logo-section'>
          <Text className='logo'>🏨</Text>
          <Text className='title'>易宿酒店</Text>
        </View>

        <View className='form-section'>
          <View className='form-group'>
            <Text className='label'>用户名</Text>
            <Input
              type='text'
              placeholder='请输入用户名'
              value={username}
              onInput={(e) => setUsername(e.detail.value)}
              className='input'
            />
          </View>

          <View className='form-group'>
            <Text className='label'>密码</Text>
            <Input
              type='password'
              placeholder='请输入密码'
              value={password}
              onInput={(e) => setPassword(e.detail.value)}
              className='input'
            />
          </View>

          <Button
            className='login-btn'
            onClick={handleLogin}
            loading={loading}
            disabled={loading}
          >
            {loading ? '登录中...' : '登录'}
          </Button>

          <View className='divider'>
            <Text>或</Text>
          </View>

          <Button className='register-btn' onClick={handleRegister}>
            注册新账户
          </Button>
        </View>

        <View className='demo-account'>
          <Text className='demo-title'>演示账号：</Text>
          <Text className='demo-item'>商户：merchant / merchant123</Text>
          <Text className='demo-item'>管理员：admin / admin123</Text>
        </View>
      </View>
    </View>
  )
}
