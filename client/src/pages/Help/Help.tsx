import React, { useState } from 'react';
import { Card, Collapse, Button, Form, Input, message, Row, Col } from 'antd';
import './Help.css';

const faqs = [
  {
    key: '1',
    label: '如何预订酒店？',
    children: '1. 浏览酒店列表并选择喜欢的酒店\n2. 点击进入酒店详情页\n3. 选择房型并点击"立即预订"\n4. 填写入住信息确认预订'
  },
  {
    key: '2',
    label: '预订后如何取消？',
    children: '您可以在"我的预订"页面中，找到相应的预订记录，点击"取消"按钮进行取消。提前7天取消可获得全额退款。'
  },
  {
    key: '3',
    label: '发票如何开具？',
    children: '预订确认后，您可以在"我的预订"页面中点击"申请发票"。发票将在确认入住后5个工作日内发送至您的邮箱。'
  },
  {
    key: '4',
    label: '优惠券如何使用？',
    children: '在预订时，在价格结算页面会显示可用的优惠券。选择您想要使用的优惠券后系统会自动计算最终价格。'
  }
];

const Help: React.FC = () => {
  const [form] = Form.useForm();
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  const handleSubmitFeedback = async (values: any) => {
    setFeedbackLoading(true);
    try {
      // TODO: 调用反馈 API
      message.success('反馈已提交，感谢您的建议！');
      form.resetFields();
    } catch (error) {
      message.error('提交失败，请稍后重试');
    } finally {
      setFeedbackLoading(false);
    }
  };

  return (
    <div className="help-container">
      <h1>帮助与反馈</h1>

      <Row gutter={[20, 20]}>
        <Col xs={24} md={16}>
          <Card title="常见问题" className="help-card">
            <Collapse items={faqs} />
          </Card>

          <Card title="联系我们" className="help-card" style={{ marginTop: 20 }}>
            <div className="contact-info">
              <p><strong>客服热线：</strong> 400-123-4567</p>
              <p><strong>邮箱：</strong> service@hotel.com</p>
              <p><strong>工作时间：</strong> 周一至周日 09:00-21:00</p>
            </div>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card title="意见反馈" className="help-card">
            <Form form={form} onFinish={handleSubmitFeedback} layout="vertical">
              <Form.Item
                name="feedback"
                label="您的反馈"
                rules={[{ required: true, message: '请输入反馈内容' }]}
              >
                <Input.TextArea rows={4} placeholder="请输入您的意见或建议" />
              </Form.Item>

              <Form.Item
                name="email"
                label="邮箱"
                rules={[
                  { required: true, message: '请输入邮箱' },
                  { type: 'email', message: '请输入有效的邮箱地址' }
                ]}
              >
                <Input placeholder="用于接收反馈回复" />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" loading={feedbackLoading} block>
                  提交反馈
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Help;
