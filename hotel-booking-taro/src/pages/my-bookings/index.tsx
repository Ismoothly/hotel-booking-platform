import { View, Text, ScrollView } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro, { useLoad } from '@tarojs/taro'
import './index.scss'

interface Booking {
  id: string
  hotelName: string
  roomType: string
  checkInDate: string
  checkOutDate: string
  guestName: string
  totalPrice: number
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
}

export default function MyBookings() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'upcoming' | 'completed'>('all')

  useLoad(() => {
    fetchBookings()
  })

  const fetchBookings = async () => {
    setLoading(true)
    try {
      // TODO: 调用预订列表 API
      // 模拟数据
      setBookings([
        {
          id: '1',
          hotelName: '上海外滩豪华酒店',
          roomType: '豪华大床房',
          checkInDate: '2026-02-10',
          checkOutDate: '2026-02-12',
          guestName: '张三',
          totalPrice: 1776,
          status: 'confirmed'
        }
      ])
    } catch (error) {
      Taro.showToast({
        title: '获取预订列表失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: '#ff9800',
      confirmed: '#4caf50',
      completed: '#2196f3',
      cancelled: '#f44336'
    }
    return colors[status] || '#666'
  }

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      pending: '待确认',
      confirmed: '已确认',
      completed: '已完成',
      cancelled: '已取消'
    }
    return texts[status] || '未知'
  }

  const filteredBookings = bookings.filter((booking) => {
    if (activeTab === 'all') return true
    if (activeTab === 'upcoming') {
      return new Date(booking.checkInDate) > new Date() && booking.status !== 'cancelled'
    }
    if (activeTab === 'completed') {
      return booking.status === 'completed' || new Date(booking.checkOutDate) < new Date()
    }
    return true
  })

  return (
    <View className='my-bookings-page'>
      <View className='tabs'>
        {(['all', 'upcoming', 'completed'] as const).map((tab) => (
          <View
            key={tab}
            className={`tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'all' ? '全部' : tab === 'upcoming' ? '即将入住' : '已完成'}
          </View>
        ))}
      </View>

      <ScrollView scrollY className='bookings-list'>
        {filteredBookings.map((booking) => (
          <View key={booking.id} className='booking-card'>
            <View className='booking-header'>
              <Text className='hotel-name'>{booking.hotelName}</Text>
              <Text
                className='status'
                style={{ color: getStatusColor(booking.status) }}
              >
                {getStatusText(booking.status)}
              </Text>
            </View>

            <View className='booking-info'>
              <View className='info-row'>
                <Text className='label'>房型：</Text>
                <Text className='value'>{booking.roomType}</Text>
              </View>
              <View className='info-row'>
                <Text className='label'>入住：</Text>
                <Text className='value'>{booking.checkInDate}</Text>
              </View>
              <View className='info-row'>
                <Text className='label'>退房：</Text>
                <Text className='value'>{booking.checkOutDate}</Text>
              </View>
              <View className='info-row'>
                <Text className='label'>客人：</Text>
                <Text className='value'>{booking.guestName}</Text>
              </View>
            </View>

            <View className='booking-footer'>
              <Text className='price'>¥{booking.totalPrice}</Text>
              <View className='actions'>
                <Text className='action-btn'>详情</Text>
                {booking.status === 'confirmed' && (
                  <Text className='action-btn cancel'>取消</Text>
                )}
              </View>
            </View>
          </View>
        ))}

        {filteredBookings.length === 0 && (
          <View className='empty'>
            <Text>暂无预订记录</Text>
          </View>
        )}
      </ScrollView>
    </View>
  )
}
