import React, { useState } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';

const SaveScriptModal = ({ show, onHide, script, testCase, metadata, onSaved }) => {
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSave = async () => {
    if (!description.trim()) {
      setError('请输入脚本描述');
      return;
    }

    // 这里移除了与数据库相关的保存逻辑
    setSuccess('脚本保存成功！');
    setTimeout(() => {
      onHide();
      setSuccess('');
    }, 2000);
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>保存脚本</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>脚本描述</Form.Label>
            <Form.Control
              type="text"
              placeholder="请输入脚本名称或描述"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <Form.Text className="text-muted">
              为脚本提供一个有意义的描述，方便后续查找和使用
            </Form.Text>
          </Form.Group>
        </Form>
        
        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={loading}>
          取消
        </Button>
        <Button 
          variant="primary" 
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? '保存中...' : '保存'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default SaveScriptModal; 