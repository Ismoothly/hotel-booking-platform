import { View, Image, Swiper, SwiperItem, Text, Button, ScrollView } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro, { useLoad, useRouter } from '@tarojs/taro'
import { hotelAPI } from '../../services/api'
import './index.scss'

interface Room {
  type: string
  price: number
  description: string
}

interface Hotel {
  id: string
  nameCn: string
  nameEn: string
  starRating: number
  address: string
  images?: string[]
  rooms?: Room[]
  facilities?: string[]
  nearbyAttractions?: string[]
  transportation?: string
  nearbyShopping?: string[]
}

export default function HotelDetail() {
  const router = useRouter()
  const [hotel, setHotel] = useState<Hotel | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)

  useLoad(() => {
    const { id } = router.params
    if (id) {
      fetchHotelDetail(id)
    }
  })

  const fetchHotelDetail = async (hotelId: string) => {
    try {
      setLoading(true)
      const response = await hotelAPI.getHotelById(hotelId)
      setHotel(response.data)
      if (response.data?.rooms && response.data.rooms.length > 0) {
        setSelectedRoom(response.data.rooms[0])
      }
    } catch (error) {
      Taro.showToast({
        title: '获取酒店详情失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleBooking = () => {
    if (!selectedRoom) {
      Taro.showToast({
        title: '请选择房型',
        icon: 'none'
      })
      return
    }
    Taro.navigateTo({
      url: `/pages/booking/index?hotelId=${hotel?.id}&roomType=${selectedRoom.type}&price=${selectedRoom.price}`
    })
  }

  if (loading) {
    return (
      <View className='hotel-detail loading'>
        <Text>加载中...</Text>
      </View>
    )
  }

  if (!hotel) {
    return (
      <View className='hotel-detail empty'>
        <Text>酒店不存在</Text>
      </View>
    )
  }

  return (
    <ScrollView scrollY className='hotel-detail'>
      {/* 图片轮播 */}
      {hotel.images && hotel.images.length > 0 && (
        <Swiper className='banner' autoplay displayMultipleItems={1} indicatorDots>
          {hotel.images.map((image, index) => (
            <SwiperItem key={index}>
              <Image src={image} className='banner-image' mode='scaleToFill' />
            </SwiperItem>
          ))}
        </Swiper>
      )}

      {/* 基础信息 */}
      <View className='hotel-info'>
        <View className='hotel-header'>
          <View>
            <View className='hotel-name'>{hotel.nameCn}</View>
            <View className='hotel-en-name'>{hotel.nameEn}</View>
          </View>
          <View className='star-rating'>{'⭐'.repeat(hotel.starRating)}</View>
        </View>

        <View className='hotel-address'>{hotel.address}</View>

        {hotel.transportation && (
          <View className='info-item'>
            <Text className='label'>交通：</Text>
            <Text className='value'>{hotel.transportation}</Text>
          </View>
        )}
      </View>

      {/* 设施信息 */}
      {hotel.facilities && hotel.facilities.length > 0 && (
        <View className='section'>
          <View className='section-title'>酒店设施</View>
          <View className='facilities-grid'>
            {hotel.facilities.map((facility, index) => (
              <View key={index} className='facility-tag'>
                {facility}
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 景点信息 */}
      {hotel.nearbyAttractions && hotel.nearbyAttractions.length > 0 && (
        <View className='section'>
          <View className='section-title'>周边景点</View>
          <View className='attractions-list'>
            {hotel.nearbyAttractions.map((attraction, index) => (
              <View key={index} className='attraction-item'>
                📍 {attraction}
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 购物信息 */}
      {hotel.nearbyShopping && hotel.nearbyShopping.length > 0 && (
        <View className='section'>
          <View className='section-title'>周边购物</View>
          <View className='shopping-list'>
            {hotel.nearbyShopping.map((shop, index) => (
              <View key={index} className='shop-item'>
                🛍️ {shop}
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 房型选择 */}
      {hotel.rooms && hotel.rooms.length > 0 && (
        <View className='section rooms-section'>
          <View className='section-title'>房型选择</View>
          <View className='rooms-list'>
            {hotel.rooms.map((room, index) => (
              <View
                key={index}
                className={`room-card ${selectedRoom?.type === room.type ? 'selected' : ''}`}
                onClick={() => setSelectedRoom(room)}
              >
                <View className='room-type'>{room.type}</View>
                <View className='room-description'>{room.description}</View>
                <View className='room-price'>¥{room.price}</View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 预订按钮 */}
      <View className='booking-footer'>
        <Button className='booking-btn' onClick={handleBooking}>
          立即预订
        </Button>
      </View>
    </ScrollView>
  )
}
