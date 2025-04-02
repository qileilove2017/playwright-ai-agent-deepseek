const mongoose = require('mongoose');

const scriptSchema = new mongoose.Schema({
    script: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: '未命名脚本'
    },
    testCase: {
        type: String,
        default: ''
    },
    metadata: {
        type: Object,
        default: {}
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

const ScriptModel = mongoose.model('Script', scriptSchema);

module.exports = ScriptModel; 