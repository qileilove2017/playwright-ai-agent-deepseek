import React from 'react';
import { Container, Tabs, Tab } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import ScriptGenerator from './components/ScriptGenerator';
import ScriptExecutor from './components/ScriptExecutor';

function App() {
  return (
    <div className="App">
      <Container>
        <header className="App-header my-4">
          <h1>测试脚本生成器</h1>
        </header>
        <main>
          <Tabs defaultActiveKey="generate" className="mb-4">
            <Tab eventKey="generate" title="生成脚本">
              <ScriptGenerator />
            </Tab>
            <Tab eventKey="execute" title="执行脚本">
              <ScriptExecutor />
            </Tab>
          </Tabs>
        </main>
        <footer className="mt-5 text-center text-muted">
          <p>测试脚本生成器 &copy; {new Date().getFullYear()}</p>
        </footer>
      </Container>
    </div>
  );
}

export default App;