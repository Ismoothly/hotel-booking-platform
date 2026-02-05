import axios from 'axios';

// 创建axios实例
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

let refreshPromise = null;

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
  async (error) => {
    if (error.response) {
      // 处理401未授权错误
      if (error.response.status === 401) {
        const originalRequest = error.config;
        if (originalRequest?.url?.includes('/auth/refresh')) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/';
          return Promise.reject(error.response.data);
        }
        if (!originalRequest._retry) {
          originalRequest._retry = true;
          try {
            if (!refreshPromise) {
              refreshPromise = api.post('/auth/refresh');
            }
            const refreshRes = await refreshPromise;
            refreshPromise = null;
            const newAccessToken = refreshRes?.data?.accessToken;
            if (newAccessToken) {
              localStorage.setItem('token', newAccessToken);
              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
              return api(originalRequest);
            }
          } catch (refreshError) {
            refreshPromise = null;
          }
        }

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

// 认证API
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getCurrentUser: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout')
};

export default api;
