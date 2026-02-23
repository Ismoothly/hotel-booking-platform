import { View, Text } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'
import './index.scss'

export default function Help() {
  useLoad(() => {
    console.log('帮助页面加载')
  })

  return (
    <View className='help-page'>
      <View className='help-section'>
        <View className='help-item'>
          <Text className='icon'>📱</Text>
          <Text className='title'>联系客服</Text>
          <Text className='desc'>客服热线：400-123-4567</Text>
        </View>
        
        <View className='help-item'>
          <Text className='icon'>📧</Text>
          <Text className='title'>电子邮箱</Text>
          <Text className='desc'>support@hotel.com</Text>
        </View>

        <View className='help-item'>
          <Text className='icon'>🕐</Text>
          <Text className='title'>工作时间</Text>
          <Text className='desc'>周一至周日 9:00-22:00</Text>
        </View>
      </View>

      <View className='empty-state'>
        <Text className='empty-text'>更多功能开发中，敬请期待</Text>
      </View>
    </View>
  )
}
