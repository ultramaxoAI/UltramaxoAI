import Editor from '@monaco-editor/react';
import { useProjectStore } from '../store/projectStore';

export default function MonacoEditor() {
  const { activeProject, activeFile, updateFileContent } = useProjectStore();

  if (!activeProject || !activeFile) {
    return (
      <div className="flex-1 flex items-center justify-center bg-zinc-950 text-zinc-500 text-sm">
        Select a file from the sidebar to start coding.
      </div>
    );
  }

  const file = activeProject.files.find((f) => f.path === activeFile);
  const content = file ? file.content : '';

  // Helper to determine Monaco language based on file extension
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
    <div className="flex-1 flex flex-col h-full bg-zinc-950">
      <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-2 flex items-center gap-2">
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
