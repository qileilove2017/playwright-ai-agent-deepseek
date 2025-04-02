import React, { useState } from 'react';
import { Card, Button, Form, Alert } from 'react-bootstrap';
import api from '../services/api';
import ScriptEditor from './ScriptEditor';
import ExecutionProgress from './ExecutionProgress';
import ScriptResults from './ScriptResults';

const ScriptExecutor = () => {
  const [script, setScript] = useState('');
  const [executionId, setExecutionId] = useState(null);
  const [executionResult, setExecutionResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const placeholderScript = `await page.goto('https://google.com.hk/');
await page.fill('textarea[name="q"]', '123');
await page.keyboard.press('Enter');
await page.waitForNavigation();
await page.screenshot({ path: 'screenshots/result.png' });
checkResult = async (page) => {
  return await page.title() === '123 - Google 搜索';
};`;

  const handleExecute = async () => {
    if (!script.trim()) {
      setError('请输入要执行的脚本');
      return;
    }

    setIsLoading(true);
    setError(null);
    setExecutionResult(null);

    try {
      const response = await api.runScript({ script });
      
      if (response.success) {
        setExecutionResult(response.results);
      } else {
        throw new Error(response.error || '执行失败');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mb-4">
      <Card.Header>执行测试脚本</Card.Header>
      <Card.Body>
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>脚本内容</Form.Label>
            <Form.Control
              as="textarea"
              rows={10}
              value={script}
              onChange={(e) => setScript(e.target.value)}
              placeholder={placeholderScript}
              style={{ 
                fontFamily: 'monospace',
                fontSize: '14px'
              }}
            />
          </Form.Group>
          
          <Button 
            variant="primary" 
            onClick={handleExecute}
            disabled={isLoading || !script.trim()}
            className="mb-3"
          >
            {isLoading ? '执行中...' : '执行脚本'}
          </Button>
        </Form>

        {error && (
          <Alert variant="danger" className="mt-3">
            {error}
          </Alert>
        )}

        {executionResult && (
          <ScriptResults executionResult={executionResult} />
        )}
      </Card.Body>
    </Card>
  );
};

export default ScriptExecutor;