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
    form.setFieldsValue(hotel);
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
      if (editingHotel) {
        await hotelAPI.updateHotel(editingHotel.id, values);
        message.success('更新成功');
      } else {
        await hotelAPI.createHotel(values);
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
        await adminAPI.approveHotel(reviewHotel.id);
        message.success('审核通过');
      } else if (action === 'reject') {
        await adminAPI.rejectHotel(reviewHotel.id, reason);
        message.success('已拒绝');
      } else if (action === 'publish') {
        await adminAPI.publishHotel(reviewHotel.id);
        message.success('已发布');
      } else if (action === 'unpublish') {
        await adminAPI.unpublishHotel(reviewHotel.id);
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
              <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)}>
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
        rowKey="id"
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
          <Form.Item name="starRating" label="星级" rules={[{ required: true }]}>
            <Select>
              {[3, 4, 5].map(n => <Option key={n} value={n}>{n}星</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="openingDate" label="开业时间" rules={[{ required: true }]}>
            <Input type="date" />
          </Form.Item>
          <Form.Item name="rooms" label="房型（JSON格式）" rules={[{ required: true }]}>
            <TextArea rows={4} placeholder='[{"type":"标准间","price":300,"description":"25平米"}]' />
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
