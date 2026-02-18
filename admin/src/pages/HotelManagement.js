import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Cascader,
  Checkbox,
  message,
  Popconfirm,
  Tag,
  Upload,
  Card,
  Row,
  Col,
  Descriptions,
  Image
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, InboxOutlined, EyeOutlined } from '@ant-design/icons';
import { hotelAPI, adminAPI, uploadAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { regionData, getRegionValueFromHotel } from '../data/region';

const { TextArea } = Input;
const { Option } = Select;

const DEFAULT_FACILITIES = ['免费WiFi', '健身房', '商务中心', '餐厅'];

const HotelManagement = () => {
  const { user } = useAuth();
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [editingHotel, setEditingHotel] = useState(null);
  const [reviewHotel, setReviewHotel] = useState(null);
  const [detailHotel, setDetailHotel] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [reviewForm] = Form.useForm();
  const [imageList, setImageList] = useState([]);

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
    setImageList([]);
    form.setFieldsValue({
      rooms: [{ type: '', price: undefined, description: '', quantity: 1 }],
      facilities: [],
      facilityCustom: []
    });
    setModalVisible(true);
  };

  const handleEdit = (hotel) => {
    setEditingHotel(hotel);
    const regionValue = getRegionValueFromHotel(hotel);
    const prefix = regionValue ? regionValue.join('') : '';
    const detailAddress = (hotel.address || '').replace(prefix, '').trim();
    const facilities = hotel.facilities || [];
    const defaultFacs = facilities.filter((f) => DEFAULT_FACILITIES.includes(f));
    const customFacs = facilities.filter((f) => !DEFAULT_FACILITIES.includes(f));
    const openDate = hotel.openingDate
      ? new Date(hotel.openingDate).toISOString().slice(0, 10)
      : '';
    form.setFieldsValue({
      nameCn: hotel.nameCn,
      nameEn: hotel.nameEn,
      region: regionValue,
      detailAddress: detailAddress || hotel.address || '',
      starRating: hotel.starRating,
      openingDate: openDate,
      transportation: hotel.transportation || '',
      rooms: (hotel.rooms || []).map((r) => ({
        type: r.type,
        price: r.price,
        description: r.description || '',
        quantity: r.quantity ?? 1
      })),
      facilities: defaultFacs,
      facilityCustom: customFacs,
      nearbyAttractions: Array.isArray(hotel.nearbyAttractions)
        ? hotel.nearbyAttractions.join('\n')
        : (hotel.nearbyAttractions || ''),
      nearbyShopping: Array.isArray(hotel.nearbyShopping)
        ? hotel.nearbyShopping.join('\n')
        : (hotel.nearbyShopping || '')
    });
    setImageList(
      (hotel.images || []).map((url, i) => ({
        uid: `existing-${i}`,
        url,
        name: `图片${i + 1}`,
        status: 'done'
      }))
    );
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
      const { region, detailAddress, rooms, facilities, facilityCustom, nearbyAttractions, nearbyShopping, nameCn, nameEn, starRating, openingDate, transportation } = values;
      const city = region && region.length >= 2 ? region[1] : '';
      const addressParts = region && region.length ? region : [];
      const address = addressParts.length ? addressParts.join('') + (detailAddress ? detailAddress.trim() : '') : (detailAddress || '');
      const facilityList = [...(facilities || []), ...(facilityCustom || [])].filter(Boolean);
      const payload = {
        nameCn,
        nameEn,
        starRating,
        openingDate: openingDate || undefined,
        transportation: transportation || '',
        city,
        address: address.trim(),
        rooms: (rooms || []).map((r) => ({
          type: r.type,
          price: Number(r.price),
          description: r.description || '',
          quantity: Number(r.quantity) || 1
        })).filter((r) => r.type),
        facilities: facilityList,
        nearbyAttractions: typeof nearbyAttractions === 'string'
          ? nearbyAttractions.split(/\n/).map((s) => s.trim()).filter(Boolean)
          : (Array.isArray(nearbyAttractions) ? nearbyAttractions : []),
        nearbyShopping: typeof nearbyShopping === 'string'
          ? nearbyShopping.split(/\n/).map((s) => s.trim()).filter(Boolean)
          : (Array.isArray(nearbyShopping) ? nearbyShopping : []),
        images: imageList.map((f) => f.url || f.response?.url || f.response?.data?.url || f.thumbUrl).filter(Boolean)
      };

      if (editingHotel) {
        await hotelAPI.updateHotel(editingHotel._id, payload);
        message.success(user.role === 'merchant' ? '更新成功，请等待管理员重新审核' : '更新成功');
      } else {
        await hotelAPI.createHotel(payload);
        message.success('创建成功');
      }
      setModalVisible(false);
      fetchHotels();
    } catch (error) {
      const errMsg = error?.message || (Array.isArray(error?.errors) ? error.errors.join('；') : '') || '操作失败';
      message.error(errMsg);
    }
  };

  const handleReview = (hotel, action) => {
    if (action === 'reject') {
      setReviewHotel(hotel);
      reviewForm.resetFields();
      setReviewModalVisible(true);
      return;
    }
    handleReviewSubmit(hotel?._id, action);
  };

  const handleReviewSubmit = async (hotelId, action, reason = '') => {
    try {
      if (!hotelId) {
        message.error('酒店ID缺失，无法提交审核操作');
        return;
      }
      if (action === 'approve') {
        await adminAPI.approveHotel(hotelId);
        message.success('审核通过');
      } else if (action === 'reject') {
        await adminAPI.rejectHotel(hotelId, reason);
        message.success('已拒绝');
      } else if (action === 'publish') {
        await adminAPI.publishHotel(hotelId);
        message.success('已发布');
      } else if (action === 'unpublish') {
        await adminAPI.unpublishHotel(hotelId);
        message.success('已下线');
      }
      setReviewModalVisible(false);
      setReviewHotel(null);
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
        <Space size={0.5}>
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
              <Button type="link" icon={<EyeOutlined />} style={{ marginLeft: -12 }} onClick={() => { setDetailHotel(record); setDetailModalVisible(true); }}>详情</Button>
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

  const normFile = (e) => {
    if (Array.isArray(e)) return e;
    return e?.fileList ?? [];
  };

  const uploadProps = {
    name: 'file',
    listType: 'picture-card',
    className: 'upload-list-inline',
    fileList: imageList,
    onChange: ({ fileList }) => {
      setImageList(
        fileList.map((f) => ({
          ...f,
          url: f.url || f.response?.url || f.response?.data?.url
        }))
      );
    },
    customRequest: async ({ file, onSuccess, onError }) => {
      try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await uploadAPI.uploadImage(formData);
        const url = res?.data?.url;
        if (url) onSuccess({ ...res, url });
        else onSuccess(res);
      } catch (err) {
        onError(err);
        message.error(err?.message || '上传失败');
      }
    },
    accept: 'image/*',
    beforeUpload: (file) => {
      const isLt5M = file.size / 1024 / 1024 < 5;
      if (!isLt5M) {
        message.error('图片大小不能超过 5MB');
        return Upload.LIST_IGNORE;
      }
      return true;
    }
  };

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
        width={720}
        destroyOnClose
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical" initialValues={{ rooms: [{ type: '', price: undefined, description: '', quantity: 1 }], facilities: [] }}>
          <Form.Item name="nameCn" label="酒店中文名" rules={[{ required: true, message: '请输入酒店中文名' }]}>
            <Input placeholder="请输入酒店中文名" />
          </Form.Item>
          <Form.Item name="nameEn" label="酒店英文名" rules={[{ required: true, message: '请输入酒店英文名' }]}>
            <Input placeholder="请输入酒店英文名" />
          </Form.Item>
          <Form.Item name="region" label="所在地区" rules={[{ required: true, message: '请选择省/市/区' }]}>
            <Cascader
              options={regionData}
              placeholder="请依次选择省（直辖市）- 市 - 区"
              changeOnSelect={false}
              showSearch={{ filter: (input, path) => path.some((p) => p.label.toLowerCase().includes(input.toLowerCase())) }}
            />
          </Form.Item>
          <Form.Item name="detailAddress" label="详细地址" rules={[{ required: true, message: '请输入详细地址' }]}>
            <Input placeholder="街道、门牌号等" />
          </Form.Item>
          <Form.Item name="starRating" label="星级" rules={[{ required: true, message: '请选择星级' }]}>
            <Select placeholder="请选择星级">
              {[3, 4, 5].map((n) => (
                <Option key={n} value={n}>{n}星</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="openingDate" label="开业时间" rules={[{ required: true, message: '请选择开业时间' }]}>
            <Input type="date" />
          </Form.Item>

          <Form.Item label="房型" required>
            <Form.List name="rooms" rules={[{ validator: (_, value) => (value && value.some((r) => r && r.type) ? Promise.resolve() : Promise.reject(new Error('至少添加一种房型并填写类型'))) }]}>
              {(fields, { add, remove }) => (
                <>
                  <Row gutter={8} style={{ marginBottom: 8, padding: '4px 0', borderBottom: '1px solid #f0f0f0', color: '#666', fontSize: 12 }}>
                    <Col span={6}><span style={{ fontWeight: 500 }}>类型</span></Col>
                    <Col span={5}><span style={{ fontWeight: 500 }}>价格（元）</span></Col>
                    <Col span={5}><span style={{ fontWeight: 500 }}>数量</span></Col>
                    <Col span={6}><span style={{ fontWeight: 500 }}>描述</span></Col>
                  </Row>
                  {fields.map(({ key, name, ...restField }) => (
                    <Card size="small" key={key} style={{ marginBottom: 8 }}>
                      <Row gutter={8}>
                        <Col span={6}>
                          <Form.Item {...restField} name={[name, 'type']} rules={[{ required: true, message: '类型' }]} noStyle>
                            <Input placeholder="如：标准间" />
                          </Form.Item>
                        </Col>
                        <Col span={5}>
                          <Form.Item {...restField} name={[name, 'price']} rules={[{ required: true, message: '价格' }]} noStyle>
                            <InputNumber placeholder="价格" min={0} style={{ width: '100%' }} addonAfter="元" />
                          </Form.Item>
                        </Col>
                        <Col span={5}>
                          <Form.Item {...restField} name={[name, 'quantity']} noStyle>
                            <InputNumber placeholder="数量" min={1} style={{ width: '100%' }} />
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <Form.Item {...restField} name={[name, 'description']} noStyle>
                            <Input placeholder="如：25平米" />
                          </Form.Item>
                        </Col>
                        <Col span={2}>
                          <Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(name)} />
                        </Col>
                      </Row>
                    </Card>
                  ))}
                  <Form.Item>
                    <Button type="dashed" onClick={() => add({ type: '', price: undefined, description: '', quantity: 1 })} block icon={<PlusOutlined />}>
                      添加房型
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>
          </Form.Item>

          <Form.Item name="images" label="图片" valuePropName="fileList" getValueFromEvent={normFile} style={{ display: 'none' }}>
            <Input type="hidden" />
          </Form.Item>
          <Form.Item label="图片上传与预览">
            <Upload {...uploadProps}>
              {imageList.length >= 9 ? null : (
                <div>
                  <InboxOutlined style={{ fontSize: 24 }} />
                  <div style={{ marginTop: 8 }}>上传图片</div>
                </div>
              )}
            </Upload>
            <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>支持 JPG/PNG/GIF，单张不超过 5MB，最多 9 张</div>
          </Form.Item>

          <Form.Item name="facilities" label="设施">
            <Checkbox.Group options={DEFAULT_FACILITIES.map((f) => ({ label: f, value: f }))} />
          </Form.Item>
          <Form.Item name="facilityCustom" label="自定义设施">
            <Select mode="tags" placeholder="输入后回车添加，如：游泳池、停车场" tokenSeparators={[',']} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="nearbyAttractions" label="景点">
            <TextArea rows={3} placeholder="每行一个景点或一段文字描述" />
          </Form.Item>
          <Form.Item name="transportation" label="交通">
            <TextArea rows={2} placeholder="地铁、公交等交通信息" />
          </Form.Item>
          <Form.Item name="nearbyShopping" label="购物">
            <TextArea rows={2} placeholder="周边商场、购物信息" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="酒店详情（仅供审核查看）"
        open={detailModalVisible}
        onCancel={() => { setDetailModalVisible(false); setDetailHotel(null); }}
        footer={[
          <Button key="close" onClick={() => { setDetailModalVisible(false); setDetailHotel(null); }}>关闭</Button>
        ]}
        width={720}
      >
        {detailHotel && (
          <>
            <Descriptions column={1} bordered size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="酒店中文名">{detailHotel.nameCn}</Descriptions.Item>
              <Descriptions.Item label="酒店英文名">{detailHotel.nameEn}</Descriptions.Item>
              <Descriptions.Item label="所在城市">{detailHotel.city}</Descriptions.Item>
              <Descriptions.Item label="地址">{detailHotel.address}</Descriptions.Item>
              <Descriptions.Item label="星级">{detailHotel.starRating}星</Descriptions.Item>
              <Descriptions.Item label="开业时间">
                {detailHotel.openingDate ? new Date(detailHotel.openingDate).toLocaleDateString('zh-CN') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="审核状态">
                <Tag color={{ pending: 'orange', approved: 'green', rejected: 'red' }[detailHotel.reviewStatus] || 'default'}>
                  {({ pending: '待审核', approved: '已通过', rejected: '已拒绝' }[detailHotel.reviewStatus] || '-')}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="发布状态">
                <Tag color={{ draft: 'default', published: 'green', unpublished: 'orange' }[detailHotel.status] || 'default'}>
                  {({ draft: '草稿', published: '已发布', unpublished: '已下线' }[detailHotel.status] || '-')}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
            <div style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 8, fontWeight: 500 }}>房型</div>
              <Table
                size="small"
                pagination={false}
                dataSource={detailHotel.rooms || []}
                rowKey={(_, i) => i}
                columns={[
                  { title: '类型', dataIndex: 'type', key: 'type' },
                  { title: '价格（元）', dataIndex: 'price', key: 'price', render: (v) => v != null ? v : '-' },
                  { title: '数量', dataIndex: 'quantity', key: 'quantity', render: (v) => v != null ? v : '-' },
                  { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true, render: (v) => v || '-' }
                ]}
              />
            </div>
            {(detailHotel.images && detailHotel.images.length > 0) && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ marginBottom: 8, fontWeight: 500 }}>图片</div>
                <Image.PreviewGroup>
                  <Space wrap>
                    {(detailHotel.images || []).map((url, i) => (
                      <Image key={i} width={80} height={80} src={url} style={{ objectFit: 'cover', borderRadius: 4 }} />
                    ))}
                  </Space>
                </Image.PreviewGroup>
              </div>
            )}
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="设施">{(detailHotel.facilities && detailHotel.facilities.length) ? detailHotel.facilities.join('、') : '-'}</Descriptions.Item>
              <Descriptions.Item label="景点">{(detailHotel.nearbyAttractions && detailHotel.nearbyAttractions.length) ? detailHotel.nearbyAttractions.join('、') : '-'}</Descriptions.Item>
              <Descriptions.Item label="交通">{detailHotel.transportation || '-'}</Descriptions.Item>
              <Descriptions.Item label="购物">{(detailHotel.nearbyShopping && detailHotel.nearbyShopping.length) ? detailHotel.nearbyShopping.join('、') : '-'}</Descriptions.Item>
            </Descriptions>
          </>
        )}
      </Modal>

      <Modal
        title="拒绝原因"
        open={reviewModalVisible}
        onCancel={() => setReviewModalVisible(false)}
        onOk={() => {
          reviewForm.validateFields().then((values) => {
            handleReviewSubmit(reviewHotel?._id, 'reject', values.reason);
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
