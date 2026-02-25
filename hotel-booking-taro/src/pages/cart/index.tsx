import { View, Text, ScrollView } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import { cartAPI } from '../../services/api'
import './index.scss'

interface CartItem {
  hotelId: string
  hotelName: string
  roomType: string
  price: number
  originalPrice?: number
  discountPercent?: number
  quantity: number
  checkInDate: string
  checkOutDate: string
  nights: number
  subtotal: number
}

interface Cart {
  items: CartItem[]
  total: number
  itemCount: number
}

export default function Cart() {
  const [cart, setCart] = useState<Cart | null>(null)
  const [loading, setLoading] = useState(true)

  useDidShow(() => {
    fetchCart()
  })

  const fetchCart = async () => {
    try {
      setLoading(true)
      const response = await cartAPI.getCart()
      if (response.code === 200) {
        setCart(response.data)
      }
    } catch (error: any) {
      Taro.showToast({
        title: error.message || '获取购物车失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }

  const updateQuantity = async (index: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveItem(index)
      return
    }

    try {
      await cartAPI.updateCartItem(index, newQuantity)
      await fetchCart()
      Taro.showToast({
        title: '更新成功',
        icon: 'success'
      })
    } catch (error: any) {
      Taro.showToast({
        title: error.message || '更新失败',
        icon: 'none'
      })
    }
  }

  const handleRemoveItem = async (index: number) => {
    const result = await Taro.showModal({
      title: '确认删除',
      content: '确定要删除这个房间吗？'
    })

    if (result.confirm) {
      try {
        await cartAPI.removeCartItem(index)
        await fetchCart()
        Taro.showToast({
          title: '删除成功',
          icon: 'success'
        })
      } catch (error: any) {
        Taro.showToast({
          title: error.message || '删除失败',
          icon: 'none'
        })
      }
    }
  }

  const handleClearCart = async () => {
    const result = await Taro.showModal({
      title: '清空购物车',
      content: '确定要清空购物车中的所有房间吗？'
    })

    if (result.confirm) {
      try {
        await cartAPI.clearCart()
        await fetchCart()
        Taro.showToast({
          title: '清空成功',
          icon: 'success'
        })
      } catch (error: any) {
        Taro.showToast({
          title: error.message || '清空失败',
          icon: 'none'
        })
      }
    }
  }

  const handleCheckout = () => {
    if (!cart || cart.items.length === 0) {
      Taro.showToast({
        title: '购物车为空',
        icon: 'none'
      })
      return
    }

    // 跳转到订单确认页面（需要创建表单输入客人信息）
    Taro.navigateTo({
      url: '/pages/checkout/index'
    })
  }

  const formatDate = (date: string) => {
    const d = new Date(date)
    return `${d.getMonth() + 1}月${d.getDate()}日`
  }

  if (loading) {
    return (
      <View className='cart-page'>
        <View className='empty-cart'>
          <Text className='empty-text'>加载中...</Text>
        </View>
      </View>
    )
  }

  if (!cart || cart.items.length === 0) {
    return (
      <View className='cart-page'>
        <View className='empty-cart'>
          <Text className='empty-icon'>🛒</Text>
          <Text className='empty-text'>购物车为空</Text>
          <View
            className='shop-btn'
            onClick={() => Taro.switchTab({ url: '/pages/index/index' })}
          >
            继续购物
          </View>
          <View
            className='orders-btn'
            onClick={() => Taro.switchTab({ url: '/pages/orders/index' })}
          >
            📋 查看我的订单
          </View>
        </View>
      </View>
    )
  }

  return (
    <ScrollView scrollY className='cart-page'>
      <View className='cart-list'>
        {cart.items.map((item, index) => (
          <View key={index} className='cart-item'>
            <View className='item-header'>
              <View>
                <Text className='hotel-name'>{item.hotelName}</Text>
                <Text className='room-type'>{item.roomType}</Text>
              </View>
              <Text className='price'>
                {item.originalPrice != null && item.originalPrice !== item.price ? (
                  <>
                    <Text style='text-decoration:line-through;color:#999;margin-right:6rpx'>¥{item.originalPrice}/晚</Text>
                    <Text>¥{item.price}/晚</Text>
                  </>
                ) : (
                  <>¥{item.price}/晚</>
                )}
              </Text>
            </View>

            <View className='item-details'>
              <View className='detail-row'>
                <Text className='label'>入住:</Text>
                <Text>{formatDate(item.checkInDate)}</Text>
              </View>
              <View className='detail-row'>
                <Text className='label'>离店:</Text>
                <Text>{formatDate(item.checkOutDate)}</Text>
              </View>
              <View className='detail-row'>
                <Text className='label'>夜数:</Text>
                <Text>{item.nights}晚</Text>
              </View>
            </View>

            <View className='item-footer'>
              <View className='subtotal'>
                小计: <Text className='amount'>¥{item.subtotal.toFixed(2)}</Text>
                {item.originalPrice != null && item.originalPrice > item.price && (
                  <Text className='ml-2 text-green-600 text-xs'>
                    已优惠 ¥{((item.originalPrice - item.price) * item.nights * item.quantity).toFixed(2)}
                  </Text>
                )}
              </View>
              <View className='item-actions'>
                <View className='quantity-control'>
                  <View
                    className='quantity-btn'
                    onClick={() => updateQuantity(index, item.quantity - 1)}
                  >
                    -
                  </View>
                  <Text className='quantity'>{item.quantity}</Text>
                  <View
                    className='quantity-btn'
                    onClick={() => updateQuantity(index, item.quantity + 1)}
                  >
                    +
                  </View>
                </View>
                <View className='delete-btn' onClick={() => handleRemoveItem(index)}>
                  删除
                </View>
              </View>
            </View>
          </View>
        ))}
      </View>

      <View className='cart-footer'>
        <View className='summary'>
          <Text className='total-label'>合计:</Text>
          <Text className='total-amount'>¥{cart.total.toFixed(2)}</Text>
        </View>
        <View className='checkout-btn' onClick={handleCheckout}>
          结算 ({cart.itemCount}间)
        </View>
        <View className='clear-btn' onClick={handleClearCart}>
          清空购物车
        </View>
      </View>
    </ScrollView>
  )
}
