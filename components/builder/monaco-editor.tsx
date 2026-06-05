"use client";

import Editor from '@monaco-editor/react';
import { useProjectStore } from './project-store';

export default function MonacoEditor() {
  const { activeProject, activeFile, updateFileContent } = useProjectStore();

  if (!activeProject || !activeFile) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#070707] text-zinc-500 text-sm">
        Select a file from the sidebar to start coding.
      </div>
    );
  }

  const file = activeProject.files.find((f) => f.path === activeFile);
  const content = file ? file.content : '';

  const getLanguage = (path: string) => {
    const ext = path.split('.').pop();
    switch (ext) {
      case 'ts':
      case 'tsx':
        return 'typescript';
      case 'js':
      case 'jsx':
        return 'javascript';
      case 'css':
        return 'css';
      case 'json':
        return 'json';
      case 'html':
        return 'html';
      default:
        return 'plaintext';
    }
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      updateFileContent(activeFile, value);
    }
  };

  return (
    <div className="flex-grow flex flex-col h-full bg-[#070707]">
      <div className="bg-[#0c0c0f] border-b border-white/[0.06] px-4 py-2 flex items-center gap-2">
        <span className="text-xs font-mono text-purple-400">📄 {activeFile}</span>
      </div>
      <div className="flex-grow w-full h-[calc(100%-36px)]">
        <Editor
          height="100%"
          language={getLanguage(activeFile)}
          theme="vs-dark"
          value={content}
          onChange={handleEditorChange}
          options={{
            fontSize: 13,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            padding: { top: 12 },
            lineNumbersMinChars: 3,
            wordWrap: 'on',
          }}
        />
      </div>
    </div>
  );
}
