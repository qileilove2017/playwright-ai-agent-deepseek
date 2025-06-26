import React, { useState } from 'react';
import { 
    Modal, Form, Select, Upload, Button, Radio, 
    message, Alert, Progress, Space 
} from 'antd';
import { 
    UploadOutlined, FileExcelOutlined, 
    FileOutlined, FilePdfOutlined 
} from '@ant-design/icons';
import axios from 'axios';

const { Option } = Select;
const { Dragger } = Upload;

const TestCaseImport = ({ visible, onClose, onSuccess, projects }) => {
    const [form] = Form.useForm();
    const [fileList, setFileList] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [importResult, setImportResult] = useState(null);

    // 处理文件上传前的检查
    const beforeUpload = (file) => {
        const allowedTypes = [
            'application/json',
            'text/csv',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
            'application/xml',
            'text/xml'
        ];
        
        // 检查文件类型
        const isAllowedType = allowedTypes.includes(file.type);
        if (!isAllowedType) {
            message.error('只支持 JSON, CSV, Excel 或 XML 文件!');
            return false;
        }
        
        // 检查文件大小
        const isLt10M = file.size / 1024 / 1024 < 10;
        if (!isLt10M) {
            message.error('文件必须小于 10MB!');
            return false;
        }
        
        return false; // 阻止自动上传
    };

    // 处理文件列表变化
    const handleChange = ({ fileList }) => {
        // 只保留最后一个文件
        setFileList(fileList.slice(-1));
    };

    // 处理提交
    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            
            if (fileList.length === 0) {
                message.error('请选择文件');
                return;
            }
            
            setUploading(true);
            setUploadProgress(0);
            
            // 创建FormData
            const formData = new FormData();
            formData.append('file', fileList[0].originFileObj);
            formData.append('projectId', values.projectId);
            formData.append('options', JSON.stringify({
                overwrite: values.importMode === 'overwrite',
                validateOnly: values.validateOnly
            }));
            
            // 上传文件
            const response = await axios.post('/api/test-cases/import', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round(
                        (progressEvent.loaded * 100) / progressEvent.total
                    );
                    setUploadProgress(percentCompleted);
                }
            });
            
            // 处理响应
            setImportResult({
                success: true,
                count: response.data.count,
                message: `成功导入 ${response.data.count} 个测试用例`
            });
            
            message.success(`成功导入 ${response.data.count} 个测试用例`);
            
            // 延迟关闭，显示结果
            setTimeout(() => {
                handleReset();
                onSuccess();
            }, 2000);
        } catch (error) {
            console.error('导入失败:', error);
            
            setImportResult({
                success: false,
                message: `导入失败: ${error.response?.data?.error || error.message}`
            });
            
            message.error(`导入失败: ${error.response?.data?.error || error.message}`);
        } finally {
            setUploading(false);
        }
    };

    // 重置表单
    const handleReset = () => {
        form.resetFields();
        setFileList([]);
        setImportResult(null);
        setUploadProgress(0);
    };

    // 渲染上传组件
    const uploadProps = {
        name: 'file',
        multiple: false,
        fileList,
        beforeUpload,
        onChange: handleChange,
        onRemove: () => {
            setFileList([]);
            return true;
        },
        progress: {
            strokeColor: {
                '0%': '#108ee9',
                '100%': '#87d068',
            },
            strokeWidth: 3,
            format: percent => `${parseFloat(percent.toFixed(2))}%`,
        }
    };

    // 渲染图标
    const renderIcon = (file) => {
        if (!file || !file.type) return <FileOutlined />;
        
        if (file.type.includes('excel') || file.type.includes('spreadsheetml')) {
            return <FileExcelOutlined style={{ color: '#52c41a' }} />;
        } else if (file.type.includes('pdf')) {
            return <FilePdfOutlined style={{ color: '#f5222d' }} />;
        } else {
            return <FileOutlined />;
        }
    };

    return (
        <Modal
            title="导入测试用例"
            open={visible}
            onCancel={onClose}
            footer={null}
            width={700}
            destroyOnClose
        >
            <Form
                form={form}
                layout="vertical"
                initialValues={{
                    projectId: projects?.[0]?._id,
                    importMode: 'create',
                    validateOnly: false
                }}
            >
                <Form.Item
                    name="projectId"
                    label="目标项目"
                    rules={[
                        { required: true, message: '请选择目标项目' }
                    ]}
                >
                    <Select placeholder="选择目标项目">
                        {projects.map(project => (
                            <Option key={project._id} value={project._id}>
                                {project.name}
                            </Option>
                        ))}
                    </Select>
                </Form.Item>
                
                <Form.Item
                    name="importMode"
                    label="导入模式"
                >
                    <Radio.Group>
                        <Radio value="create">仅创建新测试用例</Radio>
                        <Radio value="overwrite">覆盖同名测试用例</Radio>
                    </Radio.Group>
                </Form.Item>
                
                <Form.Item
                    name="validateOnly"
                    label="验证模式"
                    valuePropName="checked"
                >
                    <Radio.Group>
                        <Radio value={false}>直接导入</Radio>
                        <Radio value={true}>仅验证不导入</Radio>
                    </Radio.Group>
                </Form.Item>
                
                <Form.Item label="选择文件">
                    <Dragger {...uploadProps}>
                        <p className="ant-upload-drag-icon">
                            <UploadOutlined />
                        </p>
                        <p className="ant-upload-text">
                            点击或拖拽文件到此区域上传
                        </p>
                        <p className="ant-upload-hint">
                            支持 JSON, CSV, Excel(xlsx) 和 XML 格式文件，大小不超过10MB
                        </p>
                    </Dragger>
                </Form.Item>
                
                {uploading && (
                    <Form.Item>
                        <Progress percent={uploadProgress} status="active" />
                    </Form.Item>
                )}
                
                {importResult && (
                    <Form.Item>
                        <Alert
                            message={importResult.success ? "导入成功" : "导入失败"}
                            description={importResult.message}
                            type={importResult.success ? "success" : "error"}
                            showIcon
                        />
                    </Form.Item>
                )}
                
                <Form.Item>
                    <Space style={{ float: 'right' }}>
                        <Button onClick={handleReset}>
                            重置
                        </Button>
                        <Button 
                            type="primary" 
                            onClick={handleSubmit}
                            loading={uploading}
                            disabled={fileList.length === 0}
                        >
                            {uploading ? '导入中...' : '开始导入'}
                        </Button>
                    </Space>
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default TestCaseImport; 