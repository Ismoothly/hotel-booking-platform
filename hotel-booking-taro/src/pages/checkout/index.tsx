import { View, Text, Input, Textarea, Button } from '@tarojs/components'
import { useState } from 'react'
import Taro, { useLoad } from '@tarojs/taro'
import { orderAPI } from '../../services/api'
import './index.scss'

export default function Checkout() {
  const [formData, setFormData] = useState({
    guestName: '',
    guestPhone: '',
    guestEmail: '',
    notes: ''
  })
  const [loading, setLoading] = useState(false)

  const handleInput = (field: string, value: string) => {
    setFormData({
      ...formData,
      [field]: value
    })
  }

  const validateForm = () => {
    if (!formData.guestName.trim()) {
      Taro.showToast({
        title: '请输入入住人姓名',
        icon: 'none'
      })
      return false
    }

    if (!formData.guestPhone.trim()) {
      Taro.showToast({
        title: '请输入联系电话',
        icon: 'none'
      })
      return false
    }

    const phoneRegex = /^1[3-9]\d{9}$/
    if (!phoneRegex.test(formData.guestPhone)) {
      Taro.showToast({
        title: '请输入有效的手机号码',
        icon: 'none'
      })
      return false
    }

    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    try {
      setLoading(true)

      const response = await orderAPI.createOrder({
        guestName: formData.guestName,
        guestPhone: formData.guestPhone,
        guestEmail: formData.guestEmail || undefined,
        notes: formData.notes || undefined,
        paymentMethod: 'wechat'
      })

      if (response.code === 200) {
        await Taro.showModal({
          title: '订单创建成功',
          content: `订单号: ${response.data.orderId}`,
          showCancel: false
        })

        // 跳转到订单页面
        Taro.redirectTo({
          url: '/pages/orders/index'
        })
      }
    } catch (error: any) {
      Taro.showToast({
        title: error.message || '创建订单失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className='checkout-page'>
      <View className='form-section'>
        <View className='section-title'>入住人信息</View>
        
        <View className='form-item'>
          <View className='label'>
            <Text className='required'>* </Text>
            入住人姓名
          </View>
          <Input
            className='input'
            placeholder='请输入入住人姓名'
            value={formData.guestName}
            onInput={(e) => handleInput('guestName', e.detail.value)}
          />
        </View>

        <View className='form-item'>
          <View className='label'>
            <Text className='required'>* </Text>
            联系电话
          </View>
          <Input
            className='input'
            type='number'
            placeholder='请输入联系电话'
            value={formData.guestPhone}
            maxlength={11}
            onInput={(e) => handleInput('guestPhone', e.detail.value)}
          />
        </View>

        <View className='form-item'>
          <View className='label'>电子邮箱（选填）</View>
          <Input
            className='input'
            type='text'
            placeholder='请输入电子邮箱'
            value={formData.guestEmail}
            onInput={(e) => handleInput('guestEmail', e.detail.value)}
          />
        </View>

        <View className='form-item'>
          <View className='label'>备注信息（选填）</View>
          <Textarea
            className='textarea'
            placeholder='如有特殊需求请在此填写'
            value={formData.notes}
            maxlength={200}
            onInput={(e) => handleInput('notes', e.detail.value)}
          />
        </View>
      </View>

      <View className='submit-footer'>
        <Button
          className={`submit-btn ${loading ? 'disabled' : ''}`}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? '提交中...' : '确认并提交订单'}
        </Button>
      </View>
    </View>
  )
}
