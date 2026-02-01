import axios from 'axios';

// 创建axios实例
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 从localStorage获取token
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response) {
      // 处理401未授权错误
      if (error.response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
      }
      return Promise.reject(error.response.data);
    }
    return Promise.reject({ message: '网络错误，请稍后重试' });
  }
);

// 酒店API
export const hotelAPI = {
  // 获取酒店列表
  getHotels: (params) => api.get('/hotels', { params }),
  
  // 获取酒店详情
  getHotelById: (id) => api.get(`/hotels/${id}`),
};

export default api;
