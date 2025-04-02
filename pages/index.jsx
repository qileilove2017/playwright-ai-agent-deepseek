import ScriptDisplay from '../components/ScriptDisplay';

// Inside your component where you handle the AI response
const [executableScript, setExecutableScript] = useState('');

// After fetching the API response
const handleGenerateScript = async () => {
  // ... existing code ...
  
  const response = await fetch('/api/generate', { /* your fetch config */ });
  const data = await response.json();
  
  if (data.success) {
    setExecutableScript(data.data.executableScript);
  }
};

// In your JSX rendering
{executableScript && (
  <div className="script-section">
    <h3>生成的测试脚本</h3>
    <ScriptDisplay script={executableScript} />
  </div>
)} 