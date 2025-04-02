import React, { useState, useEffect } from 'react';
import { Card, Button, Form, ListGroup, Modal } from 'react-bootstrap';

const TemplateManager = ({ onSelectTemplate }) => {
  const [templates, setTemplates] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [templateScript, setTemplateScript] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // 移除了加载模板的数据库调用
    setTemplates([]);
  }, []);

  const handleSaveTemplate = () => {
    if (!templateName || !templateScript) {
      setError("请填写模板名称和脚本内容");
      return;
    }

    // 模拟保存模板
    setTemplates([...templates, { name: templateName, description: templateDescription, script: templateScript }]);
    resetForm();
    setShowAddModal(false);
  };

  const handleDeleteTemplate = async (id) => {
    if (window.confirm("确定要删除这个模板吗？")) {
      // 这里需要实现删除模板的功能
    }
  };

  const resetForm = () => {
    setTemplateName('');
    setTemplateDescription('');
    setTemplateScript('');
    setError('');
  };

  return (
    <div className="template-manager">
      <Card className="mb-4">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">脚本模板</h5>
          <Button size="sm" variant="primary" onClick={() => setShowAddModal(true)}>
            添加模板
          </Button>
        </Card.Header>
        <Card.Body>
          {loading && <p className="text-center">加载中...</p>}
          
          {error && <div className="alert alert-danger">{error}</div>}
          
          {templates.length === 0 && (
            <p className="text-center text-muted">暂无模板，点击"添加模板"创建</p>
          )}
          
          {templates.length > 0 && (
            <ListGroup>
              {templates.map((template, index) => (
                <ListGroup.Item 
                  key={index}
                  className="d-flex justify-content-between align-items-center"
                >
                  <div>
                    <h6>{template.name}</h6>
                    <p className="text-muted small mb-0">{template.description}</p>
                  </div>
                  <div>
                    <Button 
                      size="sm" 
                      variant="outline-primary"
                      className="me-2"
                      onClick={() => onSelectTemplate(template)}
                    >
                      使用
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline-danger"
                      onClick={() => handleDeleteTemplate(template.id)}
                    >
                      删除
                    </Button>
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </Card.Body>
      </Card>

      {/* 添加模板对话框 */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>添加脚本模板</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>模板名称</Form.Label>
              <Form.Control 
                type="text" 
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="输入模板名称"
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>描述</Form.Label>
              <Form.Control 
                as="textarea"
                rows={2}
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
                placeholder="输入模板描述"
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>脚本内容</Form.Label>
              <Form.Control 
                as="textarea"
                rows={10}
                value={templateScript}
                onChange={(e) => setTemplateScript(e.target.value)}
                placeholder="输入脚本内容"
                className="font-monospace"
              />
            </Form.Group>
          </Form>
          
          {error && <div className="alert alert-danger">{error}</div>}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddModal(false)}>
            取消
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSaveTemplate}
            disabled={loading}
          >
            {loading ? '保存中...' : '保存模板'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default TemplateManager; 