import React, { useState } from 'react';
import { useProjectStore } from '../store/projectStore';
import { FolderOpen, Plus, Trash2, FileCode } from 'lucide-react';

export default function FileTree() {
  const { activeProject, activeFile, setActiveFile, createLocalFile, deleteLocalFile } = useProjectStore();
  const [isCreating, setIsCreating] = useState(false);
  const [newFileName, setNewFileName] = useState('');

  if (!activeProject) {
    return (
      <div className="p-4 text-zinc-500 text-sm">
        No active project
      </div>
    );
  }

  const handleCreateFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;
    
    // Create boilerplate based on extension
    let boilerplate = '// Write your code here\n';
    if (newFileName.endsWith('.json')) {
      boilerplate = '{\n  \n}\n';
    } else if (newFileName.endsWith('.css')) {
      boilerplate = '/* CSS Styles */\n';
    } else if (newFileName.endsWith('.tsx') || newFileName.endsWith('.jsx')) {
      boilerplate = `import React from 'react';\n\nexport default function Component() {\n  return <div>New Component</div>;\n}\n`;
    }

    await createLocalFile(newFileName, boilerplate);
    setNewFileName('');
    setIsCreating(false);
  };

  const handleDelete = async (e: React.MouseEvent, path: string) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete ${path}?`)) {
      await deleteLocalFile(path);
    }
  };

  return (
    <div className="w-64 border-r border-zinc-800 bg-zinc-950 flex flex-col h-full text-sm">
      <div className="p-3 border-b border-zinc-800 flex items-center justify-between">
        <span className="font-semibold text-zinc-300 tracking-wide uppercase text-xs flex items-center gap-1.5">
          <FolderOpen size={14} className="text-purple-400" /> Files
        </span>
        <button 
          onClick={() => setIsCreating(true)}
          className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200 transition-colors"
          title="Create New File"
        >
          <Plus size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {/* Create File Input Form */}
        {isCreating && (
          <form onSubmit={handleCreateFile} className="mb-2 p-1.5 bg-zinc-900 border border-purple-500/30 rounded">
            <input
              autoFocus
              type="text"
              placeholder="e.g. src/utils.ts"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-purple-500"
            />
            <div className="flex justify-end gap-1.5 mt-2">
              <button 
                type="button" 
                onClick={() => setIsCreating(false)}
                className="px-2 py-0.5 text-[10px] text-zinc-400 hover:text-zinc-200"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="px-2 py-0.5 text-[10px] bg-purple-600 text-white rounded hover:bg-purple-500"
              >
                Create
              </button>
            </div>
          </form>
        )}

        {/* Files List */}
        <div className="space-y-0.5">
          {activeProject.files.map((file) => {
            const isActive = activeFile === file.path;
            return (
              <div
                key={file.path}
                onClick={() => setActiveFile(file.path)}
                className={`group flex items-center justify-between px-2.5 py-1.5 rounded cursor-pointer transition-all duration-150 ${
                  isActive 
                    ? 'bg-purple-950/30 border-l-2 border-purple-500 text-white' 
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <FileCode size={14} className={isActive ? 'text-purple-400' : 'text-zinc-500'} />
                  <span className="truncate text-xs font-mono">{file.path}</span>
                </div>
                
                {/* Delete button (hidden by default, shown on hover) */}
                <button
                  onClick={(e) => handleDelete(e, file.path)}
                  className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-zinc-800 rounded text-zinc-500 hover:text-red-400 transition-all duration-150"
                  title="Delete File"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
