import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Select, Card, Space, message } from 'antd';
import { ArrowLeftOutlined, RobotOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const { TextArea } = Input;
const { Option } = Select;

const TestCaseGenerator = ({ currentProject, projects }) => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // 默认选中当前项目
    if (currentProject) {
      form.setFieldsValue({ projectId: currentProject.id });
    }
  }, [currentProject, form]);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await api.generateTestCaseFromPrompt(values);
      message.success('测试用例生成并保存成功！');
      navigate('/test-cases'); // 生成成功后跳转回测试用例列表
    } catch (error) {
      console.error('生成测试用例失败:', error);
      message.error(error.response?.data?.error || '生成测试用例失败，请检查提示词或网络。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      title="快速生成测试用例"
      extra={
        <Space>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/test-cases')}
          >
            返回
          </Button>
        </Space>
      }
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
      >
        <Form.Item
          name="projectId"
          label="所属项目"
          rules={[{ required: true, message: '请选择所属项目' }]}
        >
          <Select
            placeholder="请选择项目"
            loading={!projects.length && !currentProject}
          >
            {projects.map(project => (
              <Option key={project.id} value={project.id}>
                {project.name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="prompt"
          label="测试用例需求描述"
          rules={[{ required: true, message: '请输入测试用例需求描述' }]}
        >
          <TextArea
            rows={8}
            placeholder="例如：生成一个用户登录功能的测试用例，包括成功登录、密码错误、用户名不存在等场景。"
          />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            icon={<RobotOutlined />}
            loading={loading}
          >
            生成并保存测试用例
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default TestCaseGenerator;