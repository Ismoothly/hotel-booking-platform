import { View, Button, Text, ScrollView } from '@tarojs/components'
import { useState } from 'react'
import Taro, { useLoad } from '@tarojs/taro'
import './index.scss'

interface Hotel {
  id: string
  nameCn: string
  starRating: number
  address: string
  rooms: Array<{ type: string; price: number }>
  status: 'draft' | 'pending' | 'approved' | 'published' | 'unpublished'
  reviewStatus: 'pending' | 'approved' | 'rejected'
}

export default function MyHotels() {
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [loading, setLoading] = useState(false)
  const [userRole, setUserRole] = useState<string>('')

  useLoad(() => {
    checkUserRole()
    fetchMyHotels()
  })

  const checkUserRole = () => {
    const userStr = Taro.getStorageSync('user_info')
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        setUserRole(user.role)
      } catch (e) {
        console.error('Failed to parse user info')
      }
    }
  }

  const fetchMyHotels = async () => {
    setLoading(true)
    try {
      // TODO: 调用我的酒店列表 API
      // 模拟数据
      setHotels([
        {
          id: '1',
          nameCn: '上海外滩豪华酒店',
          starRating: 5,
          address: '上海市黄浦区中山东一路100号',
          rooms: [
            { type: '豪华大床房', price: 888 },
            { type: '豪华双床房', price: 888 }
          ],
          status: 'published',
          reviewStatus: 'approved'
        }
      ])
    } catch (error) {
      Taro.showToast({
        title: '获取酒店列表失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddHotel = () => {
    if (userRole !== 'merchant' && userRole !== 'admin') {
      Taro.showToast({
        title: '只有商户或管理员可以添加酒店',
        icon: 'none'
      })
      return
    }
    Taro.navigateTo({ url: '/pages/hotel-form/index' })
  }

  const handleEditHotel = (hotelId: string) => {
    Taro.navigateTo({ url: `/pages/hotel-form/index?id=${hotelId}` })
  }

  const getStatusBadge = (status: string) => {
    const colors: Record<string, { bg: string; color: string }> = {
      draft: { bg: '#f0f0f0', color: '#666' },
      pending: { bg: '#fff3cd', color: '#ff9800' },
      approved: { bg: '#d4edda', color: '#28a745' },
      published: { bg: '#cce5ff', color: '#0066cc' },
      unpublished: { bg: '#f8d7da', color: '#dc3545' }
    }
    const style = colors[status] || colors.draft
    return style
  }

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      draft: '草稿',
      pending: '待审核',
      approved: '已通过',
      published: '已发布',
      unpublished: '已下线'
    }
    return texts[status] || status
  }

  if (userRole && userRole !== 'merchant' && userRole !== 'admin') {
    return (
      <View className='my-hotels-page'>
        <View className='permission-denied'>
          <Text className='icon'>🔒</Text>
          <Text className='message'>只有商户或管理员可以管理酒店</Text>
        </View>
      </View>
    )
  }

  return (
    <View className='my-hotels-page'>
      <View className='header-section'>
        <Button className='add-btn' onClick={handleAddHotel}>
          + 新增酒店
        </Button>
      </View>

      <ScrollView scrollY className='hotels-list'>
        {hotels.map((hotel) => {
          const statusStyle = getStatusBadge(hotel.status)
          return (
            <View key={hotel.id} className='hotel-card'>
              <View className='hotel-header'>
                <View>
                  <Text className='hotel-name'>{hotel.nameCn}</Text>
                  <Text className='hotel-address'>{hotel.address}</Text>
                </View>
                <Text className='star-rating'>{'⭐'.repeat(hotel.starRating)}</Text>
              </View>

              <View className='hotel-info'>
                <Text className='room-count'>房型数：{hotel.rooms.length}个</Text>
                <Text className='min-price'>
                  最低价：¥{Math.min(...hotel.rooms.map((r) => r.price))}
                </Text>
              </View>

              <View className='hotel-footer'>
                <View
                  className='status-badge'
                  style={{
                    backgroundColor: statusStyle.bg,
                    color: statusStyle.color
                  }}
                >
                  {getStatusText(hotel.status)}
                </View>
                <View className='actions'>
                  <Text
                    className='action-link'
                    onClick={() => handleEditHotel(hotel.id)}
                  >
                    编辑
                  </Text>
                  {hotel.status === 'published' && (
                    <Text className='action-link danger'>下线</Text>
                  )}
                  {hotel.status === 'draft' && (
                    <Text className='action-link danger'>删除</Text>
                  )}
                </View>
              </View>
            </View>
          )
        })}

        {hotels.length === 0 && (
          <View className='empty'>
            <Text>暂无酒店数据</Text>
            <Button
              className='add-btn-alt'
              onClick={handleAddHotel}
            >
              立即添加
            </Button>
          </View>
        )}
      </ScrollView>
    </View>
  )
}
