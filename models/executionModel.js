const mongoose = require('mongoose');

const executionSchema = new mongoose.Schema({
    script: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: '脚本执行'
    },
    status: {
        type: String,
        enum: ['pending', 'running', 'completed', 'failed'],
        default: 'pending'
    },
    result: {
        type: Object,
        default: null
    },
    error: {
        type: String,
        default: null
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    mode: {
        type: String,
        enum: ['sequential', 'parallel'],
        default: 'sequential'
    },
    duration: {
        type: Number,
        default: 0
    }
});

const ExecutionModel = mongoose.model('Execution', executionSchema);

module.exports = ExecutionModel; 