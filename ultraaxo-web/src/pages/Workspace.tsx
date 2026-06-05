import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjectStore } from '../store/projectStore';
import { useWebContainer } from '../hooks/useWebContainer';
import ChatPanel from '../components/ChatPanel';
import FileTree from '../components/FileTree';
import MonacoEditor from '../components/MonacoEditor';
import IframePreview from '../components/IframePreview';
import { LogOut, Code2, Eye } from 'lucide-react';

const BOILERPLATE_FILES = [
  {
    path: 'package.json',
    content: `{
  "name": "vite-react-project",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite --host 0.0.0.0",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "vite": "^5.2.11"
  }
}`
  },
  {
    path: 'index.html',
    content: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Ultraaxo Live App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`
  },
  {
    path: 'src/main.tsx',
    content: `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`
  },
  {
    path: 'src/App.tsx',
    content: `import React, { useState } from 'react';

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="container">
      <header>
        <span className="logo">⚡ UltraaxoApp</span>
      </header>
      <main>
        <h1>Your AI Generated App is Live!</h1>
        <p>Edit this layout by chatting with the agent in the sidebar.</p>
        <div className="card">
          <button onClick={() => setCount(count + 1)}>
            Count: {count}
          </button>
        </div>
      </main>
    </div>
  );
}`
  },
  {
    path: 'src/index.css',
    content: `body {
  margin: 0;
  font-family: system-ui, -apple-system, sans-serif;
  background-color: #0b0b0f;
  color: #ededf0;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}
.container {
  text-align: center;
  padding: 2rem;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
}
h1 {
  color: #c084fc;
}
button {
  background: #a855f7;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}
button:hover {
  background: #9333ea;
}`
  }
];

export default function Workspace() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { 
    token, 
    activeProject, 
    setActiveProject, 
    logout, 
    isOnline, 
    setOnlineStatus 
  } = useProjectStore();

  const [activeTab, setActiveTab] = useState<'code' | 'preview'>('code');
  const [loading, setLoading] = useState(true);

  // Initialize WebContainer hooks
  const { previewUrl, terminalOutput } = useWebContainer();

  // Monitor online status
  useEffect(() => {
    const goOnline = () => setOnlineStatus(true);
    const goOffline = () => setOnlineStatus(false);

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, [setOnlineStatus]);

  // Load project details
  useEffect(() => {
    if (!id) return;

    async function fetchProject() {
      try {
        setLoading(true);
        const res = await fetch(`http://localhost:3000/api/projects/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error('Failed to load project details');
        }

        const project = await res.json();
        
        // If project has no files, load boilerplates
        if (!project.files || project.files.length === 0) {
          project.files = BOILERPLATE_FILES;
          // Sync boilerplate files back to server
          await fetch(`http://localhost:3000/api/projects/${id}/sync`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              files: BOILERPLATE_FILES,
            }),
          });
        }

        setActiveProject(project);
      } catch (err) {
        console.error(err);
        alert('Could not fetch project details');
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      fetchProject();
    } else {
      navigate('/login');
    }
  }, [id, token, setActiveProject, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-zinc-950">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mb-3"></div>
        <span className="text-sm text-zinc-400">Loading workspace files...</span>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen flex flex-col bg-zinc-950 overflow-hidden font-sans">
      {/* Workspace Header Navbar */}
      <header className="bg-zinc-950 border-b border-zinc-900 px-4 py-3 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <span 
            onClick={() => navigate('/dashboard')}
            className="text-sm font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent cursor-pointer flex items-center gap-1.5"
          >
            ⚡ UltraaxoAI
          </span>
          <span className="text-zinc-600">/</span>
          <span className="text-xs text-zinc-300 font-mono bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
            {activeProject?.name}
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* Connection status indicator */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></span>
            <span className="text-zinc-400 text-[11px]">
              {isOnline ? 'Cloud Synced' : 'Offline Mode (Local)'}
            </span>
          </div>

          <button 
            onClick={handleLogout}
            className="btn btn-ghost px-2.5 py-1.5 flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200"
          >
            <LogOut size={13} /> Sign Out
          </button>
        </div>
      </header>

      {/* Main Workspace Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Agent Chat */}
        <div className="w-[380px] h-full flex flex-col border-r border-zinc-900">
          <ChatPanel />
        </div>

        {/* Right Side: Editor / Preview Tab Pane */}
        <div className="flex-1 h-full flex flex-col">
          {/* Tabs header */}
          <div className="bg-zinc-950 border-b border-zinc-900 px-4 flex items-center justify-between">
            <div className="flex gap-1.5 pt-2">
              <button
                onClick={() => setActiveTab('code')}
                className={`flex items-center gap-1.5 px-4 py-2 border-b-2 text-xs font-medium transition-colors ${
                  activeTab === 'code' 
                    ? 'border-purple-500 text-white bg-zinc-900/50' 
                    : 'border-transparent text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Code2 size={13} /> Code Workspace
              </button>
              <button
                onClick={() => setActiveTab('preview')}
                className={`flex items-center gap-1.5 px-4 py-2 border-b-2 text-xs font-medium transition-colors ${
                  activeTab === 'preview' 
                    ? 'border-purple-500 text-white bg-zinc-900/50' 
                    : 'border-transparent text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Eye size={13} /> Live Preview
              </button>
            </div>
          </div>

          {/* Tab Content panels */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'code' ? (
              <div className="w-full h-full flex">
                <FileTree />
                <MonacoEditor />
              </div>
            ) : (
              <IframePreview previewUrl={previewUrl} terminalOutput={terminalOutput} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
