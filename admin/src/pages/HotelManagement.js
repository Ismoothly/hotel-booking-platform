import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, InputNumber, Select, message, Popconfirm, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { hotelAPI, adminAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const { TextArea } = Input;
const { Option } = Select;

const HotelManagement = () => {
  const { user } = useAuth();
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [editingHotel, setEditingHotel] = useState(null);
  const [reviewHotel, setReviewHotel] = useState(null);
  const [form] = Form.useForm();
  const [reviewForm] = Form.useForm();

  useEffect(() => {
    fetchHotels();
  }, []);

  const fetchHotels = async () => {
    try {
      setLoading(true);
      let response;
      if (user.role === 'admin') {
        response = await adminAPI.getAllHotels();
      } else {
        response = await hotelAPI.getMerchantHotels();
      }
      setHotels(response.data || []);
    } catch (error) {
      message.error('获取酒店列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingHotel(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (hotel) => {
    setEditingHotel(hotel);
    // 将数组字段序列化为 JSON 字符串便于编辑
    form.setFieldsValue({
      ...hotel,
      rooms: JSON.stringify(hotel.rooms || [], null, 2),
      images: JSON.stringify(hotel.images || [], null, 2),
      facilities: JSON.stringify(hotel.facilities || [], null, 2),
      nearbyAttractions: JSON.stringify(hotel.nearbyAttractions || [], null, 2),
      nearbyShopping: JSON.stringify(hotel.nearbyShopping || [], null, 2)
    });
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await hotelAPI.deleteHotel(id);
      message.success('删除成功');
      fetchHotels();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSubmit = async (values) => {
    try {
      // 解析 JSON 字段
      const payload = { ...values };
      
      // 解析房型
      if (typeof payload.rooms === 'string') {
        payload.rooms = JSON.parse(payload.rooms);
      }
      
      // 解析可选的 JSON 字段
      if (payload.images && typeof payload.images === 'string') {
        payload.images = JSON.parse(payload.images);
      } else {
        payload.images = payload.images || [];
      }
      
      if (payload.facilities && typeof payload.facilities === 'string') {
        payload.facilities = JSON.parse(payload.facilities);
      } else {
        payload.facilities = payload.facilities || [];
      }
      
      if (payload.nearbyAttractions && typeof payload.nearbyAttractions === 'string') {
        payload.nearbyAttractions = JSON.parse(payload.nearbyAttractions);
      } else {
        payload.nearbyAttractions = payload.nearbyAttractions || [];
      }
      
      if (payload.nearbyShopping && typeof payload.nearbyShopping === 'string') {
        payload.nearbyShopping = JSON.parse(payload.nearbyShopping);
      } else {
        payload.nearbyShopping = payload.nearbyShopping || [];
      }

      if (editingHotel) {
        await hotelAPI.updateHotel(editingHotel._id, payload);
        message.success('更新成功');
      } else {
        await hotelAPI.createHotel(payload);
        message.success('创建成功');
      }
      setModalVisible(false);
      fetchHotels();
    } catch (error) {
      message.error(error.message || '操作失败');
    }
  };

  const handleReview = (hotel, action) => {
    setReviewHotel({ ...hotel, action });
    if (action === 'reject') {
      reviewForm.resetFields();
      setReviewModalVisible(true);
    } else {
      handleReviewSubmit(action);
    }
  };

  const handleReviewSubmit = async (action, reason = '') => {
    try {
      if (action === 'approve') {
        await adminAPI.approveHotel(reviewHotel._id);
        message.success('审核通过');
      } else if (action === 'reject') {
        await adminAPI.rejectHotel(reviewHotel._id, reason);
        message.success('已拒绝');
      } else if (action === 'publish') {
        await adminAPI.publishHotel(reviewHotel._id);
        message.success('已发布');
      } else if (action === 'unpublish') {
        await adminAPI.unpublishHotel(reviewHotel._id);
        message.success('已下线');
      }
      setReviewModalVisible(false);
      fetchHotels();
    } catch (error) {
      message.error(error.message || '操作失败');
    }
  };

  const columns = [
    { title: '酒店名称', dataIndex: 'nameCn', key: 'nameCn' },
    { title: '星级', dataIndex: 'starRating', key: 'starRating', render: (star) => `${star}星` },
    { title: '地址', dataIndex: 'address', key: 'address', ellipsis: true },
    {
      title: '审核状态',
      dataIndex: 'reviewStatus',
      key: 'reviewStatus',
      render: (status) => {
        const colors = { pending: 'orange', approved: 'green', rejected: 'red' };
        const texts = { pending: '待审核', approved: '已通过', rejected: '已拒绝' };
        return <Tag color={colors[status]}>{texts[status]}</Tag>;
      }
    },
    {
      title: '发布状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colors = { draft: 'default', published: 'success', unpublished: 'warning' };
        const texts = { draft: '草稿', published: '已发布', unpublished: '已下线' };
        return <Tag color={colors[status]}>{texts[status]}</Tag>;
      }
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          {user.role === 'merchant' && (
            <>
              <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
              <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record._id)}>
                <Button type="link" danger icon={<DeleteOutlined />}>删除</Button>
              </Popconfirm>
            </>
          )}
          {user.role === 'admin' && (
            <>
              {record.reviewStatus === 'pending' && (
                <>
                  <Button type="link" onClick={() => handleReview(record, 'approve')}>通过</Button>
                  <Button type="link" danger onClick={() => handleReview(record, 'reject')}>拒绝</Button>
                </>
              )}
              {record.reviewStatus === 'approved' && record.status !== 'published' && (
                <Button type="link" onClick={() => handleReview(record, 'publish')}>发布</Button>
              )}
              {record.status === 'published' && (
                <Button type="link" danger onClick={() => handleReview(record, 'unpublish')}>下线</Button>
              )}
            </>
          )}
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: 24 }}>
      <Space style={{ marginBottom: 16 }}>
        {user.role === 'merchant' && (
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增酒店
          </Button>
        )}
      </Space>

      <Table
        columns={columns}
        dataSource={hotels}
        rowKey="_id"
        loading={loading}
      />

      <Modal
        title={editingHotel ? '编辑酒店' : '新增酒店'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={800}
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item name="nameCn" label="酒店中文名" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="nameEn" label="酒店英文名" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="address" label="地址" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="city" label="城市" rules={[{ required: true, message: '请选择城市' }]}>
            <Select placeholder="请选择城市">
              <Option value="北京">北京</Option>
              <Option value="天津">天津</Option>
              <Option value="上海">上海</Option>
              <Option value="广州">广州</Option>
              <Option value="深圳">深圳</Option>
              <Option value="杭州">杭州</Option>
              <Option value="成都">成都</Option>
              <Option value="西安">西安</Option>
              <Option value="南京">南京</Option>
              <Option value="武汉">武汉</Option>
              <Option value="重庆">重庆</Option>
            </Select>
          </Form.Item>
          <Form.Item name="starRating" label="星级" rules={[{ required: true }]}>
            <Select>
              {[3, 4, 5].map(n => <Option key={n} value={n}>{n}星</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="openingDate" label="开业时间" rules={[{ required: true }]}>
            <Input type="date" />
          </Form.Item>
          <Form.Item
            name="rooms"
            label="房型（JSON格式）"
            rules={[
              { required: true, message: '请填写房型（JSON 数组）' },
              {
                validator: (_, value) => {
                  try {
                    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
                    if (!Array.isArray(parsed) || parsed.length === 0) {
                      return Promise.reject(new Error('至少需要一个房型'));
                    }
                    return Promise.resolve();
                  } catch (e) {
                    return Promise.reject(new Error('房型必须是有效的 JSON 数组'));
                  }
                }
              }
            ]}
          >
            <TextArea rows={4} placeholder='[{"type":"标准间","price":300,"description":"25平米"}]' />
          </Form.Item>
          <Form.Item name="images" label="图片URL（JSON数组，可选）">
            <TextArea rows={3} placeholder='["https://example.com/image1.jpg","https://example.com/image2.jpg"]' />
          </Form.Item>
          <Form.Item name="facilities" label="设施（JSON数组，可选）">
            <TextArea rows={3} placeholder='["免费WiFi","健身房","游泳池","餐厅"]' />
          </Form.Item>
          <Form.Item name="nearbyAttractions" label="景点（JSON数组，可选）">
            <TextArea rows={2} placeholder='["景点1","景点2","景点3"]' />
          </Form.Item>
          <Form.Item name="transportation" label="交通（可选）">
            <Input placeholder="地铁/公交等交通信息" />
          </Form.Item>
          <Form.Item name="nearbyShopping" label="购物（JSON数组，可选）">
            <TextArea rows={2} placeholder='["商场1","商场2"]' />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="拒绝原因"
        open={reviewModalVisible}
        onCancel={() => setReviewModalVisible(false)}
        onOk={() => {
          reviewForm.validateFields().then(values => {
            handleReviewSubmit('reject', values.reason);
          });
        }}
      >
        <Form form={reviewForm} layout="vertical">
          <Form.Item name="reason" label="拒绝原因" rules={[{ required: true }]}>
            <TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default HotelManagement;
