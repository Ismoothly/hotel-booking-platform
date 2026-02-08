import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Card,
  Button,
  Modal,
  Form,
  Input,
  Empty,
  Divider,
  Tag,
  Popup,
  Space,
  Collapse
} from 'antd-mobile';
import api from '../services/api';
import './Orders.css';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filter !== 'all') {
        params.status = filter;
      }

      const response = await api.get('/orders', { params });

      if (response.code === 200) {
        setOrders(response.data.orders || []);
      }
    } catch (error) {
      Modal.alert({
        title: '加载订单失败',
        content: error.response?.data?.message || error.message,
        okText: '确定'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  const handleShowDetail = (order) => {
    setSelectedOrder(order);
    setDetailVisible(true);
  };

  const handleCancelOrder = async () => {
    if (!selectedOrder) return;

    try {
      const response = await api.put(
        `/orders/${selectedOrder.orderId}/cancel`,
        { reason: cancelReason }
      );

      if (response.code === 200) {
        Modal.alert({
          title: '订单取消成功',
          okText: '确定',
          onOk() {
            setDetailVisible(false);
            setCancelReason('');
            fetchOrders();
          }
        });
      }
    } catch (error) {
      Modal.alert({
        title: '取消订单失败',
        content: error.response?.data?.message || error.message,
        okText: '确定'
      });
    }
  };

  const handlePayment = async () => {
    if (!selectedOrder) return;

    try {
      const response = await api.put(
        `/orders/${selectedOrder.orderId}/pay`
      );

      if (response.code === 200) {
        Modal.alert({
          title: '支付成功',
          content: '订单已支付',
          okText: '确定',
          onOk() {
            setDetailVisible(false);
            fetchOrders();
          }
        });
      }
    } catch (error) {
      Modal.alert({
        title: '支付失败',
        content: error.response?.data?.message || error.message,
        okText: '确定'
      });
    }
  };

  const getStatusTag = (status) => {
    const statusMap = {
      pending: { color: 'warning', label: '待支付' },
      confirmed: { color: 'processing', label: '已确认' },
      paid: { color: 'success', label: '已支付' },
      cancelled: { color: 'default', label: '已取消' }
    };
    return statusMap[status] || { color: 'default', label: status };
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCheckDate = (date) => {
    return new Date(date).toLocaleDateString('zh-CN', {
      month: '2-digit',
      day: '2-digit'
    });
  };

  if (loading && orders.length === 0) {
    return (
      <div className="orders-loading">
        <p>加载中...</p>
      </div>
    );
  }

  return (
    <div className="orders-container">
      <div className="orders-header">
        <Link to="/cart" style={{ textDecoration: 'none' }}>
          <Button fill size="small" color="default">
            🛒 购物车
          </Button>
        </Link>
        <div style={{ fontSize: 16, fontWeight: 'bold' }}>我的订单</div>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <Button fill size="small" color="primary">
            首页
          </Button>
        </Link>
      </div>

      <div className="orders-filter">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: '4px',
            border: '1px solid #ddd',
            fontSize: '14px'
          }}
        >
          <option value="all">全部</option>
          <option value="pending">待支付</option>
          <option value="confirmed">已确认</option>
          <option value="paid">已支付</option>
          <option value="cancelled">已取消</option>
        </select>
      </div>

      {orders.length === 0 ? (
        <Empty description="暂无订单" />
      ) : (
        <div className="orders-list">
          {orders.map((order) => {
            const statusInfo = getStatusTag(order.status);
            return (
              <Card key={order._id} className="order-card">
                <div className="order-header">
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 'bold' }}>
                      订单号: {order.orderId}
                    </div>
                    <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                      创建于 {formatDate(order.createdAt)}
                    </div>
                  </div>
                  <Tag color={statusInfo.color}>
                    {statusInfo.label}
                  </Tag>
                </div>

                <Divider />

                <div className="order-items">
                  {order.items && order.items.map((item, index) => (
                    <div key={index} className="order-item">
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: '500' }}>
                          {item.hotelName}
                        </div>
                        <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
                          {item.roomType}
                        </div>
                        <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>
                          {formatCheckDate(item.checkInDate)} - {formatCheckDate(item.checkOutDate)} ({item.nights}晚)
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 13, fontWeight: 'bold', color: '#ff4d4f' }}>
                          ¥{item.subtotal.toFixed(2)}
                        </div>
                        <div style={{ fontSize: 11, color: '#999' }}>
                          × {item.quantity}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Divider />

                <div className="order-total">
                  <span>合计金额:</span>
                  <span style={{ fontSize: 16, fontWeight: 'bold', color: '#ff4d4f' }}>
                    ¥{order.totalPrice.toFixed(2)}
                  </span>
                </div>

                <div className="order-actions">
                  <Button
                    fill
                    size="small"
                    onClick={() => handleShowDetail(order)}
                  >
                    详情
                  </Button>
                  {order.status === 'pending' && (
                    <Button
                      fill
                      size="small"
                      color="primary"
                      onClick={() => {
                        setSelectedOrder(order);
                        handlePayment();
                      }}
                    >
                      支付
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {selectedOrder && (
        <Popup
          visible={detailVisible}
          title="订单详情"
          onMaskClick={() => setDetailVisible(false)}
          onClose={() => setDetailVisible(false)}
          position="bottom"
        >
          <div style={{ padding: '16px' }}>
            <Collapse
              items={[
                {
                  key: '1',
                  title: '订单信息',
                  children: (
                    <div className="detail-section">
                      <div className="detail-item">
                        <span>订单号:</span>
                        <span style={{ fontWeight: 'bold' }}>{selectedOrder.orderId}</span>
                      </div>
                      <div className="detail-item">
                        <span>状态:</span>
                        <Tag color={getStatusTag(selectedOrder.status).color}>
                          {getStatusTag(selectedOrder.status).label}
                        </Tag>
                      </div>
                      <div className="detail-item">
                        <span>支付方式:</span>
                        <span>{selectedOrder.paymentMethod === 'alipay' ? '支付宝' : '微信支付'}</span>
                      </div>
                      <div className="detail-item">
                        <span>创建时间:</span>
                        <span>{formatDate(selectedOrder.createdAt)}</span>
                      </div>
                    </div>
                  )
                },
                {
                  key: '2',
                  title: '房间信息',
                  children: (
                    <div className="detail-section">
                      {selectedOrder.items && selectedOrder.items.map((item, index) => (
                        <div key={index} style={{ marginBottom: 12 }}>
                          <div style={{ fontSize: 13, fontWeight: 'bold' }}>
                            {item.hotelName}
                          </div>
                          <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                            房型: {item.roomType}
                          </div>
                          <div style={{ fontSize: 12, color: '#666' }}>
                            日期: {formatCheckDate(item.checkInDate)} - {formatCheckDate(item.checkOutDate)}
                          </div>
                          <div style={{ fontSize: 12, color: '#666' }}>
                            数量: {item.quantity} × ¥{item.price}/晚 × {item.nights}晚
                          </div>
                          <div style={{ fontSize: 12, fontWeight: 'bold', color: '#ff4d4f', marginTop: 4 }}>
                            小计: ¥{item.subtotal.toFixed(2)}
                          </div>
                          {index < selectedOrder.items.length - 1 && <Divider />}
                        </div>
                      ))}
                    </div>
                  )
                },
                {
                  key: '3',
                  title: '客人信息',
                  children: (
                    <div className="detail-section">
                      <div className="detail-item">
                        <span>姓名:</span>
                        <span>{selectedOrder.guestName}</span>
                      </div>
                      <div className="detail-item">
                        <span>电话:</span>
                        <span>{selectedOrder.guestPhone}</span>
                      </div>
                      {selectedOrder.guestEmail && (
                        <div className="detail-item">
                          <span>邮箱:</span>
                          <span>{selectedOrder.guestEmail}</span>
                        </div>
                      )}
                      {selectedOrder.notes && (
                        <div className="detail-item">
                          <span>备注:</span>
                          <span>{selectedOrder.notes}</span>
                        </div>
                      )}
                    </div>
                  )
                }
              ]}
            />

            <Divider />
            <div className="order-total" style={{ marginBottom: 16 }}>
              <span>合计金额:</span>
              <span style={{ fontSize: 18, fontWeight: 'bold', color: '#ff4d4f' }}>
                ¥{selectedOrder.totalPrice.toFixed(2)}
              </span>
            </div>

            {selectedOrder.status === 'pending' && (
              <>
                <Form
                  layout="vertical"
                  size="small"
                  style={{ marginBottom: 12 }}
                >
                  <Form.Item label="取消原因">
                    <Input
                      placeholder="输入取消原因（可选）"
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      maxLength={100}
                    />
                  </Form.Item>
                </Form>

                <Space style={{ width: '100%' }} direction="vertical">
                  <Button
                    fill
                    color="primary"
                    onClick={() => handlePayment()}
                  >
                    现在支付
                  </Button>
                  <Button
                    fill
                    color="danger"
                    onClick={handleCancelOrder}
                  >
                    取消订单
                  </Button>
                  <Button
                    fill
                    onClick={() => setDetailVisible(false)}
                  >
                    关闭
                  </Button>
                </Space>
              </>
            )}
          </div>
        </Popup>
      )}
    </div>
  );
}
