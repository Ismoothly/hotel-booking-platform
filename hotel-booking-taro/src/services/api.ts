import Taro from '@tarojs/taro'

// API 基础配置
const API_BASE_URL = 'http://localhost:5000/api'

interface RequestConfig {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: any
}

/**
 * 网络请求拦截器
 */
const request = async (config: RequestConfig) => {
  try {
    // 从本地存储获取 token
    const token = Taro.getStorageSync('user_token')

    const response = await Taro.request({
      url: `${API_BASE_URL}${config.url}`,
      method: config.method || 'GET',
      data: config.data,
      header: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
      }
    })

    // 处理响应
    if (response.statusCode === 401) {
      // token 过期，清除本地数据
      Taro.removeStorageSync('user_token')
      Taro.removeStorageSync('user_info')
      Taro.redirectTo({ url: '/pages/login/index' })
      return Promise.reject(new Error('登录已过期，请重新登录'))
    }

    if (response.statusCode >= 400) {
      const errorMsg = response.data?.message || '请求失败'
      return Promise.reject(new Error(errorMsg))
    }

    return response.data
  } catch (error: any) {
    Taro.showToast({
      title: error.message || '网络请求失败',
      icon: 'none'
    })
    return Promise.reject(error)
  }
}

/**
 * 认证 API
 */
export const authAPI = {
  login: (username: string, password: string) =>
    request({
      url: '/auth/login',
      method: 'POST',
      data: { username, password }
    }),
  register: (data: { username: string; password: string; email: string; role?: string }) =>
    request({
      url: '/auth/register',
      method: 'POST',
      data
    }),
  getCurrentUser: () =>
    request({
      url: '/auth/me',
      method: 'GET'
    })
}

/**
 * 酒店 API
 */
export const hotelAPI = {
  getHotels: (filters?: any) =>
    request({
      url: `/hotels?${new URLSearchParams(filters).toString()}`,
      method: 'GET'
    }),
  getHotelById: (id: string) =>
    request({
      url: `/hotels/${id}`,
      method: 'GET'
    }),
  createHotel: (data: any) =>
    request({
      url: '/hotels',
      method: 'POST',
      data
    }),
  updateHotel: (id: string, data: any) =>
    request({
      url: `/hotels/${id}`,
      method: 'PUT',
      data
    }),
  deleteHotel: (id: string) =>
    request({
      url: `/hotels/${id}`,
      method: 'DELETE'
    })
}

export default request
