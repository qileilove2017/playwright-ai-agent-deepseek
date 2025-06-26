import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '/api';

// Create an axios instance with default configuration
const axiosInstance = axios.create({
  baseURL: 'http://localhost:3000/api', // 确保这里是你的后端服务地址和端口
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  }
});

const api = {
  generateScript: async (testCase) => {
    // 从测试用例文本中提取URL，支持格式: URL：@https://example.com 或 URL:@https://example.com
    const urlPattern = /URL[：:]\s*@?\s*(https?:\/\/[^\s]+)/i;
    const urlMatch = testCase.match(urlPattern);
    
    let url = 'https://example.com'; // 默认URL
    let userPrompt = testCase;
    
    if (urlMatch) {
      url = urlMatch[1].trim();
      // 从测试用例中移除URL部分，保留操作描述
      userPrompt = testCase.replace(urlPattern, '').trim();
    } else {
      // 备选：尝试查找任何URL格式
      const generalUrlMatch = testCase.match(/(https?:\/\/[^\s)]+)/);
      if (generalUrlMatch) {
        url = generalUrlMatch[1];
      }
    }
    
    // 构建后端期望的请求格式
    const requestData = {
      url: url,
      userPrompt: userPrompt,
      pageAnalysis: {
        title: '自动测试页面',
        interactiveElements: [] // 可以从页面分析中获取，但这里为空
      }
    };
    
    console.log('发送脚本生成请求:', requestData); // 调试输出
    
    const response = await axiosInstance.post(`/generate`, requestData);
    return response.data;
  },
  
  getScripts: async () => {
    // 这里可以添加模拟数据或其他逻辑
    return [];
  },
  
  getScriptById: async (id) => {
    // 这里可以添加模拟数据或其他逻辑
    return null;
  },
  
  runScript: async (scriptData) => {
    // 支持两种调用方式，但都转换为后端期望的格式
    let scriptContent;
    
    if (typeof scriptData === 'string' || typeof scriptData === 'number') {
      // 如果传入的是scriptId，先获取脚本内容
      scriptContent = '示例脚本内容'; // 模拟脚本内容
    } else {
      // 如果传入的是脚本对象，直接使用其中的script字段
      scriptContent = scriptData.script;
    }
    
    // 构建符合后端期望的请求格式
    const payload = {
      scripts: [scriptContent], // 包装成数组
      mode: "sequential"       // 默认顺序模式
    };
    
    console.log('发送脚本执行请求:', payload);
    
    // 将 axios.post 替换为 axiosInstance.post
    const response = await axiosInstance.post(`/run`, payload);
    return response.data;
  },
  
  deleteScript: async (scriptId) => {
    // 这里可以添加模拟删除逻辑
    return { success: true };
  },

  getScriptResult: async (executionId, maxAttempts = 10, interval = 2000) => {
    // 实现轮询机制，因为脚本执行可能需要一些时间
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      try {
        // 模拟获取执行结果
        return { data: { status: 'completed' } }; // 模拟结果
      } catch (error) {
        // 其他错误，停止轮询
        throw error;
      }
    }
    
    // 达到最大尝试次数，返回最新状态
    return { data: { status: 'unknown' } }; // 模拟状态
  },
  
  getTemplates: async () => {
    // 这里可以添加模拟模板数据
    return [];
  },
  
  saveTemplate: async (templateData) => {
    // 这里可以添加模拟保存模板逻辑
    return { success: true };
  },
  
  deleteTemplate: async (templateId) => {
    // 这里可以添加模拟删除模板逻辑
    return { success: true };
  },
  
  updateScript: async (scriptId, scriptData) => {
    // 这里可以添加模拟更新脚本逻辑
    return { success: true };
  },

  // 保存脚本 - 更新或新建
  saveScript: async (scriptData) => {
    // 这里可以添加模拟保存脚本逻辑
    return { success: true };
  },
  
  // 项目相关API
  createProject: (data) => axiosInstance.post('/projects', data),
  getProjects: () => axiosInstance.get('/projects'),

  // 测试用例相关API
  createTestCase: (data) => axiosInstance.post('/test-cases', data),
  getTestCases: (projectId) => {
    const params = projectId ? { projectId } : {};
    return axiosInstance.get('/test-cases', { params });
  },
  getTestCaseById: (id) => axiosInstance.get(`/test-cases/${id}`),
  updateTestCase: (id, data) => axiosInstance.put(`/test-cases/${id}`, data),
  deleteTestCase: (id) => axiosInstance.delete(`/test-cases/${id}`),

  // 新增：通过提示词生成测试用例
  generateTestCaseFromPrompt: (data) => axiosInstance.post('/generate-test-case-from-prompt', data),

  // 新增：生成自动化代码
  generateAutomationCode: (testCaseId, codeType) => axiosInstance.post(`/test-cases/${testCaseId}/generate`, { codeType }),

  // 新增：执行自动化代码
  executeAutomationCode: (testCaseId, codeType) => axiosInstance.post(`/test-cases/${testCaseId}/execute`, { codeType }),
};

export default api;