import React, { useState } from 'react';
import { Card, Row, Col, Tabs, Tab, Badge, Button, Accordion } from 'react-bootstrap';

const ScriptResults = ({ executionResult }) => {
  const [activeTab, setActiveTab] = useState('summary');
  
  if (!executionResult) {
    return <div className="text-center text-muted">暂无执行结果</div>;
  }
  
  const { success, screenshots, logs, duration, error } = executionResult;
  
  return (
    <Card className="mt-4">
      <Card.Header>
        <div className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">执行结果</h5>
          <Badge bg={success ? "success" : "danger"}>
            {success ? "通过" : "失败"}
          </Badge>
        </div>
      </Card.Header>
      <Card.Body>
        <Row className="mb-3">
          <Col md={4}>
            <strong>执行时间:</strong> {new Date(executionResult.timestamp).toLocaleString()}
          </Col>
          <Col md={4}>
            <strong>耗时:</strong> {duration}ms
          </Col>
          <Col md={4}>
            <strong>状态:</strong> <Badge bg={success ? "success" : "danger"}>
              {success ? "通过" : "失败"}
            </Badge>
          </Col>
        </Row>
        
        <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-3">
          <Tab eventKey="summary" title="摘要">
            <div className="p-3">
              {error ? (
                <div className="alert alert-danger">
                  <h6>错误信息:</h6>
                  <p>{error}</p>
                </div>
              ) : (
                <div className="alert alert-success">
                  <p>脚本执行成功，所有断言通过。</p>
                </div>
              )}
              
              {executionResult.summary && (
                <div className="mt-3">
                  <h6>执行摘要:</h6>
                  <ul>
                    {executionResult.summary.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Tab>
          
          <Tab eventKey="screenshots" title="截图">
            <div className="p-3">
              {screenshots && screenshots.length > 0 ? (
                <Row>
                  {screenshots.map((screenshot, index) => (
                    <Col md={6} key={index} className="mb-3">
                      <Card>
                        <Card.Header>截图 {index + 1}</Card.Header>
                        <Card.Body>
                          <img 
                            src={screenshot} 
                            alt={`Screenshot ${index + 1}`} 
                            className="img-fluid"
                          />
                        </Card.Body>
                        <Card.Footer>
                          <Button 
                            size="sm" 
                            variant="secondary"
                            onClick={() => window.open(screenshot, '_blank')}
                          >
                            查看大图
                          </Button>
                        </Card.Footer>
                      </Card>
                    </Col>
                  ))}
                </Row>
              ) : (
                <p className="text-muted">没有可用的截图</p>
              )}
            </div>
          </Tab>
          
          <Tab eventKey="logs" title="日志">
            <div className="p-3">
              {logs && logs.length > 0 ? (
                <Accordion>
                  {logs.map((log, index) => (
                    <Accordion.Item eventKey={index} key={index}>
                      <Accordion.Header>
                        <span className={`me-2 text-${log.level === 'error' ? 'danger' : log.level === 'warning' ? 'warning' : 'info'}`}>
                          [{log.level.toUpperCase()}]
                        </span>
                        {log.message.substring(0, 100)}...
                      </Accordion.Header>
                      <Accordion.Body>
                        <pre className="log-entry">{log.message}</pre>
                        <small className="text-muted">
                          时间: {new Date(log.timestamp).toLocaleTimeString()}
                        </small>
                      </Accordion.Body>
                    </Accordion.Item>
                  ))}
                </Accordion>
              ) : (
                <p className="text-muted">没有可用的日志</p>
              )}
            </div>
          </Tab>
        </Tabs>
      </Card.Body>
    </Card>
  );
};

export default ScriptResults; 