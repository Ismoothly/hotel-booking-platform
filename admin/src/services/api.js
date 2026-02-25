import axios from 'axios';

// 使用完整 URL 而不是相对路径，避免代理问题
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
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
    const token = localStorage.getItem('admin_token');
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
    if (error.response?.status === 401) {
      const originalRequest = error.config;
      if (originalRequest?.url?.includes('/auth/refresh')) {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        window.location.href = '/login';
        return Promise.reject(error.response?.data || { message: '网络错误' });
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
            localStorage.setItem('admin_token', newAccessToken);
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return api(originalRequest);
          }
        } catch (refreshError) {
          refreshPromise = null;
        }
      }

      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || { message: '网络错误' });
  }
);

// 认证API
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getCurrentUser: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout')
};

// 酒店API
export const hotelAPI = {
  getHotels: (params) => api.get('/hotels', { params }),
  getHotelById: (id) => api.get(`/hotels/${id}`),
  getMerchantHotels: () => api.get('/hotels/merchant/my-hotels'),
  createHotel: (data) => api.post('/hotels', data),
  updateHotel: (id, data) => api.put(`/hotels/${id}`, data),
  updateHotelRoomPrices: (id, rooms) => api.put(`/hotels/${id}/room-prices`, { rooms }),
  deleteHotel: (id) => api.delete(`/hotels/${id}`)
};

// 上传API（需登录）
const uploadApiClient = axios.create({
  baseURL: 'http://localhost:5000/api',
  timeout: 30000,
  withCredentials: true,
  headers: { 'Content-Type': 'multipart/form-data' }
});
uploadApiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
uploadApiClient.interceptors.response.use((res) => res.data, (err) => Promise.reject(err.response?.data || err));

export const uploadAPI = {
  uploadImage: (formData) => uploadApiClient.post('/upload/image', formData)
};

// 管理员API
export const adminAPI = {
  getAllHotels: (params) => api.get('/admin/hotels', { params }),
  getPendingHotels: () => api.get('/admin/hotels/pending'),
  approveHotel: (id) => api.put(`/admin/hotels/${id}/approve`),
  rejectHotel: (id, reason) => api.put(`/admin/hotels/${id}/reject`, { reason }),
  publishHotel: (id) => api.put(`/admin/hotels/${id}/publish`),
  unpublishHotel: (id) => api.put(`/admin/hotels/${id}/unpublish`),
  restoreHotel: (id) => api.put(`/admin/hotels/${id}/restore`)
};

export default api;
