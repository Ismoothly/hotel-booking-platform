import { View, Text, Textarea, Button } from '@tarojs/components'
import { useState } from 'react'
import Taro, { useLoad } from '@tarojs/taro'
import { agentAPI } from '../../services/api'
import './index.scss'

export default function Help() {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)

  useLoad(() => {
    console.log('帮助页面加载')
  })

  const handleAskAgent = async () => {
    const message = question.trim()
    if (!message) {
      Taro.showToast({ title: '请输入问题', icon: 'none' })
      return
    }

    try {
      setLoading(true)
      const response: any = await agentAPI.chat(message)
      setAnswer(response?.data?.reply || '智能体暂时没有返回内容')
    } catch (error: any) {
      setAnswer('请求失败，请稍后重试')
      console.error('Agent 请求失败:', error?.message || error)
    } finally {
      setLoading(false)
    }
  }

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

      <View className='agent-section'>
        <Text className='agent-title'>🤖 智能体问答（MVP）</Text>
        <Textarea
          className='agent-input'
          value={question}
          placeholder='例如：如何排查下单失败？'
          maxlength={500}
          onInput={(e) => setQuestion((e.detail.value || '').toString())}
        />
        <Button className='agent-btn' loading={loading} onClick={handleAskAgent}>
          {loading ? '生成中...' : '发送给智能体'}
        </Button>
        {!!answer && (
          <View className='agent-answer'>
            <Text className='answer-title'>智能体建议</Text>
            <Text className='answer-text'>{answer}</Text>
          </View>
        )}
      </View>
    </View>
  )
}
