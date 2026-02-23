import { View, Text } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'
import './index.scss'

export default function MyHotels() {
  useLoad(() => {
    console.log('我的酒店页面加载')
  })

  return (
    <View className='my-hotels-page'>
      <View className='empty-state'>
        <Text className='empty-icon'>🏨</Text>
        <Text className='empty-text'>我的酒店功能开发中</Text>
        <Text className='empty-desc'>敬请期待</Text>
      </View>
    </View>
  )
}
