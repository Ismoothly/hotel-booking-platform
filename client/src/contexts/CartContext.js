import React, { createContext, useState, useCallback } from 'react';
import api from '../services/api';

/**
 * 购物车上下文
 */
export const CartContext = createContext();

/**
 * 购物车提供器组件
 */
export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [cartTotal, setCartTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * 计算购物车总价
   */
  const calculateTotal = useCallback((items) => {
    const total = items.reduce((sum, item) => sum + item.subtotal, 0);
    setCartTotal(total);
  }, []);

  /**
   * 添加商品到购物车 - 同时保存到后端
   */
  const addToCart = useCallback(async (item) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🛒 [CART] 开始添加商品到购物车:', item);

      // 检查是否已存在相同商品
      const existingIndex = cartItems.findIndex(
        (existingItem) =>
          existingItem.hotelId === item.hotelId &&
          existingItem.roomType === item.roomType &&
          new Date(existingItem.checkInDate).getTime() === new Date(item.checkInDate).getTime() &&
          new Date(existingItem.checkOutDate).getTime() === new Date(item.checkOutDate).getTime()
      );

      let updatedItems;
      if (existingIndex > -1) {
        // 更新数量
        updatedItems = [...cartItems];
        updatedItems[existingIndex].quantity += item.quantity || 1;
        updatedItems[existingIndex].subtotal =
          updatedItems[existingIndex].price *
          updatedItems[existingIndex].quantity *
          updatedItems[existingIndex].nights;
      } else {
        // 添加新商品
        updatedItems = [
          ...cartItems,
          {
            ...item,
            subtotal: (item.price || 0) * (item.quantity || 1) * (item.nights || 1)
          }
        ];
      }

      // 先请求后端，成功后再更新本地
      console.log('📤 [CART] 发送请求到后端: POST /api/cart');
      const response = await api.post('/cart', {
        hotelId: item.hotelId,
        roomType: item.roomType,
        checkInDate: item.checkInDate,
        checkOutDate: item.checkOutDate,
        quantity: item.quantity || 1,
        ...(item.version != null && { version: item.version }),
      });

      if (response && response.code === 200) {
        console.log('✅ [CART] 商品已保存到后端');
        setCartItems(updatedItems);
        calculateTotal(updatedItems);
      } else if (response && response.code === 409) {
        setError(response.message || '价格或房态已变更，请刷新后重试');
        const err = new Error(response.message || '价格或房态已变更，请刷新后重试');
        err.code = 409;
        err.latestVersion = response.latestVersion;
        setLoading(false);
        throw err;
      } else {
        console.warn('⚠️ [CART] 后端返回异常:', response);
        setError('购物车保存失败，请重试');
      }

      setLoading(false);
    } catch (err) {
      if (err.response?.data?.code === 409 || err.code === 409) {
        setError(err.response?.data?.message || err.message || '价格或房态已变更，请刷新后重试');
        const e = new Error(err.response?.data?.message || err.message || '价格或房态已变更，请刷新后重试');
        e.code = 409;
        throw e;
      }
      console.error('❌ [CART] 添加商品失败:', err.message);
      setError(err.message || '添加商品失败，请重试');
      setLoading(false);
      throw err;
    }
  }, [cartItems, calculateTotal]);

  /**
   * 删除购物车项 - 同时同步到后端
   */
  const removeFromCart = useCallback(async (index) => {
    try {
      setLoading(true);
      setError(null);

      console.log('🗑️ [CART] 开始删除第 ' + (index + 1) + ' 项');

      const updatedItems = cartItems.filter((_, i) => i !== index);
      setCartItems(updatedItems);
      calculateTotal(updatedItems);

      // 同步到后端
      console.log('📤 [CART] 发送请求到后端: DELETE /api/cart/item');
      const response = await api.delete('/cart/item', {
        data: { itemIndex: index }
      });

      if (response && response.code === 200) {
        console.log('✅ [CART] 购物车项已从后端删除');
      } else {
        console.warn('⚠️ [CART] 后端返回异常:', response);
        setError('删除失败，但本地已删除');
      }

      setLoading(false);
    } catch (err) {
      console.error('❌ [CART] 删除购物车项失败:', err.message);
      setError(err.message || '删除失败，请重试');
      setLoading(false);
    }
  }, [cartItems, calculateTotal]);

  /**
   * 更新购物车项数量 - 同时同步到后端
   */
  const updateQuantity = useCallback(
    async (index, quantity) => {
      try {
        setLoading(true);
        setError(null);

        if (quantity <= 0) {
          await removeFromCart(index);
          return;
        }

        console.log('📊 [CART] 更新第 ' + (index + 1) + ' 项数量为:', quantity);

        const updatedItems = [...cartItems];
        updatedItems[index].quantity = quantity;
        updatedItems[index].subtotal =
          updatedItems[index].price * quantity * updatedItems[index].nights;
        setCartItems(updatedItems);
        calculateTotal(updatedItems);

        // 同步到后端
        console.log('📤 [CART] 发送请求到后端: PUT /api/cart/item');
        const response = await api.put('/cart/item', {
          itemIndex: index,
          quantity: quantity
        });

        if (response && response.code === 200) {
          console.log('✅ [CART] 购物车项已在后端更新');
        } else {
          console.warn('⚠️ [CART] 后端返回异常:', response);
          setError('更新失败，但本地已更新');
        }

        setLoading(false);
      } catch (err) {
        console.error('❌ [CART] 更新购物车项失败:', err.message);
        setError(err.message || '更新失败，请重试');
        setLoading(false);
      }
    },
    [cartItems, removeFromCart, calculateTotal]
  );

  /**
   * 清空购物车 - 同时同步到后端
   */
  const clearCart = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🗑️ [CART] 开始清空购物车');

      setCartItems([]);
      setCartTotal(0);

      // 同步到后端
      console.log('📤 [CART] 发送请求到后端: DELETE /api/cart');
      const response = await api.delete('/cart');

      if (response && response.code === 200) {
        console.log('✅ [CART] 购物车已在后端清空');
      } else {
        console.warn('⚠️ [CART] 后端返回异常:', response);
        setError('清空失败，但本地已清空');
      }

      setLoading(false);
    } catch (err) {
      console.error('❌ [CART] 清空购物车失败:', err.message);
      setError(err.message || '清空失败，请重试');
      setLoading(false);
    }
  }, []);

  /**
   * 从 API 同步购物车
   */
  const syncCartFromAPI = useCallback(async (cartData) => {
    try {
      setLoading(true);
      setError(null);
      
      if (cartData && cartData.items) {
        setCartItems(cartData.items);
        calculateTotal(cartData.items);
      } else {
        clearCart();
      }
    } catch (err) {
      setError(err.message || '同步购物车失败');
    } finally {
      setLoading(false);
    }
  }, [calculateTotal, clearCart]);

  /**
   * 从服务端拉取购物车（用于 409 后刷新）
   */
  const fetchCart = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/cart');
      if (res && res.data) {
        if (res.data.items && res.data.items.length) {
          setCartItems(res.data.items);
          calculateTotal(res.data.items);
        } else {
          setCartItems([]);
          setCartTotal(0);
        }
      }
    } catch (err) {
      setError(err.message || '获取购物车失败');
    } finally {
      setLoading(false);
    }
  }, [calculateTotal]);

  const value = {
    cartItems,
    cartTotal,
    itemCount: cartItems.length,
    loading,
    error,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    syncCartFromAPI,
    fetchCart,
    setError
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

/**
 * 使用购物车上下文的 Hook
 */
export function useCart() {
  const context = React.useContext(CartContext);
  if (!context) {
    throw new Error('useCart 必须在 CartProvider 内部使用');
  }
  return context;
}
