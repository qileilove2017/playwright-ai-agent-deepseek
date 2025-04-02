import React, { useState, useEffect } from 'react';
import { ProgressBar, Alert } from 'react-bootstrap';
import api from '../services/api';

const ExecutionProgress = ({ executionId, onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('pending');
  const [message, setMessage] = useState('正在准备执行...');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!executionId) return;
    
    let isMounted = true;
    let intervalId;
    
    const checkProgress = async () => {
      try {
        const result = await api.getScriptResult(executionId, 1); // 只尝试一次
        
        if (!isMounted) return;
        
        if (result.success) {
          const executionData = result.data;
          
          // 更新状态和进度
          setStatus(executionData.status);
          
          // 根据状态设置进度
          if (executionData.status === 'pending') {
            setProgress(10);
            setMessage('脚本执行准备中...');
          } else if (executionData.status === 'running') {
            // 估算进度 - 如果后端提供进度，则使用后端的值
            const calculatedProgress = executionData.progress || 
              Math.min(80, progress + Math.floor(Math.random() * 10));
            setProgress(calculatedProgress);
            setMessage(executionData.currentStep || '脚本执行中...');
          } else if (executionData.status === 'completed') {
            setProgress(100);
            setMessage('执行完成！');
            // 通知父组件
            if (onComplete) onComplete(executionData);
            // 清除定时器
            clearInterval(intervalId);
          } else if (executionData.status === 'failed') {
            setProgress(100);
            setError(executionData.error || '执行失败');
            setMessage('执行失败');
            // 通知父组件
            if (onComplete) onComplete(executionData);
            // 清除定时器
            clearInterval(intervalId);
          }
        } else {
          setError(result.error || '获取执行状态失败');
          clearInterval(intervalId);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || '获取执行状态时出错');
          clearInterval(intervalId);
        }
      }
    };
    
    // 立即检查一次
    checkProgress();
    
    // 设置定时器，每2秒检查一次进度
    intervalId = setInterval(checkProgress, 2000);
    
    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [executionId, onComplete, progress]);

  return (
    <div className="execution-progress mt-4 mb-4">
      <h5>执行进度</h5>
      
      {error ? (
        <Alert variant="danger">{error}</Alert>
      ) : (
        <>
          <ProgressBar 
            now={progress} 
            label={`${progress}%`}
            variant={status === 'failed' ? 'danger' : 'primary'}
            animated={status !== 'completed' && status !== 'failed'}
          />
          <div className="text-center mt-2">
            <small className="text-muted">{message}</small>
          </div>
        </>
      )}
    </div>
  );
};

export default ExecutionProgress; 