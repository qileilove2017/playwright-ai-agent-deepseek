import React, { useState, useEffect } from 'react';
import { Table, Button, Spinner, Alert, Modal } from 'react-bootstrap';
import ScriptExecutorLabel from './ScriptExecutorLabel';

const ScriptList = () => {
  const [scripts, setScripts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedScript, setSelectedScript] = useState(null);

  useEffect(() => {
    // 移除了获取脚本列表的数据库调用
    setLoading(false);
  }, []);

  const handleViewScript = (script) => {
    setSelectedScript(script);
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">加载中...</span>
        </Spinner>
      </div>
    );
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  return (
    <div>
      <h4 className="mb-3">历史生成的脚本</h4>
      
      {scripts.length === 0 ? (
        <Alert variant="info">暂无历史记录</Alert>
      ) : (
        <>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>#</th>
                <th>测试用例</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {scripts.map((script, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{script.testCase}</td>
                  <td>{new Date().toLocaleString()}</td>
                  <td>
                    <Button
                      variant="info"
                      size="sm"
                      onClick={() => handleViewScript(script)}
                    >
                      查看
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>

          <Modal
            show={showModal}
            onHide={() => setShowModal(false)}
            size="lg"
            centered
          >
            <Modal.Header closeButton>
              <Modal.Title>脚本详情</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {selectedScript && (
                <>
                  <h5>测试用例:</h5>
                  <p>{selectedScript.testCase}</p>
                  <h5>生成的脚本:</h5>
                  <pre className="bg-light p-3 border rounded">
                    <code>{selectedScript.script}</code>
                  </pre>
                  <ScriptExecutorLabel script={selectedScript.script} />
                </>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="primary" onClick={() => setShowModal(false)}>
                关闭
              </Button>
            </Modal.Footer>
          </Modal>
        </>
      )}
    </div>
  );
};

export default ScriptList; 