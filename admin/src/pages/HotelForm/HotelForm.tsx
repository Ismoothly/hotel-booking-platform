import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  InputNumber,
  message,
  Select,
  Space,
  Divider,
  Rate,
  Row,
  Col
} from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './HotelForm.css';

interface RoomType {
  type: string;
  price: number;
  quantity: number;
  description: string;
}

const HotelForm: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [hotelData, setHotelData] = useState<any>(null);
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      fetchHotel();
    }
  }, [id]);

  const fetchHotel = async () => {
    try {
      const response = await api.get(`/api/hotels/${id}`);
      const hotel = response.data;
      setHotelData(hotel);
      form.setFieldsValue({
        ...hotel,
        rooms: hotel.rooms ? JSON.stringify(hotel.rooms) : '',
        images: hotel.images ? JSON.stringify(hotel.images) : '',
        facilities: hotel.facilities ? JSON.stringify(hotel.facilities) : '',
        nearbyAttractions: hotel.nearbyAttractions ? JSON.stringify(hotel.nearbyAttractions) : '',
        transportation: hotel.transportation ? JSON.stringify(hotel.transportation) : '',
        nearbyShopping: hotel.nearbyShopping ? JSON.stringify(hotel.nearbyShopping) : ''
      });
    } catch (error) {
      message.error('加载酒店信息失败');
    }
  };

  const validateJSON = (value: string) => {
    if (!value) return true;
    try {
      JSON.parse(value);
      return true;
    } catch {
      return false;
    }
  };

  const validateRooms = (value: string) => {
    if (!value) return Promise.reject(new Error('房型信息不能为空'));
    if (!validateJSON(value)) {
      return Promise.reject(new Error('房型信息必须是有效的 JSON 格式'));
    }
    try {
      const rooms = JSON.parse(value);
      if (!Array.isArray(rooms) || rooms.length === 0) {
        return Promise.reject(new Error('至少需要一个房型'));
      }
      return Promise.resolve();
    } catch {
      return Promise.reject(new Error('房型信息格式错误'));
    }
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const submitData = {
        ...values,
        rooms: validateJSON(values.rooms) ? JSON.parse(values.rooms) : [],
        images: values.images ? JSON.parse(values.images) : [],
        facilities: values.facilities ? JSON.parse(values.facilities) : [],
        nearbyAttractions: values.nearbyAttractions ? JSON.parse(values.nearbyAttractions) : [],
        transportation: values.transportation ? JSON.parse(values.transportation) : [],
        nearbyShopping: values.nearbyShopping ? JSON.parse(values.nearbyShopping) : []
      };

      if (id) {
        await api.put(`/api/hotels/${id}`, submitData);
        message.success('酒店信息更新成功');
      } else {
        await api.post('/api/hotels', submitData);
        message.success('酒店创建成功');
      }
      navigate('/admin');
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hotel-form-container">
      <Card title={id ? '编辑酒店' : '新增酒店'}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            status: 'draft'
          }}
        >
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="酒店名称"
                name="name"
                rules={[{ required: true, message: '请输入酒店名称' }]}
              >
                <Input placeholder="请输入酒店名称" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="城市"
                name="city"
                rules={[{ required: true, message: '请输入城市' }]}
              >
                <Input placeholder="例如：北京、上海" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="地址"
            name="address"
            rules={[{ required: true, message: '请输入酒店地址' }]}
          >
            <Input placeholder="详细地址" />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="星级"
                name="stars"
                rules={[{ required: true, message: '请选择星级' }]}
              >
                <Select placeholder="选择星级">
                  <Select.Option value={2}>2 星</Select.Option>
                  <Select.Option value={3}>3 星</Select.Option>
                  <Select.Option value={4}>4 星</Select.Option>
                  <Select.Option value={5}>5 星</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="评分"
                name="rating"
              >
                <InputNumber min={0} max={5} step={0.1} placeholder="例如：4.5" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="描述"
            name="description"
            rules={[{ required: true, message: '请输入酒店描述' }]}
          >
            <Input.TextArea rows={4} placeholder="酒店的详细描述" />
          </Form.Item>

          <Divider>房型信息（JSON格式）</Divider>

          <Form.Item
            label="房型列表"
            name="rooms"
            rules={[{ validator: validateRooms }]}
          >
            <Input.TextArea
              rows={6}
              placeholder={JSON.stringify([
                { type: '标准间', price: 288, quantity: 10, description: '双床房' },
                { type: '豪华间', price: 588, quantity: 5, description: '带浴缸' }
              ], null, 2)}
            />
          </Form.Item>

          <Divider>图片和设施</Divider>

          <Form.Item
            label="图片URL（JSON数组）"
            name="images"
          >
            <Input.TextArea
              rows={4}
              placeholder={JSON.stringify(['https://example.com/img1.jpg'], null, 2)}
            />
          </Form.Item>

          <Form.Item
            label="设施（JSON数组）"
            name="facilities"
          >
            <Input.TextArea
              rows={4}
              placeholder={JSON.stringify(['WiFi', '停车场', '健身房', '24小时前台'], null, 2)}
            />
          </Form.Item>

          <Divider>周边信息</Divider>

          <Form.Item
            label="附近景点（JSON对象）"
            name="nearbyAttractions"
          >
            <Input.TextArea
              rows={4}
              placeholder={JSON.stringify({ '故宫': '2km', '长城': '50km' }, null, 2)}
            />
          </Form.Item>

          <Form.Item
            label="交通信息（JSON对象）"
            name="transportation"
          >
            <Input.TextArea
              rows={4}
              placeholder={JSON.stringify({ '地铁': '1号线200米', '公交': '1路500米' }, null, 2)}
            />
          </Form.Item>

          <Form.Item
            label="周边购物（JSON对象）"
            name="nearbyShopping"
          >
            <Input.TextArea
              rows={4}
              placeholder={JSON.stringify({ '商场': '王府井商城300米', '超市': '永辉超市200米' }, null, 2)}
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                {id ? '更新' : '创建'}
              </Button>
              <Button onClick={() => navigate('/admin')}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default HotelForm;
