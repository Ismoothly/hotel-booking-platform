import { View, Text, Input, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import './index.scss'

export default function Settings() {
  const [apiUrl, setApiUrl] = useState('')
  const [localIP, setLocalIP] = useState('')

  useEffect(() => {
    // 从存储中读取已配置的 API 地址
    const savedUrl = Taro.getStorageSync('API_BASE_URL')
    if (savedUrl) {
      setApiUrl(savedUrl)
    } else {
      setApiUrl('http://localhost:5000/api')
    }

    // 获取本机网络信息
    getNetworkInfo()
  }, [])

  // 获取网络信息
  const getNetworkInfo = () => {
    Taro.getSystemInfo({
      success: (res) => {
        console.log('系统信息:', res)
      }
    })

    Taro.getNetworkType({
      success: (res) => {
        console.log('网络类型:', res.networkType)
      }
    })
  }

  // 保存 API 地址
  const handleSave = () => {
    if (!apiUrl) {
      Taro.showToast({
        title: '请输入 API 地址',
        icon: 'none'
      })
      return
    }

    // 验证 URL 格式
    if (!apiUrl.startsWith('http://') && !apiUrl.startsWith('https://')) {
      Taro.showToast({
        title: '地址必须以 http:// 或 https:// 开头',
        icon: 'none'
      })
      return
    }

    Taro.setStorageSync('API_BASE_URL', apiUrl)
    Taro.showToast({
      title: '保存成功',
      icon: 'success'
    })
  }

  // 重置为默认地址
  const handleReset = () => {
    const defaultUrl = 'http://localhost:5000/api'
    setApiUrl(defaultUrl)
    Taro.removeStorageSync('API_BASE_URL')
    Taro.showToast({
      title: '已重置为默认地址',
      icon: 'success'
    })
  }

  // 测试连接
  const handleTest = async () => {
    Taro.showLoading({ title: '测试连接中...' })
    
    try {
      const response = await Taro.request({
        url: `${apiUrl}/hotels`,
        method: 'GET',
        timeout: 5000
      })

      Taro.hideLoading()

      if (response.statusCode === 200) {
        Taro.showModal({
          title: '连接成功',
          content: `状态码: ${response.statusCode}\n服务器正常响应`,
          showCancel: false
        })
      } else {
        Taro.showModal({
          title: '连接异常',
          content: `状态码: ${response.statusCode}`,
          showCancel: false
        })
      }
    } catch (error: any) {
      Taro.hideLoading()
      Taro.showModal({
        title: '连接失败',
        content: error.errMsg || '无法连接到服务器，请检查：\n1. 服务器是否启动\n2. IP地址是否正确\n3. 手机和电脑是否在同一网络',
        showCancel: false
      })
    }
  }

  // 使用预设地址
  const handlePreset = (preset: string) => {
    setApiUrl(preset)
  }

  return (
    <View className='settings-container'>
      <View className='settings-header'>
        <Text className='header-title'>API 配置</Text>
        <Text className='header-desc'>真机调试时需要配置后端服务器地址</Text>
      </View>

      <View className='settings-section'>
        <View className='section-title'>当前 API 地址</View>
        <Input
          className='input-field'
          type='text'
          value={apiUrl}
          onInput={(e) => setApiUrl(e.detail.value)}
          placeholder='http://192.168.1.100:5000/api'
        />
      </View>

      <View className='settings-section'>
        <View className='section-title'>快捷设置</View>
        <View className='preset-buttons'>
          <Button
            className='preset-btn'
            size='mini'
            onClick={() => handlePreset('http://localhost:5000/api')}
          >
            本地开发
          </Button>
          <Button
            className='preset-btn'
            size='mini'
            onClick={() => handlePreset('http://192.168.1.100:5000/api')}
          >
            局域网示例
          </Button>
        </View>
      </View>

      <View className='settings-tips'>
        <View className='tips-title'>💡 配置说明</View>
        <View className='tips-content'>
          <Text className='tips-item'>1. 模拟器调试：使用 localhost</Text>
          <Text className='tips-item'>2. 真机调试：使用电脑局域网 IP</Text>
          <Text className='tips-item'>3. 获取电脑 IP：在电脑终端运行 ipconfig (Windows) 或 ifconfig (Mac)</Text>
          <Text className='tips-item'>4. 确保手机和电脑在同一 WiFi 网络</Text>
          <Text className='tips-item'>5. 确保后端服务器已启动（端口 5000）</Text>
        </View>
      </View>

      <View className='settings-actions'>
        <Button className='action-btn primary' onClick={handleTest}>
          测试连接
        </Button>
        <Button className='action-btn success' onClick={handleSave}>
          保存配置
        </Button>
        <Button className='action-btn' onClick={handleReset}>
          重置默认
        </Button>
      </View>

      <View className='settings-footer'>
        <Text className='footer-text'>提示：配置后需要重启小程序才能生效</Text>
      </View>
    </View>
  )
}
