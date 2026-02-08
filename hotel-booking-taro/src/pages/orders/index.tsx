import { View, Text, ScrollView } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import { orderAPI } from '../../services/api'
import './index.scss'

interface OrderItem {
  hotelName: string
  roomType: string
  price: number
  quantity: number
  checkInDate: string
  checkOutDate: string
  nights: number
  subtotal: number
}

interface Order {
  _id: string
  orderId: string
  status: 'pending' | 'confirmed' | 'paid' | 'cancelled'
  paymentStatus: string
  totalPrice: number
  items: OrderItem[]
  guestName: string
  guestPhone: string
  guestEmail?: string
  notes?: string
  createdAt: string
}

const statusMap = {
  pending: { label: '待支付', class: 'pending' },
  confirmed: { label: '已确认', class: 'confirmed' },
  paid: { label: '已支付', class: 'paid' },
  cancelled: { label: '已取消', class: 'cancelled' }
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useDidShow(() => {
    fetchOrders()
  })

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const params: any = {}
      if (filter !== 'all') {
        params.status = filter
      }

      const response = await orderAPI.getMyOrders(params)
      if (response.code === 200) {
        setOrders(response.data.orders || [])
      }
    } catch (error: any) {
      Taro.showToast({
        title: error.message || '获取订单失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [filter])

  const handlePayment = async (order: Order) => {
    try {
      const response = await orderAPI.completePayment(order.orderId)
      if (response.code === 200) {
        Taro.showToast({
          title: '支付成功',
          icon: 'success'
        })
        fetchOrders()
      }
    } catch (error: any) {
      Taro.showToast({
        title: error.message || '支付失败',
        icon: 'none'
      })
    }
  }

  const handleCancelOrder = async (order: Order) => {
    const result = await Taro.showModal({
      title: '取消订单',
      content: '确定要取消这个订单吗？',
      editable: true,
      placeholderText: '请输入取消原因（可选）'
    })

    if (result.confirm) {
      try {
        const response = await orderAPI.cancelOrder(order.orderId, result.content || '用户取消')
        if (response.code === 200) {
          Taro.showToast({
            title: '订单已取消',
            icon: 'success'
          })
          fetchOrders()
        }
      } catch (error: any) {
        Taro.showToast({
          title: error.message || '取消失败',
          icon: 'none'
        })
      }
    }
  }

  const formatDate = (date: string) => {
    const d = new Date(date)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  const formatDateTime = (date: string) => {
    const d = new Date(date)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }

  if (loading && orders.length === 0) {
    return (
      <View className='orders-page'>
        <View className='empty-orders'>
          <Text className='empty-text'>加载中...</Text>
        </View>
      </View>
    )
  }

  return (
    <ScrollView scrollY className='orders-page'>
      {/* 筛选器 */}
      <View className='orders-filter'>
        <Text className='filter-label'>订单状态</Text>
        <View className='filter-options'>
          <View
            className={`filter-option ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            全部
          </View>
          <View
            className={`filter-option ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            待支付
          </View>
          <View
            className={`filter-option ${filter === 'confirmed' ? 'active' : ''}`}
            onClick={() => setFilter('confirmed')}
          >
            已确认
          </View>
          <View
            className={`filter-option ${filter === 'paid' ? 'active' : ''}`}
            onClick={() => setFilter('paid')}
          >
            已支付
          </View>
          <View
            className={`filter-option ${filter === 'cancelled' ? 'active' : ''}`}
            onClick={() => setFilter('cancelled')}
          >
            已取消
          </View>
        </View>
      </View>

      {orders.length === 0 ? (
        <View className='empty-orders'>
          <Text className='empty-icon'>📋</Text>
          <Text className='empty-text'>暂无订单</Text>
          <View
            className='shop-btn'
            onClick={() => Taro.switchTab({ url: '/pages/index/index' })}
          >
            去逛逛
          </View>
        </View>
      ) : (
        <View className='orders-list'>
          {orders.map((order) => {
            const statusInfo = statusMap[order.status]
            return (
              <View key={order._id} className='order-card'>
                {/* 订单头部 */}
                <View className='order-header'>
                  <View className='order-info'>
                    <Text className='order-id'>订单号: {order.orderId}</Text>
                    <Text className='order-date'>{formatDateTime(order.createdAt)}</Text>
                  </View>
                  <View className={`order-status ${statusInfo.class}`}>
                    {statusInfo.label}
                  </View>
                </View>

                {/* 订单项 */}
                <View className='order-items'>
                  {order.items.map((item, index) => (
                    <View key={index} className='order-item'>
                      <Text className='item-name'>{item.hotelName}</Text>
                      <Text className='item-detail'>{item.roomType} × {item.quantity}间</Text>
                      <Text className='item-detail'>
                        {formatDate(item.checkInDate)} 至 {formatDate(item.checkOutDate)} ({item.nights}晚)
                      </Text>
                    </View>
                  ))}
                </View>

                {/* 客人信息 */}
                <View className='order-guest'>
                  <View className='guest-row'>
                    <Text className='label'>入住人:</Text>
                    <Text>{order.guestName}</Text>
                  </View>
                  <View className='guest-row'>
                    <Text className='label'>联系电话:</Text>
                    <Text>{order.guestPhone}</Text>
                  </View>
                  {order.guestEmail && (
                    <View className='guest-row'>
                      <Text className='label'>电子邮箱:</Text>
                      <Text>{order.guestEmail}</Text>
                    </View>
                  )}
                  {order.notes && (
                    <View className='guest-row'>
                      <Text className='label'>备注:</Text>
                      <Text>{order.notes}</Text>
                    </View>
                  )}
                </View>

                {/* 订单底部 */}
                <View className='order-footer'>
                  <View className='order-total'>
                    合计: <Text className='amount'>¥{order.totalPrice.toFixed(2)}</Text>
                  </View>
                  <View className='order-actions'>
                    {order.status === 'pending' && (
                      <>
                        <View className='action-btn primary' onClick={() => handlePayment(order)}>
                          去支付
                        </View>
                        <View className='action-btn danger' onClick={() => handleCancelOrder(order)}>
                          取消
                        </View>
                      </>
                    )}
                    {order.status === 'confirmed' && (
                      <View className='action-btn danger' onClick={() => handleCancelOrder(order)}>
                        取消订单
                      </View>
                    )}
                  </View>
                </View>
              </View>
            )
          })}
        </View>
      )}
    </ScrollView>
  )
}
