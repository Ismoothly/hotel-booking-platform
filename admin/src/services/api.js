import axios from 'axios';

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
  (error) => {
    if (error.response?.status === 401) {
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
  getCurrentUser: () => api.get('/auth/me')
};

// 酒店API
export const hotelAPI = {
  getHotels: (params) => api.get('/hotels', { params }),
  getHotelById: (id) => api.get(`/hotels/${id}`),
  getMerchantHotels: () => api.get('/hotels/merchant/my-hotels'),
  createHotel: (data) => api.post('/hotels', data),
  updateHotel: (id, data) => api.put(`/hotels/${id}`, data),
  deleteHotel: (id) => api.delete(`/hotels/${id}`)
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
