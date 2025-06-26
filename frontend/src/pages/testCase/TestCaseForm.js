import React, { useState, useEffect } from 'react';
import {
  Form, Input, Select, Button, Card, Space,
  Tabs, message, Radio, Tag, InputNumber,
  Table, Switch, Divider
} from 'antd';
import {
  PlusOutlined, SaveOutlined,
  ArrowLeftOutlined, DeleteOutlined
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api'; // 使用统一的api服务

const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;

// TestCaseForm 现在接收 isEdit, currentProject 和 projects 作为 props
const TestCaseForm = ({ isEdit = false, currentProject, projects }) => {
  const navigate = useNavigate();
  const { id } = useParams(); // 用于编辑模式下获取用例ID
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [steps, setSteps] = useState([]);
  const [tags, setTags] = useState([]);
  const [inputVisible, setInputVisible] = useState(false);
  const [inputValue, setInputValue] = useState('');

  // 编辑模式下加载测试用例数据
  useEffect(() => {
    if (isEdit && id) {
      setLoading(true);
      api.getTestCaseById(id)
        .then(response => {
          const testCase = response.data;
          setFormData(testCase);
        })
        .catch(error => {
          console.error('获取测试用例数据失败:', error);
          message.error('获取测试用例数据失败');
        })
        .finally(() => {
          setLoading(false);
        });
    } else if (!isEdit && currentProject) {
      // 创建模式下，设置项目默认值
      form.setFieldsValue({ projectId: currentProject.id });
    }
  }, [isEdit, id, currentProject, form]);

  // 设置表单数据
  const setFormData = (testCase) => {
    form.setFieldsValue({
      projectId: testCase.projectId, // 设置所属项目
      name: testCase.name,
      description: testCase.description,
      module: testCase.module,
      priority: testCase.priority,
      status: testCase.status,
      timeout: testCase.timeout,
      retryCount: testCase.retryCount
    });

    setSteps(testCase.steps || []);
    setTags(testCase.tags || []);
  };

  // 处理表单提交
  const handleSubmit = async (values) => {
    setLoading(true);

    // 构建测试用例数据
    const testCaseData = {
      ...values,
      steps,
      tags
    };

    try {
      if (isEdit) {
        await api.updateTestCase(id, testCaseData);
        message.success('测试用例更新成功');
      } else {
        await api.createTestCase(testCaseData);
        message.success('测试用例创建成功');
      }
      navigate('/test-cases');
    } catch (error) {
      console.error('保存测试用例失败:', error);
      message.error(error.response?.data?.error || (isEdit ? '更新测试用例失败' : '创建测试用例失败'));
    } finally {
      setLoading(false);
    }
  };

  // 测试步骤相关方法
  const addStep = () => {
    const newStep = {
      stepNumber: steps.length + 1,
      action: 'click',
      target: '',
      value: '',
      description: '',
      timeout: 30000,
      screenshot: false
    };

    setSteps([...steps, newStep]);
  };

  const removeStep = (index) => {
    const newSteps = [...steps];
    newSteps.splice(index, 1);

    // 重新编号
    const updatedSteps = newSteps.map((step, i) => ({
      ...step,
      stepNumber: i + 1
    }));

    setSteps(updatedSteps);
  };

  const updateStep = (index, field, value) => {
    const newSteps = [...steps];
    newSteps[index][field] = value;
    setSteps(newSteps);
  };

  // 标签相关方法
  const handleTagClose = (removedTag) => {
    const newTags = tags.filter(tag => tag !== removedTag);
    setTags(newTags);
  };

  const showInput = () => {
    setInputVisible(true);
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleInputConfirm = () => {
    if (inputValue && !tags.includes(inputValue)) {
      setTags([...tags, inputValue]);
    }
    setInputVisible(false);
    setInputValue('');
  };

  // 表格列定义 - 测试步骤
  const stepColumns = [
    {
      title: '步骤',
      dataIndex: 'stepNumber',
      key: 'stepNumber',
      width: 60
    },
    {
      title: '操作',
      dataIndex: 'action',
      key: 'action',
      width: 120,
      render: (action, record, index) => (
        <Select
          value={action}
          style={{ width: '100%' }}
          onChange={(value) => updateStep(index, 'action', value)}
        >
          <Option value="click">点击</Option>
          <Option value="type">输入</Option>
          <Option value="select">选择</Option>
          <Option value="navigate">导航</Option>
          <Option value="wait">等待</Option>
          <Option value="assert">断言</Option>
          <Option value="custom">自定义</Option>
        </Select>
      )
    },
    {
      title: '目标',
      dataIndex: 'target',
      key: 'target',
      render: (target, record, index) => (
        <Input
          value={target}
          placeholder="CSS选择器或XPath"
          onChange={(e) => updateStep(index, 'target', e.target.value)}
        />
      )
    },
    {
      title: '值',
      dataIndex: 'value',
      key: 'value',
      render: (value, record, index) => (
        <Input
          value={value}
          placeholder="输入值或变量"
          onChange={(e) => updateStep(index, 'value', e.target.value)}
        />
      )
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      render: (description, record, index) => (
        <Input
          value={description}
          placeholder="步骤描述"
          onChange={(e) => updateStep(index, 'description', e.target.value)}
        />
      )
    },
    {
      title: '超时(ms)',
      dataIndex: 'timeout',
      key: 'timeout',
      width: 110,
      render: (timeout, record, index) => (
        <InputNumber
          min={1000}
          max={60000}
          step={1000}
          value={timeout}
          style={{ width: '100%' }}
          onChange={(value) => updateStep(index, 'timeout', value)}
        />
      )
    },
    {
      title: '截图',
      dataIndex: 'screenshot',
      key: 'screenshot',
      width: 80,
      render: (screenshot, record, index) => (
        <Switch
          checked={screenshot}
          onChange={(checked) => updateStep(index, 'screenshot', checked)}
        />
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_, record, index) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeStep(index)}
        />
      )
    }
  ];

  return (
    <Card
      title={isEdit ? '编辑测试用例' : '创建测试用例'}
      loading={loading}
      extra={
        <Space>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/test-cases')}
          >
            返回
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={() => form.submit()}
            loading={loading}
          >
            保存
          </Button>
        </Space>
      }
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          priority: 'medium',
          status: 'draft',
          timeout: 300000,
          retryCount: 0
        }}
      >
        <Tabs defaultActiveKey="basic">
          <TabPane tab="基本信息" key="basic">
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
                  <Select.Option key={project.id} value={project.id}>
                    {project.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="name"
              label="测试用例名称"
              rules={[{ required: true, message: '请输入测试用例名称' }]}
            >
              <Input placeholder="请输入测试用例名称" />
            </Form.Item>

            <Form.Item
              name="description"
              label="描述"
              rules={[{ required: true, message: '请输入测试用例描述' }]}
            >
              <TextArea rows={4} placeholder="请输入测试用例详细描述" />
            </Form.Item>

            <Form.Item
              name="module"
              label="模块"
              rules={[{ required: true, message: '请选择模块' }]}
            >
              <Select placeholder="选择模块">
                <Option value="用户管理">用户管理</Option>
                <Option value="订单管理">订单管理</Option>
                <Option value="首页">首页</Option>
                <Option value="商品管理">商品管理</Option>
              </Select>
            </Form.Item>

            <div style={{ display: 'flex', gap: '16px' }}>
              <Form.Item
                name="priority"
                label="优先级"
                style={{ flex: 1 }}
              >
                <Radio.Group buttonStyle="solid">
                  <Radio.Button value="low">低</Radio.Button>
                  <Radio.Button value="medium">中</Radio.Button>
                  <Radio.Button value="high">高</Radio.Button>
                  <Radio.Button value="critical">严重</Radio.Button>
                </Radio.Group>
              </Form.Item>

              <Form.Item
                name="status"
                label="状态"
                style={{ flex: 1 }}
              >
                <Radio.Group buttonStyle="solid">
                  <Radio.Button value="draft">草稿</Radio.Button>
                  <Radio.Button value="active">活跃</Radio.Button>
                  <Radio.Button value="deprecated">已弃用</Radio.Button>
                </Radio.Group>
              </Form.Item>
            </div>

            <Form.Item label="标签">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {tags.map(tag => (
                  <Tag
                    key={tag}
                    closable
                    onClose={() => handleTagClose(tag)}
                  >
                    {tag}
                  </Tag>
                ))}
                {inputVisible ? (
                  <Input
                    type="text"
                    size="small"
                    style={{ width: 78 }}
                    value={inputValue}
                    onChange={handleInputChange}
                    onBlur={handleInputConfirm}
                    onPressEnter={handleInputConfirm}
                    autoFocus
                  />
                ) : (
                  <Tag onClick={showInput} style={{ borderStyle: 'dashed' }}>
                    <PlusOutlined /> 新建标签
                  </Tag>
                )}
              </div>
            </Form.Item>
          </TabPane>

          <TabPane tab="测试步骤" key="steps">
            <div style={{ marginBottom: 16 }}>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={addStep}
              >
                添加步骤
              </Button>
            </div>

            <Table
              columns={stepColumns}
              dataSource={steps}
              rowKey="stepNumber"
              pagination={false}
              bordered
            />
          </TabPane>

          <TabPane tab="高级设置" key="advanced">
            <div style={{ display: 'flex', gap: '16px' }}>
              <Form.Item
                name="timeout"
                label="超时时间 (毫秒)"
                style={{ flex: 1 }}
              >
                <InputNumber
                  min={10000}
                  max={600000}
                  step={10000}
                  style={{ width: '100%' }}
                />
              </Form.Item>

              <Form.Item
                name="retryCount"
                label="重试次数"
                style={{ flex: 1 }}
              >
                <InputNumber
                  min={0}
                  max={5}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </div>

            <Divider orientation="left">前置条件</Divider>
            <TextArea rows={3} placeholder="请输入前置条件，每行一个" />

            <Divider orientation="left">后置条件</Divider>
            <TextArea rows={3} placeholder="请输入后置条件，每行一个" />
          </TabPane>
        </Tabs>
      </Form>
    </Card>
  );
};

export default TestCaseForm;