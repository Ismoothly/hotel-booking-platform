import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Button,
  Modal,
  Form,
  Input,
  Card,
  Space,
  Divider,
  Popup,
  Stepper
} from 'antd-mobile';
import { useCart } from '../contexts/CartContext';
import api from '../services/api';
import './Cart.css';

export default function Cart() {
  const { cartItems, cartTotal, removeFromCart, updateQuantity, clearCart, fetchCart } = useCart();
  const [formVisible, setFormVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  /**
   * 删除购物车项
   */
  const handleRemoveItem = (index) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个房间吗?',
      okText: '删除',
      cancelText: '取消',
      async onOk() {
        try {
          await removeFromCart(index);
        } catch (error) {
          Modal.alert({
            title: '删除失败',
            content: error.message || '删除购物车项失败，请重试',
            okText: '确定'
          });
        }
      }
    });
  };

  /**
   * 清空购物车
   */
  const handleClearCart = () => {
    Modal.confirm({
      title: '清空购物车',
      content: '确定要清空购物车中的所有房间吗?',
      okText: '清空',
      cancelText: '取消',
      async onOk() {
        try {
          await clearCart();
        } catch (error) {
          Modal.alert({
            title: '清空失败',
            content: error.message || '清空购物车失败，请重试',
            okText: '确定'
          });
        }
      }
    });
  };

  /**
   * 处理结账
   */
  const handleCheckout = () => {
    if (cartItems.length === 0) {
      Modal.alert({
        title: '购物车为空',
        content: '请先添加房间',
        okText: '确定'
      });
      return;
    }
    console.log('🛒 打开结账表单');
    setFormVisible(true);
  };

  /**
   * 提交订单
   */
  const handleSubmitOrder = async (values) => {
    try {
      setLoading(true);
      console.log('📝 [SUBMIT] 准备提交订单，表单数据:', values);

      const orderData = {
        guestName: values.guestName,
        guestPhone: values.guestPhone,
        guestEmail: values.guestEmail || '',
        notes: values.notes || '',
        paymentMethod: 'alipay'
      };

      console.log('📦 [API] 发送请求到 /api/orders，数据:', orderData);
      
      const response = await api.post('/orders', orderData);
      console.log('📥 [API] 收到响应:', response);

      if (response && response.code === 200) {
        console.log('✨ [SUCCESS] 订单创建成功！订单号:', response.data?.orderId);
        Modal.alert({
          title: '订单创建成功',
          content: `订单号: ${response.data?.orderId || '未知'}`,
          okText: '确定',
          onOk() {
            setFormVisible(false);
            form.resetFields();
            console.log('[NAV] 跳转到订单页面');
            window.location.href = '/orders';
          }
        });
      } else {
        console.warn('⚠️ [FAIL] 返回状态不是200:', response);
        Modal.alert({
          title: '订单创建失败',
          content: response?.message || '返回状态异常',
          okText: '确定'
        });
      }
    } catch (error) {
      console.error('❌ [ERROR] 订单创建异常:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      const is409 = error.response?.status === 409 || error.response?.data?.code === 409 || error.code === 409;
      Modal.alert({
        title: is409 ? '数据已变更' : '订单创建失败',
        content: is409 ? '价格或房态已变更，请刷新后重试' : (error.response?.data?.message || error.message || '未知错误'),
        okText: '确定',
        onOk: () => {
          if (is409 && fetchCart) fetchCart();
        }
      });
    } finally {
      setLoading(false);
      console.log('[DONE] 提交流程结束');
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('zh-CN', {
      month: '2-digit',
      day: '2-digit'
    });
  };

  if (cartItems.length === 0) {
    return (
      <div className="cart-empty">
        <div style={{ fontSize: 48, marginBottom: 16 }}>🛒</div>
        <p style={{ fontSize: 16, color: '#999', marginBottom: 24 }}>购物车为空</p>
        <Space direction="vertical" style={{ width: '100%' }} block>
          <Link to="/" style={{ width: '100%', display: 'block' }}>
            <Button color="primary" size="large" fill block>
              继续购物
            </Button>
          </Link>
          <Link to="/orders" style={{ width: '100%', display: 'block' }}>
            <Button color="default" size="large" fill block>
              📋 查看我的订单
            </Button>
          </Link>
        </Space>
      </div>
    );
  }

  return (
    <div className="cart-container">
      <div className="cart-header">
        <div style={{ fontSize: 16, fontWeight: 'bold' }}>购物车</div>
        <Space>
          <Link to="/orders" style={{ textDecoration: 'none' }}>
            <Button
              fill
              size="small"
              color="default"
              onClick={() => console.log('打开订单页面')}
            >
              📋 订单
            </Button>
          </Link>
          <Button
            fill
            size="small"
            color="danger"
            onClick={handleClearCart}
          >
            清空
          </Button>
        </Space>
      </div>

      <div className="cart-items">
        {cartItems.map((item, index) => (
          <Card key={index} className="cart-item-card">
            <div className="item-header">
              <div>
                <div style={{ fontSize: 14, fontWeight: 'bold' }}>
                  {item.hotelName}
                </div>
                <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                  {item.roomType}
                </div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 'bold', color: '#1890ff' }}>
                {item.originalPrice != null && item.originalPrice !== item.price ? (
                  <>
                    <span style={{ color: '#999', textDecoration: 'line-through', marginRight: 6 }}>¥{item.originalPrice}/晚</span>
                    <span>¥{item.price}/晚</span>
                  </>
                ) : (
                  <span>¥{item.price}/晚</span>
                )}
              </div>
            </div>

            <Divider />

            <div className="item-details">
              <div style={{ fontSize: 12, color: '#666' }}>
                <div>入住: {formatDate(item.checkInDate)}</div>
                <div>离房: {formatDate(item.checkOutDate)}</div>
                <div>夜数: {item.nights}晚</div>
              </div>

              <div className="quantity-control">
                <Stepper
                  value={item.quantity}
                  onChange={(value) => updateQuantity(index, value)}
                  style={{ width: 100 }}
                />
              </div>
            </div>

            <Divider />

            <div className="item-footer">
              <div style={{ fontSize: 14 }}>
                小计: <span style={{ fontWeight: 'bold', color: '#ff4d4f' }}>
                  ¥{item.subtotal.toFixed(2)}
                </span>
                {item.originalPrice != null && item.originalPrice > item.price && (
                  <span style={{ marginLeft: 8, color: '#52c41a', fontSize: 12 }}>
                    已优惠 ¥{((item.originalPrice - item.price) * item.nights * item.quantity).toFixed(2)}
                  </span>
                )}
              </div>
              <Button
                size="small"
                text
                color="danger"
                onClick={() => handleRemoveItem(index)}
              >
                🗑️ 删除
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <div className="cart-footer">
        <Card className="summary-card">
          <div className="summary-item">
            <span>商品数量:</span>
            <span>{cartItems.length}个房间</span>
          </div>
          <Divider />
          <div className="summary-item">
            <span>已优惠:</span>
            <span>
              ¥{cartItems.reduce((sum, it) => {
                const op = it.originalPrice != null ? it.originalPrice : it.price;
                const d = Math.max(0, op - it.price) * it.nights * it.quantity;
                return sum + d;
              }, 0).toFixed(2)}
            </span>
          </div>
          <Divider />
          <div className="summary-item total">
            <span>合计:</span>
            <span>¥{cartTotal.toFixed(2)}</span>
          </div>
        </Card>

        <Button
          color="primary"
          size="large"
          fill
          loading={loading}
          onClick={handleCheckout}
        >
          去结账
        </Button>
      </div>

      <Popup
        visible={formVisible}
        title="完善订单信息"
        onMaskClick={() => setFormVisible(false)}
        onClose={() => setFormVisible(false)}
        position="bottom"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmitOrder}
          style={{ padding: '16px' }}
          onFinishFailed={(e) => {
            console.warn('❌ 表单验证失败:', e);
          }}
        >
          <Form.Item
            label="客人姓名"
            name="guestName"
            rules={[
              { required: true, message: '请输入客人姓名' },
              { min: 2, message: '姓名至少需要2个字符' }
            ]}
          >
            <Input placeholder="请输入姓名" />
          </Form.Item>

          <Form.Item
            label="联系电话"
            name="guestPhone"
            rules={[
              { required: true, message: '请输入联系电话' },
              {
                pattern: /^1[3-9]\d{9}$/,
                message: '请输入有效的手机号'
              }
            ]}
          >
            <Input placeholder="请输入手机号" type="tel" />
          </Form.Item>

          <Form.Item
            label="电子邮箱"
            name="guestEmail"
            rules={[
              {
                type: 'email',
                message: '请输入有效的邮箱'
              }
            ]}
          >
            <Input placeholder="请输入邮箱（可选）" type="email" />
          </Form.Item>

          <Form.Item
            label="备注信息"
            name="notes"
          >
            <Input
              placeholder="输入任何特殊需求或备注"
              maxLength={200}
              showCount
              type="textarea"
            />
          </Form.Item>

          <Space style={{ width: '100%' }} direction="vertical">
            <Button
              color="primary"
              size="large"
              fill
              loading={loading}
              onClick={async () => {
                console.log('🔵 [CLICK] 创建订单按钮被点击！');
                try {
                  const values = await form.validateFields();
                  console.log('✅ [VALIDATE] 表单验证通过:', values);
                  await handleSubmitOrder(values);
                  console.log('✅ [SUBMIT] handleSubmitOrder 完成');
                } catch (error) {
                  console.error('❌ [ERROR] 表单验证或提交失败:', error.message);
                  if (error.errorFields) {
                    console.log('验证失败字段:', error.errorFields);
                  }
                }
              }}
            >
              创建订单
            </Button>
            <Button
              fill
              size="large"
              onClick={() => {
                console.log('🔴 取消结账');
                setFormVisible(false);
              }}
            >
              取消
            </Button>
          </Space>
        </Form>
      </Popup>
    </div>
  );
}
