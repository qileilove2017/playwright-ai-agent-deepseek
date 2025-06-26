const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, '请提供姓名'],
        trim: true
    },
    email: {
        type: String,
        required: [true, '请提供电子邮箱'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [
            /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
            '请提供有效的电子邮箱'
        ]
    },
    password: {
        type: String,
        required: [true, '请提供密码'],
        minlength: [6, '密码长度至少为6个字符'],
        select: false
    },
    role: {
        type: String,
        enum: ['admin', 'manager', 'tester', 'viewer'],
        default: 'tester'
    },
    avatar: {
        type: String,
        default: ''
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date
}, {
    timestamps: true,
    versionKey: false
});

// 密码加密中间件
userSchema.pre('save', async function(next) {
    // 只有当密码被修改时才进行加密
    if (!this.isModified('password')) {
        return next();
    }
    
    try {
        // 加盐并加密密码
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// 密码比对方法
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// 生成JWT令牌
userSchema.methods.generateAuthToken = function() {
    return jwt.sign(
        { id: this._id, role: this.role },
        config.JWT_SECRET,
        { expiresIn: config.JWT_EXPIRES_IN }
    );
};

// 生成密码重置令牌
userSchema.methods.generateResetPasswordToken = function() {
    // 生成随机令牌
    const resetToken = crypto.randomBytes(20).toString('hex');
    
    // 加密令牌并设置到用户文档
    this.resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
        
    // 设置过期时间 (10分钟)
    this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
    
    return resetToken;
};

// 索引
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });

const User = mongoose.model('User', userSchema);

module.exports = User; 