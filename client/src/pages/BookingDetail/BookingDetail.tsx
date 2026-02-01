import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Form, Input, Button, DatePicker, message, Card, Row, Col, Divider } from 'antd';
import './BookingDetail.css';

const BookingDetail: React.FC = () => {
  const params = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleBooking = async (values: any) => {
    setLoading(true);
    try {
      // TODO: 调用预订 API
      message.success('预订成功');
      navigate('/my-bookings');
    } catch (error: any) {
      message.error(error.message || '预订失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="booking-detail-container">
      <Card title="预订酒店" className="booking-card">
        <Form form={form} onFinish={handleBooking} layout="vertical">
          <Row gutter={[20, 20]}>
            <Col span={24}>
              <Divider>入住信息</Divider>
            </Col>
            <Col span={12}>
              <Form.Item
                name="checkInDate"
                label="入住日期"
                rules={[{ required: true, message: '请选择入住日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="checkOutDate"
                label="退房日期"
                rules={[{ required: true, message: '请选择退房日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Divider>客人信息</Divider>
            </Col>
            <Col span={12}>
              <Form.Item
                name="guestName"
                label="姓名"
                rules={[{ required: true, message: '请输入姓名' }]}
              >
                <Input placeholder="请输入姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="guestPhone"
                label="电话"
                rules={[{ required: true, message: '请输入联系电话' }]}
              >
                <Input placeholder="请输入联系电话" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading} block size="large">
                  确认预订
                </Button>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>
    </div>
  );
};

export default BookingDetail;
