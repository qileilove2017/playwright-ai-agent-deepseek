import React, { useState, useEffect } from 'react';
import { Layout, Menu } from 'antd';
import {
    DashboardOutlined,
    ProjectOutlined,
    FileTextOutlined,
    FolderOutlined,
    BarChartOutlined,
    SettingOutlined,
    PlayCircleOutlined,
    AppstoreOutlined
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';

const { Sider } = Layout;

const AppSider = () => {
    const [collapsed, setCollapsed] = useState(false);
    const [selectedKeys, setSelectedKeys] = useState(['dashboard']);
    const location = useLocation();
    const navigate = useNavigate();

    // 根据当前路径设置选中的菜单项
    useEffect(() => {
        const pathname = location.pathname;
        let key = 'dashboard';

        if (pathname.startsWith('/projects')) {
            key = 'projects';
        } else if (pathname.startsWith('/test-cases')) {
            key = 'test-cases';
        } else if (pathname.startsWith('/test-suites')) {
            key = 'test-suites';
        } else if (pathname.startsWith('/reports')) {
            key = 'reports';
        } else if (pathname.startsWith('/settings')) {
            key = 'settings';
        }

        setSelectedKeys([key]);
    }, [location]);

    // 处理菜单项点击
    const handleMenuClick = (e) => {
        const key = e.key;

        // 导航到相应的路径
        switch (key) {
            case 'dashboard':
                navigate('/dashboard');
                break;
            case 'projects':
                navigate('/projects');
                break;
            case 'test-cases':
                navigate('/test-cases');
                break;
            case 'test-suites':
                navigate('/test-suites');
                break;
            case 'reports':
                navigate('/reports');
                break;
            case 'settings':
                navigate('/settings');
                break;
            default:
                navigate('/dashboard');
        }
    };

    return (
        <Sider
            theme="light"
            collapsible
            collapsed={collapsed}
            onCollapse={(value) => setCollapsed(value)}
            width={220}
            style={{
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)',
                zIndex: 10
            }}
        >
            <div
                style={{
                    height: 64,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderBottom: '1px solid #f0f0f0'
                }}
            >
                {!collapsed && (
                    <h2 style={{ margin: 0, fontSize: 16 }}>AI自动化测试平台</h2>
                )}
                {collapsed && (
                    <AppstoreOutlined style={{ fontSize: 20 }} />
                )}
            </div>

            <Menu
                theme="light"
                mode="inline"
                selectedKeys={selectedKeys}
                onClick={handleMenuClick}
                items={[
                    {
                        key: 'dashboard',
                        icon: <DashboardOutlined />,
                        label: '仪表盘'
                    },
                    {
                        key: 'projects',
                        icon: <ProjectOutlined />,
                        label: '项目管理'
                    },
                    {
                        key: 'test-cases',
                        icon: <FileTextOutlined />,
                        label: '测试用例'
                    },
                    {
                        key: 'test-suites',
                        icon: <FolderOutlined />,
                        label: '测试套件'
                    },
                    {
                        key: 'reports',
                        icon: <BarChartOutlined />,
                        label: '测试报告'
                    },
                    {
                        key: 'settings',
                        icon: <SettingOutlined />,
                        label: '系统设置'
                    }
                ]}
            />
        </Sider>
    );
};

export default AppSider; 