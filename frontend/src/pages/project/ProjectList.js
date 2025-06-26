import React, { useEffect, useState } from 'react';
import { Table, Button, Space, message } from 'antd';
import { Link } from 'react-router-dom';
import api from '../../services/api'; // 引入前端API服务

const ProjectList = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      try {
        const response = await api.getProjects();
        // Sequelize 返回的数据通常在 response.data 中
        setProjects(response.data); 
      } catch (error) {
        console.error('获取项目列表失败:', error);
        message.error('获取项目列表失败');
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []); // 空数组表示只在组件挂载时运行一次

  const columns = [
    {
      title: '项目名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text) => new Date(text).toLocaleString()
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Link to={`/projects/${record.id}/edit`}>编辑</Link> {/* Sequelize默认主键是id */}
          <Button type="link" danger>删除</Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Link to="/projects/create">
          <Button type="primary">新建项目</Button>
        </Link>
      </div>
      <Table 
        columns={columns} 
        dataSource={projects} 
        rowKey="id" // Sequelize默认主键是id
        loading={loading}
        locale={{ emptyText: '暂无项目数据' }} // 添加这一行
      />
    </div>
  );
};

export default ProjectList;