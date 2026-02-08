import { View, Button, Text } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro, { useDidShow, useLoad } from '@tarojs/taro'
import './index.scss'

interface UserInfo {
  id: string
  username: string
  email: string
  role: string
}

export default function User() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)

  useLoad(() => {
    loadUserInfo()
  })

  useDidShow(() => {
    loadUserInfo()
  })

  const loadUserInfo = () => {
    const userStr = Taro.getStorageSync('user_info')
    if (userStr) {
      try {
        const user = typeof userStr === 'string' ? JSON.parse(userStr) : userStr
        setUserInfo(user)
      } catch (e) {
        console.error('Failed to parse user info')
      }
    }
  }

  const handleLogout = () => {
    Taro.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          Taro.removeStorageSync('user_token')
          Taro.removeStorageSync('user_info')
          Taro.redirectTo({ url: '/pages/login/index' })
        }
      }
    })
  }

  if (!userInfo) {
    return (
      <View className='user-page'>
        <View className='not-login'>
          <Text className='empty-text'>未登录</Text>
          <Button
            className='login-btn'
            onClick={() => Taro.navigateTo({ url: '/pages/login/index' })}
          >
            去登录
          </Button>
        </View>
      </View>
    )
  }

  const roleLabel = userInfo.role === 'admin' ? '管理员' : userInfo.role === 'merchant' ? '商户' : '用户'

  return (
    <View className='user-page'>
      <View className='user-header'>
        <View className='avatar'>👤</View>
        <View className='user-info-section'>
          <Text className='username'>{userInfo.username}</Text>
          <Text className='role'>{roleLabel}</Text>
        </View>
      </View>

      <View className='user-details'>
        <View className='detail-item'>
          <Text className='label'>邮箱</Text>
          <Text className='value'>{userInfo.email}</Text>
        </View>
        <View className='detail-item'>
          <Text className='label'>用户ID</Text>
          <Text className='value'>{userInfo.id}</Text>
        </View>
      </View>

      <View className='menu-section'>
        <View className='menu-item' onClick={() => Taro.navigateTo({ url: '/pages/my-bookings/index' })}>
          <Text className='icon'>📅</Text>
          <Text className='title'>我的预订</Text>
          <Text className='arrow'>›</Text>
        </View>

        {(userInfo.role === 'merchant' || userInfo.role === 'admin') && (
          <View className='menu-item' onClick={() => Taro.navigateTo({ url: '/pages/my-hotels/index' })}>
            <Text className='icon'>🏨</Text>
            <Text className='title'>我的酒店</Text>
            <Text className='arrow'>›</Text>
          </View>
        )}

        <View className='menu-item' onClick={() => Taro.navigateTo({ url: '/pages/help/index' })}>
          <Text className='icon'>❓</Text>
          <Text className='title'>帮助与反馈</Text>
          <Text className='arrow'>›</Text>
        </View>
      </View>

      <View className='logout-section'>
        <Button className='logout-btn' onClick={handleLogout}>
          退出登录
        </Button>
      </View>
    </View>
  )
}
