import React, { useState, useEffect } from 'react';
import { 
    Form, Input, Select, Button, Card, Space, Divider, Tag, 
    message, Tabs, Table, Modal, Radio, Switch, InputNumber 
} from 'antd';
import { 
    PlusOutlined, DeleteOutlined, ArrowUpOutlined, 
    ArrowDownOutlined, SaveOutlined, CloseOutlined 
} from '@ant-design/icons';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

const { Option } = Select;
const { TabPane } = Tabs;
const { TextArea } = Input;

const TestCaseForm = ({ isEdit = false }) => {
    const [form] = Form.useForm();
    const navigate = useNavigate();
    const { id } = useParams();
    
    // 表单状态
    const [loading, setLoading] = useState(false);
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);
    const [modules, setModules] = useState([]);
    const [steps, setSteps] = useState([]);
    const [testData, setTestData] = useState([]);
    const [verificationPoints, setVerificationPoints] = useState([]);
    const [dependencies, setDependencies] = useState([]);
    const [tags, setTags] = useState([]);
    const [inputVisible, setInputVisible] = useState(false);
    const [inputValue, setInputValue] = useState('');
    
    // 获取项目列表
    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const { data } = await axios.get('/api/projects');
                setProjects(data.data);
            } catch (error) {
                message.error('获取项目列表失败');
            }
        };
        
        fetchProjects();
    }, []);
    
    // 如果是编辑模式，获取测试用例数据
    useEffect(() => {
        if (isEdit && id) {
            const fetchTestCase = async () => {
                setLoading(true);
                
                try {
                    const { data } = await axios.get(`/api/test-cases/${id}`);
                    const testCase = data.data;
                    
                    // 设置表单值
                    form.setFieldsValue({
                        name: testCase.name,
                        description: testCase.description,
                        projectId: testCase.projectId,
                        module: testCase.module,
                        priority: testCase.priority,
                        status: testCase.status,
                        timeout: testCase.timeout,
                        retryCount: testCase.retryCount,
                        preconditions: testCase.preconditions.join('\n'),
                        postconditions: testCase.postconditions.join('\n')
                    });
                    
                    // 设置其他状态
                    setSelectedProject(testCase.projectId);
                    setSteps(testCase.steps || []);
                    setTestData(testCase.testData || []);
                    setVerificationPoints(testCase.verificationPoints || []);
                    setDependencies(testCase.dependencies || []);
                    setTags(testCase.tags || []);
                    
                    // 获取项目的模块列表
                    if (testCase.projectId) {
                        await fetchModules(testCase.projectId);
                    }
                } catch (error) {
                    message.error('获取测试用例数据失败');
                } finally {
                    setLoading(false);
                }
            };
            
            fetchTestCase();
        }
    }, [isEdit, id, form]);
    
    // 获取项目模块列表
    const fetchModules = async (projectId) => {
        try {
            const { data } = await axios.get(`/api/projects/${projectId}`);
            setModules(data.data.modules || []);
        } catch (error) {
            message.error('获取项目模块失败');
        }
    };
    
    // 处理项目选择变化
    const handleProjectChange = async (value) => {
        setSelectedProject(value);
        await fetchModules(value);
    };
    
    // 处理表单提交
    const handleSubmit = async (values) => {
        setLoading(true);
        
        try {
            // 处理前置和后置条件
            const preconditions = values.preconditions 
                ? values.preconditions.split('\n').filter(item => item.trim())
                : [];
                
            const postconditions = values.postconditions
                ? values.postconditions.split('\n').filter(item => item.trim())
                : [];
            
            // 构建测试用例数据
            const testCaseData = {
                ...values,
                steps,
                testData,
                verificationPoints,
                dependencies: dependencies.map(dep => dep._id),
                tags,
                preconditions,
                postconditions
            };
            
            if (isEdit) {
                await axios.put(`/api/test-cases/${id}`, testCaseData);
                message.success('测试用例更新成功');
            } else {
                await axios.post('/api/test-cases', testCaseData);
                message.success('测试用例创建成功');
            }
            
            // 返回列表页
            navigate('/test-cases');
        } catch (error) {
            console.error('保存测试用例失败:', error);
            message.error('保存测试用例失败: ' + (error.response?.data?.error || error.message));
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
        newSteps.forEach((step, i) => {
            step.stepNumber = i + 1;
        });
        
        setSteps(newSteps);
    };
    
    const moveStep = (index, direction) => {
        if (
            (direction === 'up' && index === 0) || 
            (direction === 'down' && index === steps.length - 1)
        ) {
            return;
        }
        
        const newSteps = [...steps];
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        
        // 交换步骤
        [newSteps[index], newSteps[newIndex]] = [newSteps[newIndex], newSteps[index]];
        
        // 更新步骤编号
        newSteps.forEach((step, i) => {
            step.stepNumber = i + 1;
        });
        
        setSteps(newSteps);
    };
    
    const updateStep = (index, field, value) => {
        const newSteps = [...steps];
        newSteps[index][field] = value;
        setSteps(newSteps);
    };
    
    // 测试数据相关方法
    const addTestData = () => {
        setTestData([
            ...testData,
            {
                key: '',
                value: '',
                type: 'string',
                description: ''
            }
        ]);
    };
    
    const removeTestData = (index) => {
        const newData = [...testData];
        newData.splice(index, 1);
        setTestData(newData);
    };
    
    const updateTestData = (index, field, value) => {
        const newData = [...testData];
        newData[index][field] = value;
        setTestData(newData);
    };
    
    // 验证点相关方法
    const addVerificationPoint = () => {
        setVerificationPoints([
            ...verificationPoints,
            {
                type: 'text',
                target: '',
                expected: '',
                operator: 'equals',
                description: ''
            }
        ]);
    };
    
    const removeVerificationPoint = (index) => {
        const newPoints = [...verificationPoints];
        newPoints.splice(index, 1);
        setVerificationPoints(newPoints);
    };
    
    const updateVerificationPoint = (index, field, value) => {
        const newPoints = [...verificationPoints];
        newPoints[index][field] = value;
        setVerificationPoints(newPoints);
    };
    
    // 依赖测试用例相关方法
    const addDependency = () => {
        Modal.info({
            title: '添加依赖',
            content: '此功能在开发中...',
            onOk() {}
        });
    };
    
    const removeDependency = (index) => {
        const newDeps = [...dependencies];
        newDeps.splice(index, 1);
        setDependencies(newDeps);
    };
    
    // 标签相关方法
    const handleTagClose = (removedTag) => {
        const newTags = tags.filter(tag => tag !== removedTag);
        setTags(newTags);
    };
    
    const showTagInput = () => {
        setInputVisible(true);
    };
    
    const handleTagInputChange = (e) => {
        setInputValue(e.target.value);
    };
    
    const handleTagInputConfirm = () => {
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
            width: 70
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
                    <Option value="hover">悬停</Option>
                    <Option value="wait">等待</Option>
                    <Option value="assert">断言</Option>
                    <Option value="navigate">导航</Option>
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
                    onChange={(e) => updateStep(index, 'target', e.target.value)}
                    placeholder="CSS选择器或XPath"
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
                    onChange={(e) => updateStep(index, 'value', e.target.value)}
                    placeholder="输入值或参数"
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
                    onChange={(e) => updateStep(index, 'description', e.target.value)}
                    placeholder="步骤描述"
                />
            )
        },
        {
            title: '超时(ms)',
            dataIndex: 'timeout',
            key: 'timeout',
            width: 100,
            render: (timeout, record, index) => (
                <InputNumber
                    value={timeout}
                    min={1000}
                    max={300000}
                    step={1000}
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
            key: 'operation',
            width: 120,
            render: (_, record, index) => (
                <Space>
                    <Button
                        type="text"
                        icon={<ArrowUpOutlined />}
                        onClick={() => moveStep(index, 'up')}
                        disabled={index === 0}
                    />
                    <Button
                        type="text"
                        icon={<ArrowDownOutlined />}
                        onClick={() => moveStep(index, 'down')}
                        disabled={index === steps.length - 1}
                    />
                    <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => removeStep(index)}
                    />
                </Space>
            )
        }
    ];
    
    // 表格列定义 - 测试数据
    const testDataColumns = [
        {
            title: '键',
            dataIndex: 'key',
            key: 'key',
            render: (key, record, index) => (
                <Input
                    value={key}
                    onChange={(e) => updateTestData(index, 'key', e.target.value)}
                    placeholder="数据键名"
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
                    onChange={(e) => updateTestData(index, 'value', e.target.value)}
                    placeholder="数据值"
                />
            )
        },
        {
            title: '类型',
            dataIndex: 'type',
            key: 'type',
            width: 120,
            render: (type, record, index) => (
                <Select
                    value={type}
                    style={{ width: '100%' }}
                    onChange={(value) => updateTestData(index, 'type', value)}
                >
                    <Option value="string">字符串</Option>
                    <Option value="number">数字</Option>
                    <Option value="boolean">布尔值</Option>
                    <Option value="array">数组</Option>
                    <Option value="object">对象</Option>
                </Select>
            )
        },
        {
            title: '描述',
            dataIndex: 'description',
            key: 'description',
            render: (description, record, index) => (
                <Input
                    value={description}
                    onChange={(e) => updateTestData(index, 'description', e.target.value)}
                    placeholder="数据描述"
                />
            )
        },
        {
            title: '操作',
            key: 'operation',
            width: 80,
            render: (_, record, index) => (
                <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => removeTestData(index)}
                />
            )
        }
    ];
    
    // 表格列定义 - 验证点
    const verificationColumns = [
        {
            title: '类型',
            dataIndex: 'type',
            key: 'type',
            width: 120,
            render: (type, record, index) => (
                <Select
                    value={type}
                    style={{ width: '100%' }}
                    onChange={(value) => updateVerificationPoint(index, 'type', value)}
                >
                    <Option value="text">文本</Option>
                    <Option value="attribute">属性</Option>
                    <Option value="count">数量</Option>
                    <Option value="url">URL</Option>
                    <Option value="title">标题</Option>
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
                    onChange={(e) => updateVerificationPoint(index, 'target', e.target.value)}
                    placeholder="CSS选择器或XPath"
                />
            )
        },
        {
            title: '比较',
            dataIndex: 'operator',
            key: 'operator',
            width: 120,
            render: (operator, record, index) => (
                <Select
                    value={operator}
                    style={{ width: '100%' }}
                    onChange={(value) => updateVerificationPoint(index, 'operator', value)}
                >
                    <Option value="equals">等于</Option>
                    <Option value="contains">包含</Option>
                    <Option value="startsWith">开始于</Option>
                    <Option value="endsWith">结束于</Option>
                    <Option value="matches">匹配</Option>
                    <Option value="greaterThan">大于</Option>
                    <Option value="lessThan">小于</Option>
                </Select>
            )
        },
        {
            title: '期望值',
            dataIndex: 'expected',
            key: 'expected',
            render: (expected, record, index) => (
                <Input
                    value={expected}
                    onChange={(e) => updateVerificationPoint(index, 'expected', e.target.value)}
                    placeholder="期望值"
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
                    onChange={(e) => updateVerificationPoint(index, 'description', e.target.value)}
                    placeholder="验证点描述"
                />
            )
        },
        {
            title: '操作',
            key: 'operation',
            width: 80,
            render: (_, record, index) => (
                <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => removeVerificationPoint(index)}
                />
            )
        }
    ];
    
    // 表格列定义 - 依赖
    const dependencyColumns = [
        {
            title: '测试用例',
            dataIndex: 'name',
            key: 'name'
        },
        {
            title: '操作',
            key: 'operation',
            width: 80,
            render: (_, record, index) => (
                <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => removeDependency(index)}
                />
            )
        }
    ];
    
    return (
        <Card
            title={isEdit ? '编辑测试用例' : '创建测试用例'}
            extra={
                <Space>
                    <Button onClick={() => navigate('/test-cases')}>
                        取消
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
                    status: 'draft',
                    priority: 'medium',
                    timeout: 300000,
                    retryCount: 0
                }}
            >
                <Tabs defaultActiveKey="basic">
                    {/* 基本信息 */}
                    <TabPane tab="基本信息" key="basic">
                        <Form.Item
                            name="name"
                            label="测试用例名称"
                            rules={[{ required: true, message: '请输入测试用例名称' }]}
                        >
                            <Input placeholder="输入测试用例名称" />
                        </Form.Item>
                        
                        <Form.Item
                            name="description"
                            label="描述"
                            rules={[{ required: true, message: '请输入测试用例描述' }]}
                        >
                            <TextArea 
                                rows={4} 
                                placeholder="输入测试用例详细描述" 
                            />
                        </Form.Item>
                        
                        <Form.Item
                            name="projectId"
                            label="所属项目"
                            rules={[{ required: true, message: '请选择所属项目' }]}
                        >
                            <Select
                                placeholder="选择项目"
                                onChange={handleProjectChange}
                            >
                                {projects.map(project => (
                                    <Option key={project._id} value={project._id}>
                                        {project.name}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                        
                        <Form.Item
                            name="module"
                            label="模块"
                            rules={[{ required: true, message: '请选择模块' }]}
                        >
                            <Select
                                placeholder="选择模块"
                                disabled={!selectedProject}
                                showSearch
                                filterOption={(input, option) =>
                                    option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                                }
                            >
                                {modules.map(module => (
                                    <Option key={module} value={module}>
                                        {module}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                        
                        <div style={{ display: 'flex', gap: '16px' }}>
                            <Form.Item
                                name="priority"
                                label="优先级"
                                style={{ flex: 1 }}
                            >
                                <Radio.Group>
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
                                <Radio.Group>
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
                                        style={{ width: 80 }}
                                        value={inputValue}
                                        onChange={handleTagInputChange}
                                        onBlur={handleTagInputConfirm}
                                        onPressEnter={handleTagInputConfirm}
                                        autoFocus
                                    />
                                ) : (
                                    <Tag onClick={showTagInput} style={{ borderStyle: 'dashed' }}>
                                        <PlusOutlined /> 新建标签
                                    </Tag>
                                )}
                            </div>
                        </Form.Item>
                    </TabPane>
                    
                    {/* 测试步骤 */}
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
                    
                    {/* 测试数据 */}
                    <TabPane tab="测试数据" key="data">
                        <div style={{ marginBottom: 16 }}>
                            <Button 
                                type="primary" 
                                icon={<PlusOutlined />} 
                                onClick={addTestData}
                            >
                                添加测试数据
                            </Button>
                        </div>
                        
                        <Table
                            columns={testDataColumns}
                            dataSource={testData}
                            rowKey="key"
                            pagination={false}
                            bordered
                        />
                    </TabPane>
                    
                    {/* 验证点 */}
                    <TabPane tab="验证点" key="verify">
                        <div style={{ marginBottom: 16 }}>
                            <Button 
                                type="primary" 
                                icon={<PlusOutlined />} 
                                onClick={addVerificationPoint}
                            >
                                添加验证点
                            </Button>
                        </div>
                        
                        <Table
                            columns={verificationColumns}
                            dataSource={verificationPoints}
                            rowKey={(record, index) => index}
                            pagination={false}
                            bordered
                        />
                    </TabPane>
                    
                    {/* 高级设置 */}
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
                                    step={1}
                                    style={{ width: '100%' }}
                                />
                            </Form.Item>
                        </div>
                        
                        <Form.Item
                            name="preconditions"
                            label="前置条件"
                        >
                            <TextArea 
                                rows={3} 
                                placeholder="每行一个前置条件" 
                            />
                        </Form.Item>
                        
                        <Form.Item
                            name="postconditions"
                            label="后置条件"
                        >
                            <TextArea 
                                rows={3} 
                                placeholder="每行一个后置条件" 
                            />
                        </Form.Item>
                        
                        <Divider>依赖测试用例</Divider>
                        
                        <div style={{ marginBottom: 16 }}>
                            <Button 
                                type="primary" 
                                icon={<PlusOutlined />} 
                                onClick={addDependency}
                            >
                                添加依赖
                            </Button>
                        </div>
                        
                        <Table
                            columns={dependencyColumns}
                            dataSource={dependencies}
                            rowKey="_id"
                            pagination={false}
                            bordered
                        />
                    </TabPane>
                </Tabs>
            </Form>
        </Card>
    );
};

export default TestCaseForm; 