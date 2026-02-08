import { View, ScrollView, Image, Input, Text, Picker, Button } from '@tarojs/components'
import { useState } from 'react'
import Taro, { useLoad } from '@tarojs/taro'
import { hotelAPI, setAPIBaseURL } from '../../services/api'
import './index.scss'

interface Hotel {
  _id: string
  nameCn: string
  nameEn: string
  starRating: number
  address: string
  city?: string
  images?: string[]
  rooms?: Array<{ type: string; price: number }>
}

const CITIES = ['北京', '天津', '上海', '广州', '深圳', '杭州', '成都', '西安', '南京', '武汉', '重庆']
const STAR_RATINGS = ['不限', '三星级', '四星级', '五星级']

export default function Index() {
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [loading, setLoading] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [selectedCity, setSelectedCity] = useState('上海')
  const [selectedStar, setSelectedStar] = useState(0)
  const [checkInDate, setCheckInDate] = useState('')
  const [checkOutDate, setCheckOutDate] = useState('')

  useLoad(() => {
    console.log('🏠 首页加载')
    
    // 初始化日期
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    setCheckInDate(formatDate(today))
    setCheckOutDate(formatDate(tomorrow))
    
    fetchHotels()
  })

  const formatDate = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const fetchHotels = async (filters: any = {}) => {
    setLoading(true)
    try {
      const params: any = {
        keyword: searchValue,
        city: selectedCity,
        ...filters
      }
      if (selectedStar > 0) {
      }
      console.log('🔍 获取酒店列表，参数:', params)
      const response = await hotelAPI.getHotels(params)
      console.log('✅ 获取酒店列表成功:', response)
      setHotels(response.data || [])
    } catch (error: any) {
      console.error('❌ 获取酒店列表失败:', error)
      
      if (error.message?.includes('网络请求失败') || error.errMsg?.includes('timeout')) {
        Taro.showModal({
          title: '网络连接失败',
          content: '真机测试时，请在Console运行：\nsetAPIBaseURL("http://YOUR_IP:5000/api")\n将YOUR_IP改为电脑局域网IP地址',
          showCancel: false
        })
      } else {
        Taro.showToast({
          title: error.message || '获取酒店列表失败',
          icon: 'none'
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (value: string) => {
    setSearchValue(value)
  }

  const handleCityChange = (e: any) => {
    const cityIndex = e.detail.value
    setSelectedCity(CITIES[cityIndex])
    fetchHotels()
  }

  const handleStarChange = (e: any) => {
    const starIndex = e.detail.value
    setSelectedStar(starIndex)
    fetchHotels()
  }

  const handleCheckInDateChange = (e: any) => {
    setCheckInDate(e.detail.value)
  }

  const handleCheckOutDateChange = (e: any) => {
    setCheckOutDate(e.detail.value)
  }

  const handleGetLocation = async () => {
    try {
      Taro.showLoading({ title: '定位中...' })
      
      // 直接获取定位，首次会自动弹出授权
      const res = await Taro.getLocation({
        type: 'gcj02',
        altitude: false,
        isHighAccuracy: true
      })
      
      Taro.hideLoading()
      
      // 根据经纬度匹配城市
      const city = getCityFromCoordinates(res.latitude, res.longitude)
      
      if (city) {
        setSelectedCity(city)
        Taro.showToast({
          title: `已定位到${city}`,
          icon: 'success',
          duration: 2000
        })
        fetchHotels()
      } else {
        Taro.showToast({
          title: `定位成功，但当前位置暂不支持\n请手动选择城市`,
          icon: 'none',
          duration: 2500
        })
      }
    } catch (error: any) {
      Taro.hideLoading()
      console.error('定位失败:', error)
      
      // 根据不同错误码给出提示
      let errorMsg = '定位失败，请手动选择城市'
      if (error.errMsg) {
        if (error.errMsg.includes('auth deny')) {
          errorMsg = '定位权限被拒绝\n请在小程序设置中开启定位权限'
        } else if (error.errMsg.includes('timeout')) {
          errorMsg = '定位超时，请重试'
        }
      }
      
      Taro.showModal({
        title: '定位失败',
        content: errorMsg,
        showCancel: false
      })
    }
  }
  
  const getCityFromCoordinates = (lat: number, lng: number) => {
    // 主要城市的大致经纬度范围
    const cityRanges = [
      { name: '北京', lat: [39.4, 41.6], lng: [115.4, 117.5] },
      { name: '天津', lat: [38.7, 40.3], lng: [116.7, 118.1] },
      { name: '上海', lat: [30.7, 31.9], lng: [120.8, 122.2] },
      { name: '广州', lat: [22.5, 24.0], lng: [112.9, 114.5] },
      { name: '深圳', lat: [22.4, 22.9], lng: [113.7, 114.7] },
      { name: '杭州', lat: [29.2, 30.6], lng: [118.3, 120.9] },
      { name: '成都', lat: [30.1, 31.4], lng: [102.9, 104.9] },
      { name: '西安', lat: [33.7, 34.8], lng: [107.8, 109.8] },
      { name: '南京', lat: [31.2, 32.6], lng: [118.4, 119.2] },
      { name: '武汉', lat: [29.9, 31.4], lng: [113.7, 115.1] },
      { name: '重庆', lat: [28.1, 32.2], lng: [105.3, 110.2] }
    ]
    
    for (const city of cityRanges) {
      if (lat >= city.lat[0] && lat <= city.lat[1] &&
          lng >= city.lng[0] && lng <= city.lng[1]) {
        return city.name
      }
    }
    return null
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

  const calculateNights = () => {
    if (!checkInDate || !checkOutDate) return 0
    const checkIn = new Date(checkInDate)
    const checkOut = new Date(checkOutDate)
    const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  return (
    <View className='index'>
      {/* 筛选区域 */}
      <View className='filter-section'>
        <View className='filter-row'>
          <View className='filter-item'>
            <Text className='filter-label'>目的地</Text>
            <Picker mode='selector' range={CITIES} onChange={handleCityChange} value={CITIES.indexOf(selectedCity)}>
              <View className='picker'>
                <Text>{selectedCity}</Text>
                <Text className='arrow'>▼</Text>
              </View>
            </Picker>
          </View>
          <Button className='location-btn' size='mini' onClick={handleGetLocation}>
            📍 定位
          </Button>
        </View>

        <View className='filter-row'>
          <View className='filter-item'>
            <Text className='filter-label'>入住</Text>
            <Picker mode='date' value={checkInDate} onChange={handleCheckInDateChange}>
              <View className='picker'>
                <Text>{checkInDate.substring(5).replace('-', '月')}日</Text>
              </View>
            </Picker>
          </View>
          <View className='nights-divider'>
            <Text>共{calculateNights()}晚</Text>
          </View>
          <View className='filter-item'>
            <Text className='filter-label'>离店</Text>
            <Picker mode='date' value={checkOutDate} onChange={handleCheckOutDateChange}>
              <View className='picker'>
                <Text>{checkOutDate.substring(5).replace('-', '月')}日</Text>
              </View>
            </Picker>
          </View>
        </View>

        <View className='filter-row'>
          <View className='filter-item'>
            <Text className='filter-label'>星级</Text>
            <Picker mode='selector' range={STAR_RATINGS} onChange={handleStarChange} value={selectedStar}>
              <View className='picker'>
                <Text>{STAR_RATINGS[selectedStar]}</Text>
                <Text className='arrow'>▼</Text>
              </View>
            </Picker>
          </View>
        </View>

        <View className='search-row'>
          <Input
            className='search-input'
            type='text'
            value={searchValue}
            onInput={(e) => handleSearch(e.detail.value)}
            placeholder='搜索酒店名称'
            placeholderClass='placeholder'
          />
          <Button className='search-btn' type='primary' size='mini' onClick={() => fetchHotels()}>
            搜索
          </Button>
        </View>
      </View>

      {loading && (
        <View className='loading'>
          <Text>加载中...</Text>
        </View>
      )}

      <ScrollView scrollY className='hotels-list'>
        {hotels.map((hotel) => (
          <View
            key={hotel._id}
            className='hotel-card'
            onClick={() => handleHotelDetail(hotel._id)}
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
