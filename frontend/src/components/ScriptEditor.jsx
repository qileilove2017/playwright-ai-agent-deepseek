import React, { useState, useEffect } from 'react';
import { Button, Form, Row, Col } from 'react-bootstrap';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';

const ScriptEditor = ({ script, onSave, readOnly = false }) => {
  const [editedScript, setEditedScript] = useState(script);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    setEditedScript(script);
  }, [script]);

  const handleSave = () => {
    onSave(editedScript);
    setEditMode(false);
  };

  // 下载脚本文件
  const downloadScript = () => {
    // 创建Blob
    const blob = new Blob([editedScript], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    
    // 创建下载链接
    const a = document.createElement('a');
    a.href = url;
    a.download = `test-script-${new Date().getTime()}.js`;
    document.body.appendChild(a);
    a.click();
    
    // 清理
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  };

  return (
    <div className="script-editor">
      {editMode ? (
        <div className="edit-container">
          <Form.Group>
            <Form.Control
              as="textarea"
              rows={15}
              value={editedScript}
              onChange={(e) => setEditedScript(e.target.value)}
              className="code-editor"
              style={{ fontFamily: 'monospace' }}
            />
          </Form.Group>
          <div className="mt-2">
            <Button variant="success" onClick={handleSave} className="me-2">
              保存
            </Button>
            <Button variant="secondary" onClick={() => setEditMode(false)}>
              取消
            </Button>
          </div>
        </div>
      ) : (
        <div className="view-container">
          <SyntaxHighlighter language="javascript" style={tomorrow} className="rounded">
            {editedScript}
          </SyntaxHighlighter>
          <div className="mt-2">
            {!readOnly && (
              <Button variant="primary" onClick={() => setEditMode(true)} className="me-2">
                编辑脚本
              </Button>
            )}
            <Button 
              variant="secondary" 
              onClick={() => {
                navigator.clipboard.writeText(editedScript);
                alert('脚本已复制到剪贴板！');
              }}
              className="me-2"
            >
              复制脚本
            </Button>
            <Button 
              variant="info" 
              onClick={downloadScript}
            >
              下载脚本
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScriptEditor; 