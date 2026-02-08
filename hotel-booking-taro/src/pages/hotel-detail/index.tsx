import { View, Image, Swiper, SwiperItem, Text, Button, ScrollView, Picker } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro, { useLoad, useRouter } from '@tarojs/taro'
import { hotelAPI, cartAPI } from '../../services/api'
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
  const [checkInDate, setCheckInDate] = useState('')
  const [checkOutDate, setCheckOutDate] = useState('')

  useLoad(() => {
    const { id } = router.params
    if (id) {
      fetchHotelDetail(id)
    }
    // 设置默认日期（今天和明天）
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    setCheckInDate(formatDateForPicker(today))
    setCheckOutDate(formatDateForPicker(tomorrow))
  })

  const formatDateForPicker = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

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

  const calculateNights = () => {
    if (!checkInDate || !checkOutDate) return 0
    const checkIn = new Date(checkInDate)
    const checkOut = new Date(checkOutDate)
    const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const handleAddToCart = async () => {
    if (!selectedRoom) {
      Taro.showToast({
        title: '请选择房型',
        icon: 'none'
      })
      return
    }

    const nights = calculateNights()
    if (nights <= 0) {
      Taro.showToast({
        title: '请选择有效的入住日期',
        icon: 'none'
      })
      return
    }

    try {
      const response = await cartAPI.addToCart({
        hotelId: hotel!.id,
        roomType: selectedRoom.type,
        checkInDate,
        checkOutDate,
        quantity: 1
      })

      if (response.code === 200) {
        const result = await Taro.showModal({
          title: '成功添加到购物车',
          content: '是否前往购物车结账？',
          confirmText: '前往',
          cancelText: '继续购物'
        })

        if (result.confirm) {
          Taro.switchTab({ url: '/pages/cart/index' })
        }
      }
    } catch (error: any) {
      Taro.showToast({
        title: error.message || '添加失败',
        icon: 'none'
      })
    }
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
                <View className='room-price'>¥{room.price}/晚</View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 日期选择 */}
      <View className='section date-section'>
        <View className='section-title'>入住日期</View>
        <View className='date-picker-row'>
          <Picker
            mode='date'
            value={checkInDate}
            onChange={(e) => setCheckInDate(e.detail.value)}
          >
            <View className='date-picker'>
              <Text className='date-label'>入住:</Text>
              <Text className='date-value'>{checkInDate}</Text>
            </View>
          </Picker>
          <Text className='date-separator'>至</Text>
          <Picker
            mode='date'
            value={checkOutDate}
            onChange={(e) => setCheckOutDate(e.detail.value)}
          >
            <View className='date-picker'>
              <Text className='date-label'>离店:</Text>
              <Text className='date-value'>{checkOutDate}</Text>
            </View>
          </Picker>
        </View>
        <View className='nights-info'>
          共 {calculateNights()} 晚
        </View>
      </View>

      {/* 底部栏 */}
      <View className='booking-footer'>
        <View className='price-info'>
          {selectedRoom && (
            <>
              <Text className='price-label'>总价:</Text>
              <Text className='price-amount'>
                ¥{(selectedRoom.price * calculateNights()).toFixed(2)}
              </Text>
            </>
          )}
        </View>
        <Button className='cart-btn' onClick={handleAddToCart}>
          🛒 加入购物车
        </Button>
      </View>
    </ScrollView>
  )
}
