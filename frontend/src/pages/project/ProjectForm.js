import React from 'react';
import { Form, Input, Button, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api'; // 引入前端API服务

const ProjectForm = ({ isEdit }) => {
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const onFinish = async (values) => {
    try {
      // 使用api服务调用后端创建项目接口
      const response = await api.createProject(values);
      message.success('项目创建成功');
      navigate('/projects'); // 创建成功后跳转回项目列表页
    } catch (error) {
      console.error('创建项目失败:', error);
      message.error(error.response?.data?.error || '创建项目失败');
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      // isEdit 模式下可能需要从后端加载数据来填充表单
      // initialValues={isEdit ? { name: '现有项目名', description: '现有项目描述' } : {}}
    >
      <Form.Item
        name="name"
        label="项目名称"
        rules={[{ required: true, message: '请输入项目名称' }]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="description"
        label="项目描述"
      >
        <Input.TextArea />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit">
          {isEdit ? '更新项目' : '创建项目'}
        </Button>
      </Form.Item>
    </Form>
  );
};

export default ProjectForm;