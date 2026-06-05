import { create } from 'zustand';
import localforage from 'localforage';
import { WebContainer } from '@webcontainer/api';

// Configure localforage for IndexedDB storage
if (typeof window !== 'undefined') {
  localforage.config({
    name: 'UltraaxoAI-Builder',
    storeName: 'offline_cache',
  });
}

interface FileItem {
  path: string;
  content: string;
}

interface MessageItem {
  id?: string;
  role: string;
  content: string;
  stepLogs?: string; // JSON string for agent steps
}

interface ProjectDetails {
  id: string;
  name: string;
  description?: string;
  files: FileItem[];
  messages: MessageItem[];
}

interface AgentStep {
  id: string;
  name: string;
  status: 'running' | 'success' | 'error';
  logs?: string;
}

interface ProjectState {
  projects: any[];
  activeProject: ProjectDetails | null;
  activeFile: string | null;
  webContainer: WebContainer | null;
  isWebContainerBooting: boolean;
  isAgentRunning: boolean;
  agentSteps: AgentStep[];
  isOnline: boolean;
  unsyncedChanges: {
    files: Record<string, string>; // path -> content
    deletedPaths: string[];
    messages: MessageItem[];
  };

  // Actions
  setProjects: (projects: any[]) => void;
  setActiveProject: (project: ProjectDetails | null) => void;
  setActiveFile: (path: string | null) => void;
  updateFileContent: (path: string, content: string) => Promise<void>;
  createLocalFile: (path: string, content: string) => Promise<void>;
  deleteLocalFile: (path: string) => Promise<void>;
  addMessage: (message: MessageItem) => void;
  
  // Connection Actions
  setOnlineStatus: (status: boolean) => void;
  
  // WebContainer Actions
  setWebContainer: (instance: WebContainer | null) => void;
  setWebContainerBooting: (booting: boolean) => void;
  
  // Agent Actions
  setAgentRunning: (running: boolean) => void;
  setAgentSteps: (steps: AgentStep[]) => void;
  addAgentStep: (step: AgentStep) => void;
  updateAgentStep: (id: string, updates: Partial<AgentStep>) => void;
  
  // Sync Actions
  syncOfflineChanges: () => Promise<void>;
}

const API_BASE = '/api/builder';

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  activeProject: null,
  activeFile: null,
  webContainer: null,
  isWebContainerBooting: false,
  isAgentRunning: false,
  agentSteps: [],
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  unsyncedChanges: {
    files: {},
    deletedPaths: [],
    messages: [],
  },

  setProjects: (projects) => set({ projects }),
  
  setActiveProject: (project) => {
    set({ activeProject: project });
    if (project) {
      if (project.files && project.files.length > 0) {
        set({ activeFile: project.files[0].path });
      } else {
        set({ activeFile: null });
      }
      if (typeof window !== 'undefined') {
        localforage.setItem(`project_${project.id}`, project);
      }
    }
  },

  setActiveFile: (path) => set({ activeFile: path }),

  updateFileContent: async (path, content) => {
    const { activeProject, webContainer, isOnline, unsyncedChanges } = get();
    if (!activeProject) return;

    // 1. Update project in-memory state
    const updatedFiles = activeProject.files.map((f) =>
      f.path === path ? { ...f, content } : f
    );
    const updatedProject = { ...activeProject, files: updatedFiles };
    set({ activeProject: updatedProject });

    if (typeof window !== 'undefined') {
      await localforage.setItem(`project_${activeProject.id}`, updatedProject);
    }

    // 2. Update WebContainer filesystem
    if (webContainer) {
      await webContainer.fs.writeFile(path, content);
    }

    // 3. Handle syncing
    if (isOnline) {
      try {
        const response = await fetch(`${API_BASE}/projects/${activeProject.id}/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            files: [{ path, content }],
          }),
        });
        if (response.ok) return;
      } catch (err) {
        console.error('Failed to sync changes instantly, queueing...', err);
      }
    }

    // Queue for sync later
    const newFiles = { ...unsyncedChanges.files, [path]: content };
    set({
      unsyncedChanges: {
        ...unsyncedChanges,
        files: newFiles,
      },
    });
  },

  createLocalFile: async (path, content) => {
    const { activeProject, webContainer } = get();
    if (!activeProject) return;

    const files = [...activeProject.files];
    const exists = files.find(f => f.path === path);
    if (!exists) {
      files.push({ path, content });
      set({ activeProject: { ...activeProject, files }, activeFile: path });
    }

    if (webContainer) {
      const parts = path.split('/');
      if (parts.length > 1) {
        let currentDir = '';
        for (let i = 0; i < parts.length - 1; i++) {
          currentDir = currentDir ? `${currentDir}/${parts[i]}` : parts[i];
          try {
            await webContainer.fs.mkdir(currentDir, { recursive: true });
          } catch (e) {
            // Already exists
          }
        }
      }
      await webContainer.fs.writeFile(path, content);
    }

    // Add to sync queue
    const { unsyncedChanges } = get();
    const newFiles = { ...unsyncedChanges.files, [path]: content };
    set({
      unsyncedChanges: {
        ...unsyncedChanges,
        files: newFiles,
        deletedPaths: unsyncedChanges.deletedPaths.filter(p => p !== path),
      },
    });
  },

  deleteLocalFile: async (path) => {
    const { activeProject, webContainer, activeFile } = get();
    if (!activeProject) return;

    const files = activeProject.files.filter(f => f.path !== path);
    set({
      activeProject: { ...activeProject, files },
      activeFile: activeFile === path ? (files[0]?.path || null) : activeFile,
    });

    if (webContainer) {
      try {
        await webContainer.fs.rm(path);
      } catch (e) {
        console.error('Failed to delete in WebContainer', e);
      }
    }

    const { unsyncedChanges } = get();
    const newFiles = { ...unsyncedChanges.files };
    delete newFiles[path];
    set({
      unsyncedChanges: {
        ...unsyncedChanges,
        files: newFiles,
        deletedPaths: [...unsyncedChanges.deletedPaths, path],
      },
    });
  },

  addMessage: (message) => {
    const { activeProject, isOnline, unsyncedChanges } = get();
    if (!activeProject) return;

    const updatedMessages = [...activeProject.messages, message];
    set({
      activeProject: {
        ...activeProject,
        messages: updatedMessages,
      },
    });

    if (!isOnline) {
      set({
        unsyncedChanges: {
          ...unsyncedChanges,
          messages: [...unsyncedChanges.messages, message],
        },
      });
    }
  },

  setOnlineStatus: (status) => {
    set({ isOnline: status });
    if (status) {
      get().syncOfflineChanges();
    }
  },

  setWebContainer: (instance) => set({ webContainer: instance }),
  setWebContainerBooting: (booting) => set({ isWebContainerBooting: booting }),
  
  setAgentRunning: (running) => set({ isAgentRunning: running }),
  setAgentSteps: (steps) => set({ agentSteps: steps }),
  addAgentStep: (step) => set({ agentSteps: [...get().agentSteps, step] }),
  
  updateAgentStep: (id, updates) => {
    const steps = get().agentSteps.map((step) =>
      step.id === id ? { ...step, ...updates } : step
    );
    set({ agentSteps: steps });
  },

  syncOfflineChanges: async () => {
    const { activeProject, unsyncedChanges, isOnline } = get();
    if (!activeProject || !isOnline) return;

    const hasFiles = Object.keys(unsyncedChanges.files).length > 0;
    const hasDeletes = unsyncedChanges.deletedPaths.length > 0;
    const hasMessages = unsyncedChanges.messages.length > 0;

    if (!hasFiles && !hasDeletes && !hasMessages) return;

    try {
      const filesArray = Object.entries(unsyncedChanges.files).map(([path, content]) => ({
        path,
        content,
      }));

      const response = await fetch(`${API_BASE}/projects/${activeProject.id}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files: filesArray,
          deletedPaths: unsyncedChanges.deletedPaths,
          messages: unsyncedChanges.messages,
        }),
      });

      if (response.ok) {
        const syncedProject = await response.json();
        set({
          activeProject: syncedProject,
          unsyncedChanges: {
            files: {},
            deletedPaths: [],
            messages: [],
          },
        });
        if (typeof window !== 'undefined') {
          await localforage.setItem(`project_${activeProject.id}`, syncedProject);
        }
        console.log('Synchronized builder files successfully');
      }
    } catch (err) {
      console.error('Failed to sync offline changes', err);
    }
  },
}));
