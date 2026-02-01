import React, { useState, useEffect } from 'react';
import { Table, Button, message, Tabs, Empty, Tag } from 'antd';
import { hotelAPI } from '../services/api';
import './MyBookings.css';

interface Booking {
  id: string;
  hotelName: string;
  roomType: string;
  checkInDate: string;
  checkOutDate: string;
  guestName: string;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
}

const MyBookings: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      // TODO: 调用预订列表 API
      setBookings([
        {
          id: '1',
          hotelName: '上海外滩豪华酒店',
          roomType: '豪华大床房',
          checkInDate: '2026-02-10',
          checkOutDate: '2026-02-12',
          guestName: '张三',
          totalPrice: 1776,
          status: 'confirmed'
        }
      ]);
    } catch (error) {
      message.error('获取预订列表失败');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'processing',
      confirmed: 'success',
      completed: 'default',
      cancelled: 'error'
    };
    return colors[status] || 'default';
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      pending: '待确认',
      confirmed: '已确认',
      completed: '已完成',
      cancelled: '已取消'
    };
    return texts[status] || status;
  };

  const columns = [
    { title: '酒店', dataIndex: 'hotelName', key: 'hotelName' },
    { title: '房型', dataIndex: 'roomType', key: 'roomType' },
    { title: '入住日期', dataIndex: 'checkInDate', key: 'checkInDate' },
    { title: '退房日期', dataIndex: 'checkOutDate', key: 'checkOutDate' },
    { title: '客人', dataIndex: 'guestName', key: 'guestName' },
    { title: '总价', dataIndex: 'totalPrice', key: 'totalPrice', render: (price) => `¥${price}` },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record: Booking) => (
        <div>
          {record.status === 'confirmed' && (
            <Button type="link" danger size="small">
              取消
            </Button>
          )}
          <Button type="link" size="small">
            详情
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="my-bookings-container">
      <h1>我的预订</h1>
      {bookings.length === 0 ? (
        <Empty description="暂无预订记录" style={{ marginTop: 50 }} />
      ) : (
        <Table columns={columns} dataSource={bookings} rowKey="id" loading={loading} />
      )}
    </div>
  );
};

export default MyBookings;
