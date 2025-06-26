import React from 'react';
import { Card, Row, Col, Statistic, Button } from 'antd';
import { FileTextOutlined, PlayCircleOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  // 模拟统计数据
  const stats = {
    totalTestCases: 120,
    executedTestCases: 98,
    passedTestCases: 85,
    failedTestCases: 13
  };

  return (
    <div>
      <h2>仪表盘</h2>
      <p>欢迎使用AI自动化测试平台，这里是您的测试概况</p>
      
      <Row gutter={16} style={{ marginTop: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic 
              title="测试用例总数" 
              value={stats.totalTestCases} 
              prefix={<FileTextOutlined />} 
            />
            <div style={{ marginTop: 16 }}>
              <Link to="/test-cases">
                <Button type="primary">查看测试用例</Button>
              </Link>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="已执行测试用例" 
              value={stats.executedTestCases} 
              prefix={<PlayCircleOutlined />} 
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="通过测试用例" 
              value={stats.passedTestCases} 
              prefix={<CheckCircleOutlined />} 
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="失败测试用例" 
              value={stats.failedTestCases} 
              prefix={<CloseCircleOutlined />} 
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginTop: 24 }}>
        <h3>快速开始</h3>
        <Row gutter={16}>
          <Col span={8}>
            <Card title="创建测试用例">
              <p>创建一个新的测试用例，定义测试步骤和验证点</p>
              <Link to="/test-cases/create">
                <Button type="primary">创建测试用例</Button>
              </Link>
            </Card>
          </Col>
          <Col span={8}>
            <Card title="执行测试">
              <p>执行已有的测试用例或测试套件</p>
              <Button>执行测试</Button>
            </Card>
          </Col>
          <Col span={8}>
            <Card title="查看报告">
              <p>查看测试执行结果和统计报告</p>
              <Button>查看报告</Button>
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default Dashboard; 