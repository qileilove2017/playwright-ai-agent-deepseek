import React, { useState } from 'react';
import { Layout, Menu, Dropdown, Button, Avatar, Space, Badge, Divider } from 'antd';
import { 
    UserOutlined, 
    BellOutlined, 
    SettingOutlined, 
    LogoutOutlined, 
    QuestionCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Header } = Layout;

const AppHeader = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    
    // 假设当前登录的用户信息
    const currentUser = {
        name: '测试用户',
        avatar: null,
        role: '管理员'
    };
    
    // 处理退出登录
    const handleLogout = () => {
        // 清除本地存储的认证信息
        localStorage.removeItem('authToken');
        
        // 导航到登录页
        navigate('/login');
    };
    
    // 用户菜单
    const userMenu = (
        <Menu>
            <Menu.Item key="profile" icon={<UserOutlined />}>
                个人信息
            </Menu.Item>
            <Menu.Item key="settings" icon={<SettingOutlined />}>
                账号设置
            </Menu.Item>
            <Menu.Divider />
            <Menu.Item 
                key="logout" 
                icon={<LogoutOutlined />} 
                onClick={handleLogout}
                danger
            >
                退出登录
            </Menu.Item>
        </Menu>
    );
    
    // 通知菜单
    const notificationMenu = (
        <Menu style={{ width: 320 }}>
            <Menu.Item key="header" disabled>
                <div style={{ fontWeight: 'bold' }}>通知中心</div>
            </Menu.Item>
            <Menu.Divider />
            {notifications.length === 0 ? (
                <Menu.Item key="empty" disabled>
                    <div style={{ textAlign: 'center', padding: '10px 0' }}>
                        暂无通知
                    </div>
                </Menu.Item>
            ) : (
                notifications.map(notification => (
                    <Menu.Item key={notification.id}>
                        <div>
                            <div style={{ fontWeight: 'bold' }}>
                                {notification.title}
                            </div>
                            <div style={{ fontSize: 12, color: '#999' }}>
                                {notification.content}
                            </div>
                            <div style={{ fontSize: 12, color: '#ccc', textAlign: 'right' }}>
                                {notification.time}
                            </div>
                        </div>
                    </Menu.Item>
                ))
            )}
            <Menu.Divider />
            <Menu.Item key="all">
                <div style={{ textAlign: 'center' }}>
                    查看全部
                </div>
            </Menu.Item>
        </Menu>
    );

    return (
        <Header
            style={{
                padding: '0 24px',
                background: '#fff',
                boxShadow: '0 1px 4px rgba(0, 0, 0, 0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}
        >
            <div className="logo">
                {/* Logo可以放在这里 */}
            </div>
            
            <Space size="large">
                {/* 帮助按钮 */}
                <Button 
                    type="text" 
                    icon={<QuestionCircleOutlined />} 
                    onClick={() => navigate('/help')}
                />
                
                {/* 通知菜单 */}
                <Dropdown
                    overlay={notificationMenu}
                    trigger={['click']}
                    placement="bottomRight"
                >
                    <Badge count={notifications.length} size="small">
                        <Button 
                            type="text" 
                            icon={<BellOutlined />} 
                            style={{ fontSize: 16 }}
                        />
                    </Badge>
                </Dropdown>
                
                {/* 用户菜单 */}
                <Dropdown 
                    overlay={userMenu} 
                    trigger={['click']}
                    placement="bottomRight"
                >
                    <div style={{ cursor: 'pointer' }}>
                        <Space>
                            <Avatar 
                                icon={<UserOutlined />} 
                                src={currentUser.avatar}
                            />
                            <span>{currentUser.name}</span>
                        </Space>
                    </div>
                </Dropdown>
            </Space>
        </Header>
    );
};

export default AppHeader; 