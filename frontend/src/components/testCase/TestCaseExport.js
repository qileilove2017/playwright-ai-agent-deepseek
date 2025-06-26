import React, { useState } from 'react';
import { 
    Modal, Form, Radio, Button, Checkbox, 
    message, Space, Spin, Alert 
} from 'antd';
import axios from 'axios';
import { 
    DownloadOutlined, FileExcelOutlined, 
    FileTextOutlined, FileJpgOutlined, FileJsonOutlined 
} from '@ant-design/icons';

const TestCaseExport = ({ visible, onClose, selectedIds = [] }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    
    // 处理导出
    const handleExport = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);
            
            const format = values.format;
            const scope = values.scope;
            const fields = values.fields ? values.fields.join(',') : '';
            
            let endpoint = '/api/test-cases/export';
            const params = { format };
            
            // 添加ID参数
            if (scope === 'selected' && selectedIds.length > 0) {
                params.ids = selectedIds.join(',');
            }
            
            // 添加字段参数
            if (fields) {
                params.fields = fields;
            }
            
            // 发起请求
            const response = await axios.get(endpoint, {
                params,
                responseType: 'blob'
            });
            
            // 创建Blob URL
            const blob = new Blob([response.data], {
                type: response.headers['content-type']
            });
            const url = window.URL.createObjectURL(blob);
            
            // 获取文件名
            let filename = 'test_cases_export';
            const disposition = response.headers['content-disposition'];
            if (disposition && disposition.indexOf('attachment') !== -1) {
                const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
                const matches = filenameRegex.exec(disposition);
                if (matches != null && matches[1]) { 
                    filename = matches[1].replace(/['"]/g, '');
                }
            }
            
            // 添加扩展名
            if (!filename.includes('.')) {
                filename += `.${format}`;
            }
            
            // 创建下载链接
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            
            // 释放Blob URL
            window.URL.revokeObjectURL(url);
            
            setResult({
                success: true,
                message: '导出成功'
            });
            
            message.success('导出成功');
            
            // 延迟关闭
            setTimeout(() => {
                setResult(null);
                onClose();
            }, 1500);
        } catch (error) {
            console.error('导出失败:', error);
            
            setResult({
                success: false,
                message: `导出失败: ${error.response?.data?.error || error.message}`
            });
            
            message.error(`导出失败: ${error.response?.data?.error || error.message}`);
        } finally {
            setLoading(false);
        }
    };
    
    // 处理关闭
    const handleClose = () => {
        form.resetFields();
        setResult(null);
        onClose();
    };
    
    // 获取图标
    const getFormatIcon = (format) => {
        switch (format) {
            case 'excel':
                return <FileExcelOutlined style={{ color: '#52c41a' }} />;
            case 'csv':
                return <FileTextOutlined style={{ color: '#1890ff' }} />;
            case 'xml':
                return <FileJpgOutlined style={{ color: '#faad14' }} />;
            case 'json':
                return <FileJsonOutlined style={{ color: '#722ed1' }} />;
            default:
                return <DownloadOutlined />;
        }
    };
    
    return (
        <Modal
            title="导出测试用例"
            open={visible}
            onCancel={handleClose}
            footer={null}
            width={500}
            destroyOnClose
        >
            <Spin spinning={loading}>
                <Form
                    form={form}
                    layout="vertical"
                    initialValues={{
                        format: 'excel',
                        scope: selectedIds.length > 0 ? 'selected' : 'all',
                        fields: ['name', 'description', 'module', 'priority', 'status', 'steps']
                    }}
                >
                    <Form.Item
                        name="format"
                        label="导出格式"
                        rules={[{ required: true, message: '请选择导出格式' }]}
                    >
                        <Radio.Group buttonStyle="solid">
                            <Radio.Button value="excel">
                                <Space>{getFormatIcon('excel')} Excel</Space>
                            </Radio.Button>
                            <Radio.Button value="csv">
                                <Space>{getFormatIcon('csv')} CSV</Space>
                            </Radio.Button>
                            <Radio.Button value="json">
                                <Space>{getFormatIcon('json')} JSON</Space>
                            </Radio.Button>
                            <Radio.Button value="xml">
                                <Space>{getFormatIcon('xml')} XML</Space>
                            </Radio.Button>
                        </Radio.Group>
                    </Form.Item>
                    
                    <Form.Item
                        name="scope"
                        label="导出范围"
                        rules={[{ required: true, message: '请选择导出范围' }]}
                    >
                        <Radio.Group>
                            <Radio value="all">所有测试用例</Radio>
                            <Radio 
                                value="selected" 
                                disabled={selectedIds.length === 0}
                            >
                                已选测试用例 ({selectedIds.length})
                            </Radio>
                        </Radio.Group>
                    </Form.Item>
                    
                    <Form.Item
                        name="fields"
                        label="导出字段"
                    >
                        <Checkbox.Group>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                <Checkbox value="name">名称</Checkbox>
                                <Checkbox value="description">描述</Checkbox>
                                <Checkbox value="module">模块</Checkbox>
                                <Checkbox value="priority">优先级</Checkbox>
                                <Checkbox value="status">状态</Checkbox>
                                <Checkbox value="steps">测试步骤</Checkbox>
                                <Checkbox value="testData">测试数据</Checkbox>
                                <Checkbox value="verificationPoints">验证点</Checkbox>
                                <Checkbox value="preconditions">前置条件</Checkbox>
                                <Checkbox value="postconditions">后置条件</Checkbox>
                                <Checkbox value="tags">标签</Checkbox>
                                <Checkbox value="createdAt">创建时间</Checkbox>
                                <Checkbox value="updatedAt">更新时间</Checkbox>
                            </div>
                        </Checkbox.Group>
                    </Form.Item>
                    
                    {result && (
                        <Form.Item>
                            <Alert
                                message={result.success ? "导出成功" : "导出失败"}
                                description={result.message}
                                type={result.success ? "success" : "error"}
                                showIcon
                            />
                        </Form.Item>
                    )}
                    
                    <Form.Item>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <Button onClick={handleClose}>
                                取消
                            </Button>
                            <Button 
                                type="primary" 
                                icon={<DownloadOutlined />}
                                onClick={handleExport}
                                loading={loading}
                            >
                                导出
                            </Button>
                        </div>
                    </Form.Item>
                </Form>
            </Spin>
        </Modal>
    );
};

export default TestCaseExport; 