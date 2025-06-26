import React, { useEffect, useState } from 'react'; // 引入 useEffect 和 useState
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout, Spin, Select } from 'antd'; // 引入 Select
import './App.css';
import api from './services/api'; // 引入 api 服务

// 懒加载组件
const TestCaseList = React.lazy(() => import('./pages/testCase/TestCaseList'));
const TestCaseForm = React.lazy(() => import('./pages/testCase/TestCaseForm'));
const TestCaseGenerator = React.lazy(() => import('./pages/testCase/TestCaseGenerator')); // 引入新的生成器组件
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const NotFound = React.lazy(() => import('./pages/NotFound'));
const ProjectList = React.lazy(() => import('./pages/project/ProjectList'));
const ProjectForm = React.lazy(() => import('./pages/project/ProjectForm'));

// 简易布局组件
// AppLayout 现在接收 projects, currentProject 和 onProjectChange 作为 props
const AppLayout = ({ children, projects, currentProject, onProjectChange }) => {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout.Header style={{ background: '#fff', padding: '0 24px' }}>
        <div style={{ float: 'left', fontSize: '18px', fontWeight: 'bold' }}>
          AI自动化测试平台
        </div>
        {/* 项目选择下拉框 */}
        <div style={{ float: 'right', lineHeight: '64px' }}>
          <span style={{ marginRight: '8px' }}>当前项目:</span>
          <Select
            value={currentProject ? currentProject.id : undefined}
            style={{ width: 180 }}
            onChange={onProjectChange}
            placeholder="请选择项目"
            loading={!projects.length && !currentProject} // 如果项目列表为空且没有当前项目，显示加载中
          >
            {projects.map(project => (
              <Select.Option key={project.id} value={project.id}>
                {project.name}
              </Select.Option>
            ))}
          </Select>
        </div>
      </Layout.Header>
      <Layout>
        <Layout.Sider width={200} style={{ background: '#fff' }}>
          <div style={{ padding: '24px 0' }}>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li style={{ padding: '12px 24px' }}>
                <a href="/">仪表盘</a>
              </li>
              <li style={{ padding: '12px 24px' }}>
                <a href="/test-cases">测试用例</a>
              </li>
              <li style={{ padding: '12px 24px' }}>
                <a href="/projects">项目管理</a>
              </li>
            </ul>
          </div>
        </Layout.Sider>
        <Layout style={{ padding: '24px' }}>
          <Layout.Content
            style={{ background: '#fff', padding: 24, margin: 0, minHeight: 280 }}
          >
            <React.Suspense fallback={<Spin size="large" tip="加载中..." style={{ marginTop: 100, width: '100%' }} />}>
              {children}
            </React.Suspense>
          </Layout.Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

function App() {
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await api.getProjects();
        setProjects(response.data);
        // 默认选中第一个项目，如果没有则不设置
        if (response.data.length > 0) {
          setCurrentProject(response.data[0]);
        }
      } catch (error) {
        console.error('获取项目列表失败:', error);
      }
    };
    fetchProjects();
  }, []);

  const handleProjectChange = (projectId) => {
    const selectedProject = projects.find(p => p.id === projectId);
    setCurrentProject(selectedProject);
  };

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <AppLayout projects={projects} currentProject={currentProject} onProjectChange={handleProjectChange}>
              <Dashboard currentProject={currentProject} /> {/* 传递 currentProject */}
            </AppLayout>
          }
        />
        <Route
          path="/test-cases"
          element={
            <AppLayout projects={projects} currentProject={currentProject} onProjectChange={handleProjectChange}>
              <TestCaseList currentProject={currentProject} /> {/* 传递 currentProject */}
            </AppLayout>
          }
        />
        <Route
          path="/test-cases/create"
          element={
            <AppLayout projects={projects} currentProject={currentProject} onProjectChange={handleProjectChange}>
              <TestCaseForm isEdit={false} currentProject={currentProject} projects={projects} />
            </AppLayout>
          }
        />
        <Route
          path="/test-cases/:id/edit"
          element={
            <AppLayout projects={projects} currentProject={currentProject} onProjectChange={handleProjectChange}>
              <TestCaseForm isEdit={true} currentProject={currentProject} projects={projects} />
            </AppLayout>
          }
        />
        <Route
          path="/test-cases/generate" // 新增的路由
          element={
            <AppLayout projects={projects} currentProject={currentProject} onProjectChange={handleProjectChange}>
              <TestCaseGenerator currentProject={currentProject} projects={projects} />
            </AppLayout>
          }
        />
        <Route
          path="/projects"
          element={
            <AppLayout projects={projects} currentProject={currentProject} onProjectChange={handleProjectChange}>
              <ProjectList />
            </AppLayout>
          }
        />
        <Route
          path="/projects/create"
          element={
            <AppLayout projects={projects} currentProject={currentProject} onProjectChange={handleProjectChange}>
              <ProjectForm isEdit={false} />
            </AppLayout>
          }
        />
        <Route
          path="/projects/:id/edit"
          element={
            <AppLayout projects={projects} currentProject={currentProject} onProjectChange={handleProjectChange}>
              <ProjectForm isEdit={true} />
            </AppLayout>
          }
        />
        <Route
          path="*"
          element={
            <AppLayout projects={projects} currentProject={currentProject} onProjectChange={handleProjectChange}>
              <NotFound />
            </AppLayout>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;