import React, { useEffect, useState } from 'react';
import { Table, Button, Space, message, Modal } from 'antd';
import { EyeOutlined, CodeOutlined, CopyOutlined, PlayCircleOutlined } from '@ant-design/icons';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { RobotOutlined } from '@ant-design/icons';
import { Dropdown, Menu } from 'antd';
import { CheckCircleTwoTone } from '@ant-design/icons';

// TestCaseList 现在接收 currentProject 作为 prop
const TestCaseList = ({ currentProject }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedCode, setSelectedCode] = useState('');
  const [testCases, setTestCases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isGenerateModalVisible, setIsGenerateModalVisible] = useState(false);
  const [isCodeDisplayModalVisible, setIsCodeDisplayModalVisible] = useState(false);
  const [isExecuteModalVisible, setIsExecuteModalVisible] = useState(false);
  const [executionResult, setExecutionResult] = useState('');
  const [generatedAutomationCode, setGeneratedAutomationCode] = useState('');
  const [currentTestCaseId, setCurrentTestCaseId] = useState(null);
  const [currentCodeType, setCurrentCodeType] = useState('');

  useEffect(() => {
    const fetchTestCases = async () => {
      if (!currentProject) {
        setTestCases([]); // 如果没有选中项目，则清空列表
        return;
      }

      setLoading(true);
      try {
        // 根据 currentProject.id 获取测试用例
        const response = await api.getTestCases(currentProject.id);
        setTestCases(response.data);
      } catch (error) {
        console.error('获取测试用例列表失败:', error);
        message.error('获取测试用例列表失败');
      } finally {
        setLoading(false);
      }
    };

    fetchTestCases();
  }, [currentProject]); // 依赖 currentProject，当它改变时重新获取数据

  const handleShowCode = (code) => {
    setSelectedCode(code);
    setIsModalVisible(true);
  };

  const handleGenerateCode = (testCaseId) => {
    setCurrentTestCaseId(testCaseId);
    setIsGenerateModalVisible(true);
  };

  const handleMenuClick = async (e) => {
    const codeType = e.key;
    setCurrentCodeType(codeType);
    setIsGenerateModalVisible(false);
    setLoading(true);
    // 新增：先从 testCases 中查找当前用例的对应代码字段
    const currentTestCase = testCases.find(tc => tc.id === currentTestCaseId);
    let codeField = '';
    if (codeType === 'Playwright-Js') codeField = 'playwrightJsCode';
    else if (codeType === 'Playwright-Py') codeField = 'playwrightPyCode';
    else if (codeType === 'WebDriver-Java') codeField = 'webdriverJavaCode';
    else if (codeType === 'WebDriver-Py') codeField = 'webdriverPyCode';
    let code = '';
    if (currentTestCase && currentTestCase[codeField] && String(currentTestCase[codeField]).trim() !== '' && currentTestCase[codeField] !== true && currentTestCase[codeField] !== 'true') {
      code = currentTestCase[codeField];
      setGeneratedAutomationCode(String(code));
      setIsCodeDisplayModalVisible(true);
      setLoading(false);
      return;
    }
    try {
      const response = await api.generateAutomationCode(currentTestCaseId, codeType);
      if (typeof response.data === 'boolean' && response.data === true) {
        code = '';
      } else {
        code = response.data[Object.keys(response.data)[0]];
      }
      setGeneratedAutomationCode(String(code));
      setIsCodeDisplayModalVisible(true);
    } catch (error) {
      console.error('生成自动化代码失败:', error);
      message.error('生成自动化代码失败: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedAutomationCode);
    message.success('代码已复制到剪贴板');
  };

  const handleExecuteCode = async (testCaseId, codeType) => {
    setLoading(true);
    try {
      const response = await api.executeAutomationCode(testCaseId, codeType);
      setExecutionResult(response.data.output);
      setIsExecuteModalVisible(true);
    } catch (error) {
      console.error('执行自动化代码失败:', error);
      message.error('执行自动化代码失败: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };
  const renderExecuteMenu = (testCaseId) => {
    return (
      <Menu onClick={({ key }) => handleExecuteCode(testCaseId, key)}>
        <Menu.Item key="Playwright-Js">Playwright (JavaScript)</Menu.Item>
        <Menu.Item key="Playwright-Py">Playwright (Python)</Menu.Item>
      </Menu>
    );
  };

  const renderMenu = () => {
    const currentTestCase = testCases.find(tc => tc.id === currentTestCaseId);
    const codeStatus = {
      'Playwright-Js': currentTestCase && currentTestCase.playwrightJsCode && String(currentTestCase.playwrightJsCode).trim() !== '' && currentTestCase.playwrightJsCode !== true && currentTestCase.playwrightJsCode !== 'true',
      'Playwright-Py': currentTestCase && currentTestCase.playwrightPyCode && String(currentTestCase.playwrightPyCode).trim() !== '' && currentTestCase.playwrightPyCode !== true && currentTestCase.playwrightPyCode !== 'true',
      'WebDriver-Java': currentTestCase && currentTestCase.webdriverJavaCode && String(currentTestCase.webdriverJavaCode).trim() !== '' && currentTestCase.webdriverJavaCode !== true && currentTestCase.webdriverJavaCode !== 'true',
      'WebDriver-Py': currentTestCase && currentTestCase.webdriverPyCode && String(currentTestCase.webdriverPyCode).trim() !== '' && currentTestCase.webdriverPyCode !== true && currentTestCase.webdriverPyCode !== 'true',
    };
    return (
      <Menu onClick={handleMenuClick}>
        <Menu.Item key="Playwright-Js">
          Playwright (JavaScript)
          {codeStatus['Playwright-Js'] && <CheckCircleTwoTone twoToneColor="#52c41a" style={{marginLeft:8}} />}
        </Menu.Item>
        <Menu.Item key="Playwright-Py">
          Playwright (Python)
          {codeStatus['Playwright-Py'] && <CheckCircleTwoTone twoToneColor="#52c41a" style={{marginLeft:8}} />}
        </Menu.Item>
        <Menu.Item key="WebDriver-Java">
          WebDriver (Java)
          {codeStatus['WebDriver-Java'] && <CheckCircleTwoTone twoToneColor="#52c41a" style={{marginLeft:8}} />}
        </Menu.Item>
        <Menu.Item key="WebDriver-Py">
          WebDriver (Python)
          {codeStatus['WebDriver-Py'] && <CheckCircleTwoTone twoToneColor="#52c41a" style={{marginLeft:8}} />}
        </Menu.Item>
      </Menu>
    );
  };

  const columns = [
    {
      title: '用例名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: '所属项目',
      dataIndex: ['project', 'name'], // 显示关联项目的名称
      key: 'projectName',
      render: (text, record) => record.project ? record.project.name : 'N/A'
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
          <Link to={`/test-cases/${record.id}/edit`}>编辑</Link>
                    <Button type="link" danger>删除</Button>
          <Button icon={<EyeOutlined />} onClick={() => handleShowCode(record.generatedCode)}>查看代码</Button>
          <Dropdown
            overlay={renderMenu()}
            trigger={['click']}
          >
            <Button icon={<CodeOutlined />} onClick={() => handleGenerateCode(record.id)}>生成自动化代码</Button>
          </Dropdown>
          <Dropdown
            overlay={renderExecuteMenu(record.id)}
            trigger={['click']}
          >
            <Button icon={<PlayCircleOutlined />}>执行自动化代码</Button>
          </Dropdown>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Link to="/test-cases/create">
          <Button type="primary">新建测试用例</Button>
        </Link>
        <Link to="/test-cases/generate"> {/* 新增的快速生成按钮 */}
          <Button type="default" icon={<RobotOutlined />}>快速生成用例</Button>
        </Link>
      </div>
            <Table
        columns={columns}
        dataSource={testCases}
        rowKey="id"
        loading={loading}
        locale={{ emptyText: currentProject ? '当前项目暂无测试用例' : '请先选择一个项目' }}
      />
      <Modal
        title="生成的代码"
        visible={isModalVisible}
        onOk={() => setIsModalVisible(false)}
        onCancel={() => setIsModalVisible(false)}
        width={800}
        footer={[
          <Button key="back" onClick={() => setIsModalVisible(false)}>
            关闭
          </Button>,
        ]}
      >
        <SyntaxHighlighter language="json" style={docco}>
          {selectedCode ? JSON.stringify(JSON.parse(selectedCode), null, 2) : ''}
        </SyntaxHighlighter>
      </Modal>

      {/* 生成自动化代码选择模态框 */}
      <Modal
        title={
          <span>
            选择自动化代码类型
            {currentTestCaseId && testCases.find(tc => tc.id === currentTestCaseId) && (
              <span style={{ marginLeft: 16, color: '#52c41a' }}>
                <CheckCircleTwoTone twoToneColor="#52c41a" style={{ marginRight: 4 }} />
                表示代码已生成，点击即可查看
              </span>
            )}
          </span>
        }
        visible={isGenerateModalVisible}
        onCancel={() => setIsGenerateModalVisible(false)}
        footer={null}
      >
        {renderMenu()}
      </Modal>

      {/* 显示生成的自动化代码模态框 */}
      <Modal
        title={`${currentCodeType} 自动化代码`}
        visible={isCodeDisplayModalVisible}
        onOk={() => setIsCodeDisplayModalVisible(false)}
        onCancel={() => setIsCodeDisplayModalVisible(false)}
        width={800}
        footer={[
          <Button key="copy" icon={<CopyOutlined />} onClick={handleCopyCode}>
            复制
          </Button>,
          <Button key="back" onClick={() => setIsCodeDisplayModalVisible(false)}>
            关闭
          </Button>,
        ]}
      >
        <SyntaxHighlighter language={currentCodeType.includes('-') ? currentCodeType.split('-')[1].toLowerCase().replace('js', 'javascript').replace('py', 'python') : 'plaintext'} style={docco}>
          {generatedAutomationCode}
        </SyntaxHighlighter>
      </Modal>

      {/* 自动化代码执行结果模态框 */}
      <Modal
        title="自动化代码执行结果"
        visible={isExecuteModalVisible}
        onOk={() => setIsExecuteModalVisible(false)}
        onCancel={() => setIsExecuteModalVisible(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setIsExecuteModalVisible(false)}>
            关闭
          </Button>,
        ]}
      >
        <SyntaxHighlighter language="bash" style={docco}>
          {executionResult}
        </SyntaxHighlighter>
      </Modal>
    </div>
  );
};

export default TestCaseList;