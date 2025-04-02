import React, { useState } from 'react';
import { Form, Button, Card, Alert, Spinner } from 'react-bootstrap';
import ScriptEditor from './ScriptEditor';
import SaveScriptModal from './SaveScriptModal';
import api from '../services/api';

const ScriptGenerator = () => {
  const [testCase, setTestCase] = useState('');
  const [generatedScript, setGeneratedScript] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!testCase.trim()) {
      setError('请输入测试用例');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await api.generateScript(testCase);
      if (response.success) {
        setGeneratedScript(response.data.script);
        setSuccess('脚本生成成功！');
      } else {
        throw new Error(response.error || '生成失败');
      }
    } catch (err) {
      setError(err.message || '生成脚本时发生错误');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveScript = (editedScript) => {
    setSuccess('脚本保存成功！');
    setShowSaveModal(false);
  };

  return (
    <Card className="mb-4">
      <Card.Body>
        <Card.Title>输入测试用例</Card.Title>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>测试用例描述</Form.Label>
            <Form.Control
              as="textarea"
              rows={5}
              value={testCase}
              onChange={(e) => setTestCase(e.target.value)}
              placeholder="请输入测试用例描述"
            />
          </Form.Group>
          
          <Button 
            variant="primary" 
            type="submit" 
            disabled={loading}
          >
            {loading ? (
              <Spinner
                as="span"
                animation="border"
                size="sm"
                role="status"
                aria-hidden="true"
              />
            ) : (
              '生成测试脚本'
            )}
          </Button>
        </Form>
        
        {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
        {success && <Alert variant="success" className="mt-3">{success}</Alert>}
        
        {generatedScript && (
          <div className="mt-4">
            <h5>生成的测试脚本:</h5>
            <ScriptEditor 
              script={generatedScript} 
              onSave={handleSaveScript} 
            />
            <Button 
              variant="primary" 
              onClick={() => setShowSaveModal(true)}
              className="mt-3"
            >
              保存脚本
            </Button>
          </div>
        )}
      </Card.Body>

      <SaveScriptModal
        show={showSaveModal}
        onHide={() => setShowSaveModal(false)}
        script={generatedScript}
        onSaved={() => setSuccess('脚本保存成功！')}
      />
    </Card>
  );
};

export default ScriptGenerator;