const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const config = require('../config/config');

// 用户模型可能不存在，暂时使用一个占位符
const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    role: String
}));

/**
 * 验证JWT令牌的中间件
 */
exports.authMiddleware = async (req, res, next) => {
    try {
        // 从请求头中获取token
        let token = req.header('Authorization');
        
        // 检查token是否存在
        if (!token) {
            return res.status(401).json({
                success: false,
                error: '未提供访问令牌，请登录'
            });
        }
        
        // 移除Bearer前缀
        if (token.startsWith('Bearer ')) {
            token = token.slice(7, token.length);
        }
        
        // 验证token
        try {
            const decoded = jwt.verify(token, config.JWT_SECRET);
            
            // 查找用户
            const user = await User.findById(decoded.id);
            
            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: '无效的用户'
                });
            }
            
            // 将用户信息添加到请求对象
            req.user = user;
            next();
        } catch (error) {
            return res.status(401).json({
                success: false,
                error: '令牌已过期或无效，请重新登录'
            });
        }
    } catch (error) {
        console.error('授权中间件错误:', error);
        res.status(500).json({
            success: false,
            error: '服务器内部错误'
        });
    }
};

/**
 * 检查用户角色权限的中间件
 * @param {string[]} roles - 允许访问的角色数组
 */
exports.authorizeRoles = (...roles) => {
    return (req, res, next) => {
        // 检查用户角色是否在允许的角色列表中
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                error: `角色 (${req.user.role}) 没有权限访问此资源`
            });
        }
        
        next();
    };
}; 