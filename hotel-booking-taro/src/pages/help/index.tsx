import { View, Text, ScrollView, Button, Input } from '@tarojs/components'
import { useState } from 'react'
import Taro, { useLoad } from '@tarojs/taro'
import './index.scss'

interface FAQItem {
  id: string
  question: string
  answer: string
  expanded?: boolean
}

const faqs: FAQItem[] = [
  {
    id: '1',
    question: '如何预订酒店？',
    answer: '1. 浏览酒店列表并选择喜欢的酒店\n2. 点击进入酒店详情页\n3. 选择房型并点击"立即预订"\n4. 填写入住信息确认预订'
  },
  {
    id: '2',
    question: '预订后如何取消？',
    answer: '您可以在"我的预订"页面中，找到相应的预订记录，点击"取消"按钮进行取消。提前7天取消可获得全额退款。'
  },
  {
    id: '3',
    question: '发票如何开具？',
    answer: '预订确认后，您可以在"我的预订"页面中点击"申请发票"。发票将在确认入住后5个工作日内发送至您的邮箱。'
  },
  {
    id: '4',
    question: '优惠券如何使用？',
    answer: '在预订时，在价格结算页面会显示可用的优惠券。选择您想要使用的优惠券后系统会自动计算最终价格。'
  },
  {
    id: '5',
    question: '商户如何上传酒店信息？',
    answer: '1. 登录为商户账户\n2. 在"我的酒店"页面点击"新增酒店"\n3. 填写酒店详细信息\n4. 提交后等待管理员审核'
  }
]

export default function Help() {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [feedbackText, setFeedbackText] = useState('')
  const [feedbackEmail, setFeedbackEmail] = useState('')
  const [showFeedback, setShowFeedback] = useState(false)
  const [feedbackLoading, setFeedbackLoading] = useState(false)

  useLoad(() => {
    // Load user email if available
    const userStr = Taro.getStorageSync('user_info')
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        setFeedbackEmail(user.email || '')
      } catch (e) {
        console.error('Failed to parse user info')
      }
    }
  })

  const toggleFAQ = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  const handleSubmitFeedback = async () => {
    if (!feedbackText.trim()) {
      Taro.showToast({
        title: '请输入反馈内容',
        icon: 'none'
      })
      return
    }

    setFeedbackLoading(true)
    try {
      // TODO: 调用反馈提交 API
      Taro.showToast({
        title: '反馈已提交，感谢您的建议！',
        icon: 'success'
      })
      setFeedbackText('')
      setShowFeedback(false)
    } catch (error) {
      Taro.showToast({
        title: '提交失败，请稍后重试',
        icon: 'none'
      })
    } finally {
      setFeedbackLoading(false)
    }
  }

  return (
    <ScrollView scrollY className='help-page'>
      <View className='help-container'>
        {/* 常见问题 */}
        <View className='section'>
          <Text className='section-title'>常见问题</Text>
          <View className='faq-list'>
            {faqs.map((faq) => (
              <View key={faq.id} className='faq-item'>
                <View
                  className='faq-question'
                  onClick={() => toggleFAQ(faq.id)}
                >
                  <Text className='question-text'>{faq.question}</Text>
                  <Text className={`arrow ${expandedId === faq.id ? 'expanded' : ''}`}>
                    ›
                  </Text>
                </View>
                {expandedId === faq.id && (
                  <View className='faq-answer'>
                    {faq.answer.split('\n').map((line, idx) => (
                      <Text key={idx} className='answer-line'>
                        {line}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* 联系我们 */}
        <View className='section'>
          <Text className='section-title'>联系我们</Text>
          <View className='contact-list'>
            <View className='contact-item'>
              <Text className='label'>客服热线</Text>
              <Text className='value'>400-123-4567</Text>
            </View>
            <View className='contact-item'>
              <Text className='label'>邮箱</Text>
              <Text className='value'>service@hotel.com</Text>
            </View>
            <View className='contact-item'>
              <Text className='label'>微信公众号</Text>
              <Text className='value'>易宿酒店官方</Text>
            </View>
            <View className='contact-item'>
              <Text className='label'>工作时间</Text>
              <Text className='value'>周一至周日 09:00-21:00</Text>
            </View>
          </View>
        </View>

        {/* 意见反馈 */}
        <View className='section feedback-section'>
          <Text className='section-title'>意见反馈</Text>
          {!showFeedback ? (
            <Button className='feedback-btn' onClick={() => setShowFeedback(true)}>
              提交反馈
            </Button>
          ) : (
            <View className='feedback-form'>
              <View className='form-group'>
                <Text className='label'>您的反馈</Text>
                <Input
                  type='text'
                  placeholder='请输入您的意见或建议'
                  value={feedbackText}
                  onInput={(e) => setFeedbackText(e.detail.value)}
                  className='feedback-input'
                />
              </View>

              <View className='form-group'>
                <Text className='label'>邮箱</Text>
                <Input
                  type='text'
                  placeholder='用于接收反馈回复'
                  value={feedbackEmail}
                  onInput={(e) => setFeedbackEmail(e.detail.value)}
                  className='feedback-input'
                />
              </View>

              <View className='form-actions'>
                <Button
                  className='submit-btn'
                  onClick={handleSubmitFeedback}
                  loading={feedbackLoading}
                  disabled={feedbackLoading}
                >
                  提交
                </Button>
                <Button
                  className='cancel-btn'
                  onClick={() => {
                    setShowFeedback(false)
                    setFeedbackText('')
                  }}
                >
                  取消
                </Button>
              </View>
            </View>
          )}
        </View>

        {/* 关于我们 */}
        <View className='section about-section'>
          <Text className='section-title'>关于我们</Text>
          <View className='about-content'>
            <Text className='about-text'>
              易宿酒店是一个专业的在线酒店预订平台，致力于为广大用户提供便捷、安全、放心的酒店预订服务。
            </Text>
            <Text className='about-version'>版本：1.0.0</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  )
}
