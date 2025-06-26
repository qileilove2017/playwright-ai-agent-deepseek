import React, { useState, useEffect } from 'react';
import { 
    Card, Form, Select, Button, Tag, Input, 
    Divider, Space, Drawer, Radio 
} from 'antd';
import { PlusOutlined, FilterOutlined, ClearOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Option } = Select;

const TestCaseFilter = ({ projects, filters, onChange }) => {
    const [form] = Form.useForm();
    const [modules, setModules] = useState([]);
    const [tags, setTags] = useState([]);
    const [inputVisible, setInputVisible] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [newTagInputRef, setNewTagInputRef] = useState(null);
    
    // 设置初始值
    useEffect(() => {
        form.setFieldsValue({
            projectId: filters.projectId || null,
            module: filters.module || null,
            status: filters.status || null,
            priority: filters.priority || null,
            tags: filters.tags || []
        });
        
        setTags(filters.tags || []);
        
        // 如果有项目ID，获取模块列表
        if (filters.projectId) {
            fetchModules(filters.projectId);
        }
    }, [form, filters]);
    
    // 焦点到新标签输入框
    useEffect(() => {
        if (inputVisible && newTagInputRef) {
            newTagInputRef.focus();
        }
    }, [inputVisible, newTagInputRef]);
    
    // 获取项目模块
    const fetchModules = async (projectId) => {
        try {
            const { data } = await axios.get(`/api/projects/${projectId}`);
            setModules(data.data.modules || []);
        } catch (error) {
            console.error('获取项目模块失败:', error);
        }
    };
    
    // 处理项目变化
    const handleProjectChange = (value) => {
        form.setFieldsValue({ module: null });
        
        if (value) {
            fetchModules(value);
        } else {
            setModules([]);
        }
    };
    
    // 应用筛选
    const handleApply = () => {
        const values = form.getFieldsValue();
        onChange({
            ...values,
            tags
        });
    };
    
    // 重置筛选
    const handleReset = () => {
        form.resetFields();
        setTags([]);
        onChange({
            projectId: null,
            module: null,
            status: null,
            priority: null,
            tags: []
        });
    };
    
    // 处理标签关闭
    const handleTagClose = (removedTag) => {
        const newTags = tags.filter(tag => tag !== removedTag);
        setTags(newTags);
    };
    
    // 显示标签输入框
    const showTagInput = () => {
        setInputVisible(true);
    };
    
    // 处理标签输入变化
    const handleTagInputChange = (e) => {
        setInputValue(e.target.value);
    };
    
    // 处理标签输入确认
    const handleTagInputConfirm = () => {
        if (inputValue && !tags.includes(inputValue)) {
            setTags([...tags, inputValue]);
        }
        
        setInputVisible(false);
        setInputValue('');
    };
    
    // 设置标签输入框引用
    const handleTagInputRef = (input) => {
        setNewTagInputRef(input);
    };
    
    return (
        <Card 
            title="筛选条件" 
            extra={
                <Space>
                    <Button 
                        icon={<ClearOutlined />} 
                        onClick={handleReset}
                    >
                        重置
                    </Button>
                    <Button 
                        type="primary" 
                        icon={<FilterOutlined />} 
                        onClick={handleApply}
                    >
                        应用
                    </Button>
                </Space>
            }
            style={{ width: 400 }}
        >
            <Form 
                form={form}
                layout="vertical"
            >
                <Form.Item 
                    name="projectId" 
                    label="项目"
                >
                    <Select 
                        placeholder="选择项目" 
                        allowClear
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
                >
                    <Select 
                        placeholder="选择模块" 
                        allowClear
                        disabled={!form.getFieldValue('projectId')}
                    >
                        {modules.map(module => (
                            <Option key={module} value={module}>
                                {module}
                            </Option>
                        ))}
                    </Select>
                </Form.Item>
                
                <Form.Item 
                    name="status" 
                    label="状态"
                >
                    <Radio.Group buttonStyle="solid">
                        <Radio.Button value={null}>全部</Radio.Button>
                        <Radio.Button value="draft">草稿</Radio.Button>
                        <Radio.Button value="active">活跃</Radio.Button>
                        <Radio.Button value="deprecated">已弃用</Radio.Button>
                    </Radio.Group>
                </Form.Item>
                
                <Form.Item 
                    name="priority" 
                    label="优先级"
                >
                    <Radio.Group buttonStyle="solid">
                        <Radio.Button value={null}>全部</Radio.Button>
                        <Radio.Button value="low">低</Radio.Button>
                        <Radio.Button value="medium">中</Radio.Button>
                        <Radio.Button value="high">高</Radio.Button>
                        <Radio.Button value="critical">严重</Radio.Button>
                    </Radio.Group>
                </Form.Item>
                
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
                                ref={handleTagInputRef}
                                type="text"
                                size="small"
                                style={{ width: 100 }}
                                value={inputValue}
                                onChange={handleTagInputChange}
                                onBlur={handleTagInputConfirm}
                                onPressEnter={handleTagInputConfirm}
                            />
                        ) : (
                            <Tag onClick={showTagInput} style={{ borderStyle: 'dashed' }}>
                                <PlusOutlined /> 添加标签
                            </Tag>
                        )}
                    </div>
                </Form.Item>
            </Form>
        </Card>
    );
};

export default TestCaseFilter; 