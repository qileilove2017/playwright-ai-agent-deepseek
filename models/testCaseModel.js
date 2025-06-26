const mongoose = require('mongoose');

const testStepSchema = new mongoose.Schema({
    stepNumber: {
        type: Number,
        required: true
    },
    action: {
        type: String,
        required: true,
        enum: ['click', 'type', 'select', 'hover', 'wait', 'assert', 'navigate', 'custom']
    },
    target: {
        type: String,
        required: true
    },
    value: {
        type: String,
        required: false
    },
    description: {
        type: String,
        required: true
    },
    timeout: {
        type: Number,
        default: 30000
    },
    screenshot: {
        type: Boolean,
        default: false
    }
});

const testDataSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true
    },
    value: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    type: {
        type: String,
        enum: ['string', 'number', 'boolean', 'array', 'object'],
        required: true
    },
    description: String
});

const verificationPointSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: ['text', 'attribute', 'count', 'url', 'title', 'custom']
    },
    target: {
        type: String,
        required: true
    },
    expected: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    operator: {
        type: String,
        required: true,
        enum: ['equals', 'contains', 'startsWith', 'endsWith', 'matches', 'greaterThan', 'lessThan']
    },
    description: String
});

const executionHistorySchema = new mongoose.Schema({
    executionId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    status: {
        type: String,
        required: true,
        enum: ['passed', 'failed', 'blocked', 'skipped']
    },
    startTime: {
        type: Date,
        required: true
    },
    endTime: {
        type: Date,
        required: true
    },
    duration: {
        type: Number,
        required: true
    },
    error: {
        message: String,
        stack: String
    },
    screenshots: [String],
    logs: [String]
});

const testCaseSchema = new mongoose.Schema({
    // 基本信息
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    module: {
        type: String,
        required: true
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium'
    },
    tags: [{
        type: String,
        trim: true
    }],
    
    // 测试步骤
    steps: [testStepSchema],
    
    // 测试数据
    testData: [testDataSchema],
    
    // 验证点
    verificationPoints: [verificationPointSchema],
    
    // 元数据
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    version: {
        type: Number,
        default: 1
    },
    status: {
        type: String,
        enum: ['draft', 'active', 'deprecated'],
        default: 'draft'
    },
    
    // 执行历史
    executionHistory: [executionHistorySchema],
    
    // 其他配置
    retryCount: {
        type: Number,
        default: 0
    },
    timeout: {
        type: Number,
        default: 300000 // 5 minutes
    },
    preconditions: [String],
    postconditions: [String],
    dependencies: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TestCase'
    }]
}, {
    timestamps: true,
    versionKey: false
});

// 索引
testCaseSchema.index({ projectId: 1, name: 1 }, { unique: true });
testCaseSchema.index({ projectId: 1, module: 1 });
testCaseSchema.index({ tags: 1 });
testCaseSchema.index({ status: 1 });

// 中间件
testCaseSchema.pre('save', function(next) {
    if (this.isModified('steps')) {
        // 重新编号步骤
        this.steps.forEach((step, index) => {
            step.stepNumber = index + 1;
        });
    }
    next();
});

const TestCase = mongoose.model('TestCase', testCaseSchema);

module.exports = TestCase; 