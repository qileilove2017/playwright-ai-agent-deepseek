const TestCase = require('../models/testCaseModel');
const fs = require('fs');
const path = require('path');
const { parseString, Builder } = require('xml2js');
const ExcelJS = require('exceljs');
const json2csv = require('json2csv').parse;

// 创建测试用例
exports.createTestCase = async (req, res) => {
    try {
        const testCaseData = req.body;
        
        // 设置创建者
        testCaseData.createdBy = req.user._id;
        
        const testCase = new TestCase(testCaseData);
        await testCase.save();
        
        res.status(201).json({
            success: true,
            data: testCase
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// 获取所有测试用例（带分页和过滤）
exports.getAllTestCases = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            projectId, 
            module, 
            status, 
            priority,
            tags,
            search
        } = req.query;
        
        // 构建查询条件
        const query = {};
        
        if (projectId) query.projectId = projectId;
        if (module) query.module = module;
        if (status) query.status = status;
        if (priority) query.priority = priority;
        if (tags) {
            const tagArray = tags.split(',');
            query.tags = { $in: tagArray };
        }
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }
        
        // 计算分页
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        // 执行查询
        const testCases = await TestCase.find(query)
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ updatedAt: -1 })
            .populate('createdBy', 'name email')
            .populate('updatedBy', 'name email')
            .populate('dependencies', 'name');
            
        // 获取总数
        const total = await TestCase.countDocuments(query);
        
        res.status(200).json({
            success: true,
            data: testCases,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// 获取单个测试用例
exports.getTestCase = async (req, res) => {
    try {
        const testCase = await TestCase.findById(req.params.id)
            .populate('createdBy', 'name email')
            .populate('updatedBy', 'name email')
            .populate('dependencies', 'name');
            
        if (!testCase) {
            return res.status(404).json({
                success: false,
                error: '测试用例未找到'
            });
        }
        
        res.status(200).json({
            success: true,
            data: testCase
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// 更新测试用例
exports.updateTestCase = async (req, res) => {
    try {
        const testCaseData = req.body;
        
        // 设置更新者
        testCaseData.updatedBy = req.user._id;
        
        // 增加版本号
        testCaseData.version = testCaseData.version + 1;
        
        const testCase = await TestCase.findByIdAndUpdate(
            req.params.id,
            testCaseData,
            { new: true, runValidators: true }
        );
        
        if (!testCase) {
            return res.status(404).json({
                success: false,
                error: '测试用例未找到'
            });
        }
        
        res.status(200).json({
            success: true,
            data: testCase
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// 删除测试用例
exports.deleteTestCase = async (req, res) => {
    try {
        const testCase = await TestCase.findById(req.params.id);
        
        if (!testCase) {
            return res.status(404).json({
                success: false,
                error: '测试用例未找到'
            });
        }
        
        // 检查是否有其他测试用例依赖于此测试用例
        const dependencies = await TestCase.find({ 
            dependencies: req.params.id 
        });
        
        if (dependencies.length > 0) {
            return res.status(400).json({
                success: false,
                error: '无法删除，其他测试用例依赖于此测试用例',
                dependencies: dependencies.map(d => ({ id: d._id, name: d.name }))
            });
        }
        
        await testCase.remove();
        
        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// 批量操作测试用例
exports.bulkOperateTestCases = async (req, res) => {
    try {
        const { operation, ids, data } = req.body;
        
        switch (operation) {
            case 'delete':
                await TestCase.deleteMany({ _id: { $in: ids } });
                break;
                
            case 'update':
                await TestCase.updateMany(
                    { _id: { $in: ids } },
                    { $set: data }
                );
                break;
                
            case 'duplicate':
                const testCases = await TestCase.find({ _id: { $in: ids } });
                const duplicates = testCases.map(tc => {
                    const newTC = tc.toObject();
                    delete newTC._id;
                    newTC.name = `${newTC.name} (copy)`;
                    newTC.createdBy = req.user._id;
                    newTC.status = 'draft';
                    newTC.version = 1;
                    return newTC;
                });
                
                await TestCase.insertMany(duplicates);
                break;
                
            default:
                return res.status(400).json({
                    success: false,
                    error: `不支持的操作: ${operation}`
                });
        }
        
        res.status(200).json({
            success: true,
            message: '批量操作成功',
            operation,
            count: ids.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// 导入测试用例 (支持JSON, CSV, Excel, XML)
exports.importTestCases = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: '未提供文件'
            });
        }
        
        const filePath = req.file.path;
        const fileExt = path.extname(req.file.originalname).toLowerCase();
        let testCases = [];
        
        // 解析文件内容
        switch (fileExt) {
            case '.json':
                const jsonContent = fs.readFileSync(filePath, 'utf8');
                testCases = JSON.parse(jsonContent);
                break;
                
            case '.csv':
                const csvContent = fs.readFileSync(filePath, 'utf8');
                // 使用csv-parser或其他库解析CSV
                // ...
                break;
                
            case '.xlsx':
                const workbook = new ExcelJS.Workbook();
                await workbook.xlsx.readFile(filePath);
                const worksheet = workbook.getWorksheet(1);
                
                // 解析Excel
                const headers = [];
                worksheet.getRow(1).eachCell((cell) => {
                    headers.push(cell.value);
                });
                
                worksheet.eachRow((row, rowNumber) => {
                    if (rowNumber > 1) {
                        const testCase = {};
                        row.eachCell((cell, colNumber) => {
                            testCase[headers[colNumber - 1]] = cell.value;
                        });
                        testCases.push(testCase);
                    }
                });
                break;
                
            case '.xml':
                const xmlContent = fs.readFileSync(filePath, 'utf8');
                parseString(xmlContent, (err, result) => {
                    if (err) throw new Error('无法解析XML文件');
                    testCases = result.testcases.testcase.map(tc => {
                        // 转换XML结构为测试用例结构
                        // ...
                    });
                });
                break;
                
            default:
                return res.status(400).json({
                    success: false,
                    error: '不支持的文件格式'
                });
        }
        
        // 设置创建者和默认值
        testCases = testCases.map(tc => ({
            ...tc,
            createdBy: req.user._id,
            version: 1,
            status: 'draft'
        }));
        
        // 批量插入
        const result = await TestCase.insertMany(testCases);
        
        // 清理临时文件
        fs.unlinkSync(filePath);
        
        res.status(200).json({
            success: true,
            message: '导入成功',
            count: result.length
        });
    } catch (error) {
        // 清理临时文件
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// 导出测试用例 (支持JSON, CSV, Excel, XML)
exports.exportTestCases = async (req, res) => {
    try {
        const { ids, format } = req.query;
        
        // 查询测试用例
        const idArray = ids ? ids.split(',') : [];
        const query = idArray.length > 0 ? { _id: { $in: idArray } } : {};
        
        const testCases = await TestCase.find(query)
            .populate('createdBy', 'name email')
            .populate('updatedBy', 'name email');
            
        if (testCases.length === 0) {
            return res.status(404).json({
                success: false,
                error: '未找到测试用例'
            });
        }
        
        // 准备导出文件
        let fileContent = '';
        let fileName = `test_cases_export_${Date.now()}`;
        let contentType = '';
        
        switch (format) {
            case 'json':
                fileContent = JSON.stringify(testCases, null, 2);
                fileName += '.json';
                contentType = 'application/json';
                break;
                
            case 'csv':
                const fields = ['name', 'description', 'module', 'priority', 'status', 'version'];
                fileContent = json2csv(testCases, { fields });
                fileName += '.csv';
                contentType = 'text/csv';
                break;
                
            case 'excel':
                const workbook = new ExcelJS.Workbook();
                const worksheet = workbook.addWorksheet('Test Cases');
                
                // 设置表头
                worksheet.columns = [
                    { header: 'Name', key: 'name', width: 30 },
                    { header: 'Description', key: 'description', width: 50 },
                    { header: 'Module', key: 'module', width: 20 },
                    { header: 'Priority', key: 'priority', width: 10 },
                    { header: 'Status', key: 'status', width: 10 },
                    { header: 'Version', key: 'version', width: 10 }
                ];
                
                // 添加数据
                testCases.forEach(tc => {
                    worksheet.addRow({
                        name: tc.name,
                        description: tc.description,
                        module: tc.module,
                        priority: tc.priority,
                        status: tc.status,
                        version: tc.version
                    });
                });
                
                // 写入内存流
                const buffer = await workbook.xlsx.writeBuffer();
                fileContent = buffer;
                fileName += '.xlsx';
                contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
                break;
                
            case 'xml':
                const builder = new Builder();
                const xmlObj = {
                    testcases: {
                        testcase: testCases.map(tc => ({
                            name: tc.name,
                            description: tc.description,
                            module: tc.module,
                            priority: tc.priority,
                            status: tc.status,
                            version: tc.version
                        }))
                    }
                };
                fileContent = builder.buildObject(xmlObj);
                fileName += '.xml';
                contentType = 'application/xml';
                break;
                
            default:
                return res.status(400).json({
                    success: false,
                    error: '不支持的导出格式'
                });
        }
        
        // 设置响应头
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
        
        // 返回文件内容
        if (format === 'excel') {
            res.send(fileContent);
        } else {
            res.send(fileContent);
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};