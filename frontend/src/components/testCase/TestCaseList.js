import React, { useState, useEffect } from 'react';
import { 
    Card, Table, Button, Input, Select, Tag, Space, 
    Dropdown, Menu, Popconfirm, message, Tooltip, Badge 
} from 'antd';
import { 
    PlusOutlined, SearchOutlined, FilterOutlined, 
    EditOutlined, DeleteOutlined, CopyOutlined, 
    MoreOutlined, DownloadOutlined, UploadOutlined,
    PlayCircleOutlined, EyeOutlined
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import moment from 'moment';

import TestCaseFilter from './TestCaseFilter';
import TestCaseImport from './TestCaseImport';
import TestCaseExport from './TestCaseExport';

const { Option } = Select;

const TestCaseList = () => {
    const navigate = useNavigate();
    
    // 状态
    const [testCases, setTestCases] = useState([]);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        projectId: null,
        module: null,
        status: null,
        priority: null,
        tags: []
    });
    const [projects, setProjects] = useState([]);
    const [importModalVisible, setImportModalVisible] = useState(false);
    const [exportModalVisible, setExportModalVisible] = useState(false);
    
    // 获取项目列表
    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const { data } = await axios.get('/api/projects');
                setProjects(data.data);
            } catch (error) {
                console.error('获取项目列表失败:', error);
                message.error('获取项目列表失败');
            }
        };
        
        fetchProjects();
    }, []);
    
    // 获取测试用例列表
    const fetchTestCases = async (page = currentPage, limit = pageSize) => {
        setLoading(true);
        
        try {
            // 构建查询参数
            const params = {
                page,
                limit,
                ...(searchTerm && { search: searchTerm }),
                ...(filters.projectId && { projectId: filters.projectId }),
                ...(filters.module && { module: filters.module }),
                ...(filters.status && { status: filters.status }),
                ...(filters.priority && { priority: filters.priority }),
                ...(filters.tags.length > 0 && { tags: filters.tags.join(',') })
            };
            
            const { data } = await axios.get('/api/test-cases', { params });
            
            setTestCases(data.data);
            setTotal(data.pagination.total);
            setCurrentPage(data.pagination.page);
        } catch (error) {
            console.error('获取测试用例列表失败:', error);
            message.error('获取测试用例列表失败');
        } finally {
            setLoading(false);
        }
    };
    
    // 初始加载和参数变化时获取数据
    useEffect(() => {
        fetchTestCases();
    }, [currentPage, pageSize, searchTerm, filters]);
    
    // 处理翻页
    const handleTableChange = (pagination) => {
        setCurrentPage(pagination.current);
        setPageSize(pagination.pageSize);
    };
    
    // 处理搜索
    const handleSearch = (value) => {
        setSearchTerm(value);
        setCurrentPage(1); // 重置为第一页
    };
    
    // 处理筛选
    const handleFilterChange = (newFilters) => {
        setFilters({ ...filters, ...newFilters });
        setCurrentPage(1); // 重置为第一页
    };
    
    // 处理行选择
    const rowSelection = {
        selectedRowKeys,
        onChange: (keys) => setSelectedRowKeys(keys),
    };
    
    // 批量操作
    const handleBulkOperation = async (operation) => {
        if (selectedRowKeys.length === 0) {
            message.warning('请先选择测试用例');
            return;
        }
        
        setLoading(true);
        
        try {
            let data = {};
            
            switch (operation) {
                case 'delete':
                    if (!window.confirm('确定要删除选中的测试用例吗？此操作不可恢复。')) {
                        setLoading(false);
                        return;
                    }
                    data = { operation, ids: selectedRowKeys };
                    break;
                    
                case 'duplicate':
                    data = { operation, ids: selectedRowKeys };
                    break;
                    
                case 'active':
                    data = { 
                        operation: 'update', 
                        ids: selectedRowKeys,
                        data: { status: 'active' }
                    };
                    break;
                    
                case 'draft':
                    data = { 
                        operation: 'update', 
                        ids: selectedRowKeys,
                        data: { status: 'draft' }
                    };
                    break;
                    
                case 'deprecated':
                    data = { 
                        operation: 'update', 
                        ids: selectedRowKeys,
                        data: { status: 'deprecated' }
                    };
                    break;
                    
                default:
                    message.error('不支持的操作');
                    setLoading(false);
                    return;
            }
            
            const response = await axios.post('/api/test-cases/bulk', data);
            
            message.success(response.data.message);
            fetchTestCases();
            setSelectedRowKeys([]);
        } catch (error) {
            console.error('批量操作失败:', error);
            message.error('批量操作失败: ' + (error.response?.data?.error || error.message));
        } finally {
            setLoading(false);
        }
    };
    
    // 处理单个测试用例删除
    const handleDelete = async (id) => {
        setLoading(true);
        
        try {
            await axios.delete(`/api/test-cases/${id}`);
            message.success('测试用例删除成功');
            fetchTestCases();
        } catch (error) {
            console.error('删除测试用例失败:', error);
            message.error('删除测试用例失败: ' + (error.response?.data?.error || error.message));
        } finally {
            setLoading(false);
        }
    };
    
    // 表格列定义
    const columns = [
        {
            title: 'ID',
            dataIndex: '_id',
            key: '_id',
            width: 80,
            render: (id) => (
                <Tooltip title={id}>
                    <span>{id.substr(id.length - 6)}</span>
                </Tooltip>
            )
        },
        {
            title: '名称',
            dataIndex: 'name',
            key: 'name',
            ellipsis: true,
            render: (text, record) => (
                <Link to={`/test-cases/${record._id}`}>{text}</Link>
            )
        },
        {
            title: '所属项目',
            dataIndex: 'projectId',
            key: 'projectId',
            width: 120,
            render: (projectId) => {
                const project = projects.find(p => p._id === projectId);
                return project ? project.name : '未知项目';
            }
        },
        {
            title: '模块',
            dataIndex: 'module',
            key: 'module',
            width: 120
        },
        {
            title: '优先级',
            dataIndex: 'priority',
            key: 'priority',
            width: 100,
            render: (priority) => {
                const colors = {
                    low: 'green',
                    medium: 'blue',
                    high: 'orange',
                    critical: 'red'
                };
                
                return (
                    <Tag color={colors[priority]}>
                        {priority.toUpperCase()}
                    </Tag>
                );
            }
        },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            width: 100,
            render: (status) => {
                const statusMap = {
                    draft: { color: 'default', text: '草稿' },
                    active: { color: 'green', text: '活跃' },
                    deprecated: { color: 'red', text: '已弃用' }
                };
                
                return (
                    <Badge status={statusMap[status].color} text={statusMap[status].text} />
                );
            }
        },
        {
            title: '标签',
            dataIndex: 'tags',
            key: 'tags',
            width: 200,
            render: (tags) => (
                <span>
                    {tags.slice(0, 3).map(tag => (
                        <Tag key={tag}>{tag}</Tag>
                    ))}
                    {tags.length > 3 && <Tag>+{tags.length - 3}</Tag>}
                </span>
            )
        },
        {
            title: '创建时间',
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: 170,
            render: (date) => moment(date).format('YYYY-MM-DD HH:mm')
        },
        {
            title: '操作',
            key: 'action',
            width: 150,
            render: (_, record) => (
                <Space size="small">
                    <Tooltip title="查看">
                        <Button 
                            type="text" 
                            icon={<EyeOutlined />} 
                            onClick={() => navigate(`/test-cases/${record._id}`)}
                        />
                    </Tooltip>
                    <Tooltip title="编辑">
                        <Button 
                            type="text" 
                            icon={<EditOutlined />} 
                            onClick={() => navigate(`/test-cases/${record._id}/edit`)}
                        />
                    </Tooltip>
                    <Dropdown overlay={
                        <Menu>
                            <Menu.Item 
                                key="execute" 
                                icon={<PlayCircleOutlined />}
                                onClick={() => navigate(`/test-cases/${record._id}/execute`)}
                            >
                                执行
                            </Menu.Item>
                            <Menu.Item 
                                key="duplicate" 
                                icon={<CopyOutlined />}
                                onClick={() => handleBulkOperation('duplicate', [record._id])}
                            >
                                复制
                            </Menu.Item>
                            <Menu.Divider />
                            <Menu.Item key="delete" danger icon={<DeleteOutlined />}>
                                <Popconfirm
                                    title="确定要删除此测试用例吗？"
                                    onConfirm={() => handleDelete(record._id)}
                                    okText="是"
                                    cancelText="否"
                                >
                                    删除
                                </Popconfirm>
                            </Menu.Item>
                        </Menu>
                    }>
                        <Button type="text" icon={<MoreOutlined />} />
                    </Dropdown>
                </Space>
            )
        }
    ];
    
    // 渲染页面
    return (
        <div className="test-case-list">
            <Card
                title="测试用例管理"
                extra={
                    <Space size="middle">
                        {/* 过滤按钮 */}
                        <Dropdown 
                            overlay={
                                <TestCaseFilter 
                                    projects={projects}
                                    filters={filters}
                                    onChange={handleFilterChange}
                                />
                            } 
                            trigger={['click']}
                        >
                            <Button icon={<FilterOutlined />}>
                                筛选
                            </Button>
                        </Dropdown>
                        
                        {/* 导入导出按钮 */}
                        <Dropdown overlay={
                            <Menu>
                                <Menu.Item 
                                    key="import" 
                                    icon={<UploadOutlined />}
                                    onClick={() => setImportModalVisible(true)}
                                >
                                    导入
                                </Menu.Item>
                                <Menu.Item 
                                    key="export" 
                                    icon={<DownloadOutlined />}
                                    onClick={() => setExportModalVisible(true)}
                                >
                                    导出
                                </Menu.Item>
                            </Menu>
                        }>
                            <Button icon={<DownloadOutlined />}>导入/导出</Button>
                        </Dropdown>
                        
                        {/* 新建按钮 */}
                        <Button 
                            type="primary" 
                            icon={<PlusOutlined />}
                            onClick={() => navigate('/test-cases/create')}
                        >
                            新建测试用例
                        </Button>
                    </Space>
                }
            >
                {/* 搜索栏 */}
                <div style={{ marginBottom: 16 }}>
                    <Input.Search
                        placeholder="搜索测试用例..."
                        enterButton
                        onSearch={handleSearch}
                        style={{ width: 300, marginRight: 16 }}
                        allowClear
                    />
                    
                    {/* 批量操作 */}
                    {selectedRowKeys.length > 0 && (
                        <Space>
                            <span>已选择 {selectedRowKeys.length} 项</span>
                            <Dropdown overlay={
                                <Menu>
                                    <Menu.Item 
                                        key="duplicate" 
                                        icon={<CopyOutlined />}
                                        onClick={() => handleBulkOperation('duplicate')}
                                    >
                                        复制所选
                                    </Menu.Item>
                                    <Menu.SubMenu 
                                        key="status" 
                                        title="更改状态"
                                    >
                                        <Menu.Item key="activate" onClick={() => handleBulkOperation('active')}>
                                            标记为活跃
                                        </Menu.Item>
                                        <Menu.Item key="draft" onClick={() => handleBulkOperation('draft')}>
                                            标记为草稿
                                        </Menu.Item>
                                        <Menu.Item key="deprecate" onClick={() => handleBulkOperation('deprecated')}>
                                            标记为已弃用
                                        </Menu.Item>
                                    </Menu.SubMenu>
                                    <Menu.Divider />
                                    <Menu.Item 
                                        key="delete" 
                                        danger 
                                        icon={<DeleteOutlined />}
                                        onClick={() => handleBulkOperation('delete')}
                                    >
                                        删除所选
                                    </Menu.Item>
                                </Menu>
                            }>
                                <Button>批量操作</Button>
                            </Dropdown>
                            <Button onClick={() => setSelectedRowKeys([])}>取消选择</Button>
                        </Space>
                    )}
                </div>
                
                {/* 表格 */}
                <Table
                    rowSelection={rowSelection}
                    columns={columns}
                    dataSource={testCases}
                    rowKey="_id"
                    loading={loading}
                    pagination={{
                        current: currentPage,
                        pageSize: pageSize,
                        total: total,
                        showTotal: (total) => `共 ${total} 条`,
                        showSizeChanger: true,
                        showQuickJumper: true
                    }}
                    onChange={handleTableChange}
                />
            </Card>
            
            {/* 导入对话框 */}
            <TestCaseImport
                visible={importModalVisible}
                onClose={() => setImportModalVisible(false)}
                onSuccess={() => {
                    setImportModalVisible(false);
                    fetchTestCases();
                }}
                projects={projects}
            />
            
            {/* 导出对话框 */}
            <TestCaseExport
                visible={exportModalVisible}
                onClose={() => setExportModalVisible(false)}
                selectedIds={selectedRowKeys}
            />
        </div>
    );
};

export default TestCaseList; 