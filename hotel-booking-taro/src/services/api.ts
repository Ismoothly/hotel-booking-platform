import Taro from "@tarojs/taro";

// API 基础配置 - 真机环境下需要改成宿主机IP
// 开发环境: http://localhost:5000/api
// 真机测试: http://<你的电脑局域网IP>:5000/api (例如: http://192.168.1.100:5000/api)

// ⚠️ 每次都动态读取最新的 API 地址，不缓存
const getAPIBaseURL = () => {
  // 如果是真机环境，可以从本地存储读取配置的后端地址
  const customURL = Taro.getStorageSync("API_BASE_URL");
  if (customURL) {
    console.log("📡 使用配置的 API 地址:", customURL);
    return customURL;
  }
  console.log("📡 使用默认 API 地址: http://localhost:5000/api");
  return "http://localhost:5000/api";
};

// 导出函数以便动态修改API地址
export const setAPIBaseURL = (url: string) => {
  Taro.setStorageSync("API_BASE_URL", url);
  console.log("✅ API 地址已设置:", url);
};

interface RequestConfig {
  url: string;
  method?: "GET" | "POST" | "PUT" | "DELETE";
  data?: any;
}

/**
 * 网络请求拦截器
 */
const request = async (config: RequestConfig) => {
  try {
    // ⚠️ 每次请求都动态获取最新的 API 地址
    const API_BASE_URL = getAPIBaseURL();

    // 从本地存储获取 token
    const token = Taro.getStorageSync("user_token");

    const response = await Taro.request({
      url: `${API_BASE_URL}${config.url}`,
      method: config.method || "GET",
      data: config.data,
      header: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    // 处理响应
    if (response.statusCode === 401) {
      // token 过期，清除本地数据
      Taro.removeStorageSync("user_token");
      Taro.removeStorageSync("user_info");
      Taro.redirectTo({ url: "/pages/login/index" });
      return Promise.reject(new Error("登录已过期，请重新登录"));
    }

    if (response.statusCode >= 400) {
      let msg = "请求失败";
      const data: any = response.data;
      if (data && typeof data === "object" && data.message) {
        msg = data.message;
      }
      return Promise.reject(new Error(msg));
    }

    return response.data;
  } catch (error: any) {
    const API_BASE_URL = getAPIBaseURL();
    console.error("🔴 API 请求失败:", {
      url: config.url,
      baseURL: API_BASE_URL,
      method: config.method,
      error: error.message,
      errMsg: error.errMsg,
    });

    const errorMsg = error.message || error.errMsg || "网络请求失败";
    Taro.showToast({
      title: errorMsg,
      icon: "none",
    });
    return Promise.reject(error);
  }
};

/**
 * 认证 API
 */
export const authAPI = {
  login: (username: string, password: string) =>
    request({
      url: "/auth/login",
      method: "POST",
      data: { username, password },
    }),
  register: (data: {
    username: string;
    password: string;
    email: string;
    role?: string;
  }) =>
    request({
      url: "/auth/register",
      method: "POST",
      data,
    }),
  getCurrentUser: () =>
    request({
      url: "/auth/me",
      method: "GET",
    }),
};

/**
 * 酒店 API
 */
export const hotelAPI = {
  getHotels: (filters?: any) =>
    request({
      url: `/hotels?${new URLSearchParams(filters).toString()}`,
      method: "GET",
    }),
  getHotelById: (id: string) =>
    request({
      url: `/hotels/${id}`,
      method: "GET",
    }),
  createHotel: (data: any) =>
    request({
      url: "/hotels",
      method: "POST",
      data,
    }),
  updateHotel: (id: string, data: any) =>
    request({
      url: `/hotels/${id}`,
      method: "PUT",
      data,
    }),
  deleteHotel: (id: string) =>
    request({
      url: `/hotels/${id}`,
      method: "DELETE",
    }),
};

/**
 * 购物车 API
 */
export const cartAPI = {
  getCart: () =>
    request({
      url: "/cart",
      method: "GET",
    }),
  addToCart: (data: {
    hotelId: string;
    roomType: string;
    checkInDate: string;
    checkOutDate: string;
    quantity?: number;
  }) =>
    request({
      url: "/cart",
      method: "POST",
      data,
    }),
  updateCartItem: (itemIndex: number, quantity: number) =>
    request({
      url: "/cart/item",
      method: "PUT",
      data: { itemIndex, quantity },
    }),
  removeCartItem: (itemIndex: number) =>
    request({
      url: "/cart/item",
      method: "DELETE",
      data: { itemIndex },
    }),
  clearCart: () =>
    request({
      url: "/cart",
      method: "DELETE",
    }),
};

/**
 * 订单 API
 */
export const orderAPI = {
  getMyOrders: (params?: { status?: string; page?: number; limit?: number }) =>
    request({
      url: `/orders?${new URLSearchParams(params as any).toString()}`,
      method: "GET",
    }),
  getOrderDetail: (orderId: string) =>
    request({
      url: `/orders/${orderId}`,
      method: "GET",
    }),
  createOrder: (data: {
    guestName: string;
    guestPhone: string;
    guestEmail?: string;
    notes?: string;
    paymentMethod?: string;
  }) =>
    request({
      url: "/orders",
      method: "POST",
      data,
    }),
  confirmOrder: (orderId: string) =>
    request({
      url: `/orders/${orderId}/confirm`,
      method: "PUT",
    }),
  completePayment: (orderId: string) =>
    request({
      url: `/orders/${orderId}/pay`,
      method: "PUT",
    }),
  cancelOrder: (orderId: string, reason?: string) =>
    request({
      url: `/orders/${orderId}/cancel`,
      method: "PUT",
      data: { reason },
    }),
};

export default request;
