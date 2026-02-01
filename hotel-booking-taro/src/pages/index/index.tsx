import { View, ScrollView, Image, Input, Text } from '@tarojs/components'
import { useState } from 'react'
import Taro, { useLoad } from '@tarojs/taro'
import { hotelAPI } from '../../services/api'
import './index.scss'

interface Hotel {
  id: string
  nameCn: string
  nameEn: string
  starRating: number
  address: string
  images?: string[]
  rooms?: Array<{ type: string; price: number }>
}

export default function Index() {
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [loading, setLoading] = useState(false)
  const [searchValue, setSearchValue] = useState('')

  useLoad(() => {
    console.log('Page loaded.')
    fetchHotels()
  })

  const fetchHotels = async (keyword: string = '') => {
    setLoading(true)
    try {
      const response = await hotelAPI.getHotels({ keyword })
      setHotels(response.data || [])
    } catch (error) {
      Taro.showToast({
        title: '获取酒店列表失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (value: string) => {
    setSearchValue(value)
    fetchHotels(value)
  }

  const handleHotelDetail = (hotelId: string) => {
    Taro.navigateTo({
      url: `/pages/hotel-detail/index?id=${hotelId}`
    })
  }

  const getMinPrice = (rooms?: Array<{ price: number }>) => {
    if (!rooms || rooms.length === 0) return 0
    return Math.min(...rooms.map((r) => r.price))
  }

  return (
    <View className='index'>
      <View className='search-container'>
        <Input
          className='search-input'
          type='text'
          value={searchValue}
          onInput={(e) => handleSearch(e.detail.value)}
          placeholder='搜索酒店名称'
          placeholderClass='placeholder'
        />
      </View>

      {loading && (
        <View className='loading'>
          <Text>加载中...</Text>
        </View>
      )}

      <ScrollView scrollY className='hotels-list'>
        {hotels.map((hotel) => (
          <View
            key={hotel.id}
            className='hotel-card'
            onClick={() => handleHotelDetail(hotel.id)}
          >
            {hotel.images && hotel.images.length > 0 && (
              <Image src={hotel.images[0]} className='hotel-image' mode='scaleToFill' />
            )}
            <View className='hotel-info'>
              <View className='hotel-name'>{hotel.nameCn}</View>
              <View className='hotel-address'>{hotel.address}</View>
              <View className='hotel-bottom'>
                <View className='star-rating'>{'⭐'.repeat(hotel.starRating)}</View>
                <View className='price'>¥{getMinPrice(hotel.rooms)}/晚起</View>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {hotels.length === 0 && !loading && <View className='empty'>暂无酒店数据</View>}
    </View>
  )
}
