import { View, Button, Text, Input, Picker } from '@tarojs/components'
import { useState } from 'react'
import Taro, { useRouter } from '@tarojs/taro'
import './index.scss'

export default function Booking() {
  const router = useRouter()
  const [checkInDate, setCheckInDate] = useState('')
  const [checkOutDate, setCheckOutDate] = useState('')
  const [guestName, setGuestName] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [loading, setLoading] = useState(false)

  const { hotelId, roomType, price } = router.params

  const handleBooking = async () => {
    if (!checkInDate || !checkOutDate || !guestName || !guestPhone) {
      Taro.showToast({
        title: '请填写所有信息',
        icon: 'none'
      })
      return
    }

    setLoading(true)
    try {
      // 这里可以调用预订 API
      Taro.showToast({
        title: '预订成功',
        icon: 'success'
      })

      setTimeout(() => {
        Taro.navigateTo({ url: '/pages/my-bookings/index' })
      }, 1500)
    } catch (error: any) {
      Taro.showToast({
        title: error.message || '预订失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }

  const today = new Date().toISOString().split('T')[0]
  const maxDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  return (
    <View className='booking-page'>
      <View className='booking-container'>
        {/* 房间信息摘要 */}
        <View className='room-summary'>
          <View className='summary-item'>
            <Text className='label'>房型：</Text>
            <Text className='value'>{roomType}</Text>
          </View>
          <View className='summary-item'>
            <Text className='label'>价格：</Text>
            <Text className='value price'>¥{price}/晚</Text>
          </View>
        </View>

        {/* 入住信息 */}
        <View className='form-section'>
          <View className='section-title'>入住信息</View>

          <View className='form-group'>
            <Text className='label'>入住日期</Text>
            <Picker
              mode='date'
              value={checkInDate}
              start={today}
              end={maxDate}
              onChange={(e) => setCheckInDate(e.detail.value)}
            >
              <View className='picker-input'>
                {checkInDate || '请选择入住日期'}
              </View>
            </Picker>
          </View>

          <View className='form-group'>
            <Text className='label'>退房日期</Text>
            <Picker
              mode='date'
              value={checkOutDate}
              start={checkInDate || today}
              end={maxDate}
              onChange={(e) => setCheckOutDate(e.detail.value)}
            >
              <View className='picker-input'>
                {checkOutDate || '请选择退房日期'}
              </View>
            </Picker>
          </View>
        </View>

        {/* 客人信息 */}
        <View className='form-section'>
          <View className='section-title'>客人信息</View>

          <View className='form-group'>
            <Text className='label'>姓名</Text>
            <Input
              type='text'
              placeholder='请输入姓名'
              value={guestName}
              onInput={(e) => setGuestName(e.detail.value)}
              className='input'
            />
          </View>

          <View className='form-group'>
            <Text className='label'>电话</Text>
            <Input
              type='text'
              placeholder='请输入联系电话'
              value={guestPhone}
              onInput={(e) => setGuestPhone(e.detail.value)}
              className='input'
            />
          </View>
        </View>

        {/* 价格计算 */}
        {checkInDate && checkOutDate && (
          <View className='price-section'>
            <View className='price-item'>
              <Text className='label'>住宿天数：</Text>
              <Text className='value'>
                {Math.ceil(
                  (new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) /
                    (1000 * 60 * 60 * 24)
                )}{' '}
                晚
              </Text>
            </View>
            <View className='price-item'>
              <Text className='label'>总价：</Text>
              <Text className='value total'>
                ¥
                {Math.ceil(
                  (new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) /
                    (1000 * 60 * 60 * 24)
                ) * Number(price)}
              </Text>
            </View>
          </View>
        )}

        {/* 预订按钮 */}
        <View className='action-footer'>
          <Button
            className='confirm-btn'
            onClick={handleBooking}
            loading={loading}
            disabled={loading}
          >
            {loading ? '预订中...' : '确认预订'}
          </Button>
        </View>
      </View>
    </View>
  )
}
