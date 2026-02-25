import { View, Input, Button, Text, Picker } from '@tarojs/components'
import { useState } from 'react'
import Taro, { useLoad } from '@tarojs/taro'
import { authAPI } from '../../services/api'
import './index.scss'

export default function Register() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState('merchant')
  const [loading, setLoading] = useState(false)

  useLoad(() => {
    // 检查是否已登录
    const token = Taro.getStorageSync('user_token')
    if (token) {
      Taro.redirectTo({ url: '/pages/index/index' })
    }
  })

  const handleRegister = async () => {
    if (!username || !email || !password || !confirmPassword) {
      Taro.showToast({
        title: '请填写所有字段',
        icon: 'none'
      })
      return
    }

    if (password !== confirmPassword) {
      Taro.showToast({
        title: '两次密码输入不一致',
        icon: 'none'
      })
      return
    }

    if (password.length < 6) {
      Taro.showToast({
        title: '密码长度至少6位',
        icon: 'none'
      })
      return
    }

    setLoading(true)
    try {
      const response = await authAPI.register({
        username,
        email,
        password,
        role
      })

      if (response.success) {
        Taro.showToast({
          title: '注册成功',
          icon: 'success'
        })

        setTimeout(() => {
          Taro.navigateTo({ url: '/pages/login/index' })
        }, 1000)
      }
    } catch (error: any) {
      Taro.showToast({
        title: error.message || '注册失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    Taro.navigateBack()
  }

  const roleOptions = [
    { label: '商户', value: 'merchant' },
    { label: '普通用户', value: 'user' }
  ]

  return (
    <View className='register-page'>
      <View className='register-container'>
        <View className='header'>
          <Button className='back-btn' onClick={handleBack}>
            ← 返回
          </Button>
          <Text className='title'>注册账户</Text>
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
            <Text className='label'>邮箱</Text>
            <Input
              type='text'
              placeholder='请输入邮箱地址'
              value={email}
              onInput={(e) => setEmail(e.detail.value)}
              className='input'
            />
          </View>

          <View className='form-group'>
            <Text className='label'>密码</Text>
            <Input
              type='password'
              placeholder='至少6位'
              value={password}
              onInput={(e) => setPassword(e.detail.value)}
              className='input'
            />
          </View>

          <View className='form-group'>
            <Text className='label'>确认密码</Text>
            <Input
              type='password'
              placeholder='再次输入密码'
              value={confirmPassword}
              onInput={(e) => setConfirmPassword(e.detail.value)}
              className='input'
            />
          </View>

          <View className='form-group'>
            <Text className='label'>身份</Text>
            <Picker
              mode='selector'
              value={role === 'merchant' ? 0 : 1}
              onChange={(e) => setRole(roleOptions[e.detail.value as number].value)}
            >
              <View className='picker'>
                {(roleOptions.find((r) => r.value === role) || { label: '' }).label}
              </View>
            </Picker>
          </View>

          <Button
            className='register-btn'
            onClick={handleRegister}
            loading={loading}
            disabled={loading}
          >
            {loading ? '注册中...' : '注册'}
          </Button>
        </View>

        <View className='tips'>
          <Text className='tip-item'>• 用户名不能重复</Text>
          <Text className='tip-item'>• 密码至少6位</Text>
          <Text className='tip-item'>• 商户可以管理酒店信息</Text>
        </View>
      </View>
    </View>
  )
}
