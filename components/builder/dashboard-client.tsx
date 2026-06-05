"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useProjectStore } from './project-store';
import { Cpu, Plus, LogOut, Code, Calendar, AlertCircle } from 'lucide-react';

interface User {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

export default function BuilderDashboardClient({ user }: { user: User }) {
  const router = useRouter();
  const { projects, setProjects, isOnline } = useProjectStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);

  useEffect(() => {
    async function loadProjects() {
      try {
        setFetchLoading(true);
        const res = await fetch('/api/builder/projects');
        if (res.ok) {
          const data = await res.json();
          setProjects(data);
        }
      } catch (err) {
        console.error('Failed to load projects', err);
      } finally {
        setFetchLoading(false);
      }
    }

    loadProjects();
  }, [setProjects]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/builder/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newProjectName,
          description: newProjectDesc,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create project');
      }

      setIsModalOpen(false);
      router.push(`/builder/${data.id}`);
    } catch (err) {
      console.error(err);
      alert('Error creating project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-screen h-screen bg-[#070708] text-zinc-100 flex flex-col font-sans overflow-hidden">
      {/* Navbar Header */}
      <header className="bg-[#0a0a0c] border-b border-white/[0.06] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div 
            onClick={() => router.push('/chat')}
            className="w-8 h-8 rounded-lg bg-purple-600/15 border border-purple-500/20 flex items-center justify-center cursor-pointer"
          >
            <Cpu size={16} className="text-purple-400" />
          </div>
          <span 
            onClick={() => router.push('/chat')}
            className="font-bold text-lg bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent cursor-pointer"
          >
            UltramaxoAI Builder
          </span>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-3.5 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-cyan-600 hover:opacity-90 text-white font-medium text-xs flex items-center gap-1.5 transition-all shadow-lg"
          >
            <Plus size={14} /> New App
          </button>
          <button
            onClick={() => router.push('/chat')}
            className="px-3 py-2 text-zinc-400 hover:text-zinc-200 transition-colors text-xs flex items-center gap-1.5"
          >
            <LogOut size={14} /> Chatbot Home
          </button>
        </div>
      </header>

      {/* Workspace Area */}
      <main className="flex-grow overflow-y-auto p-8 max-w-6xl mx-auto w-full">
        {!isOnline && (
          <div className="mb-6 p-3 bg-amber-950/20 border border-amber-500/20 rounded-xl flex items-center gap-2.5 text-xs text-amber-400">
            <AlertCircle size={16} />
            <span>You are currently offline. You can edit existing workspaces offline, but creating new projects requires database access.</span>
          </div>
        )}

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Application Workspaces</h1>
          <p className="text-zinc-500 text-xs mt-1">Build, edit, and stream code sandboxes inside your browser.</p>
        </div>

        {fetchLoading ? (
          <div className="h-[200px] flex flex-col items-center justify-center text-center">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mb-3"></div>
            <span className="text-zinc-500 text-xs">Loading projects database...</span>
          </div>
        ) : projects.length === 0 ? (
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-12 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-purple-600/5 border border-purple-500/10 flex items-center justify-center mb-4">
              <Code size={20} className="text-purple-400/60" />
            </div>
            <h3 className="text-zinc-200 font-semibold text-sm">No Workspaces Found</h3>
            <p className="text-zinc-500 text-xs mt-1 max-w-xs leading-relaxed">
              Create your first workspace by clicking the button in the top right to start building with the WebContainer AI Sandbox.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-cyan-600 hover:opacity-90 text-white rounded-lg text-xs font-semibold mt-5 flex items-center gap-1.5"
            >
              <Plus size={14} /> Create Your First Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((proj) => (
              <div
                key={proj.id}
                onClick={() => router.push(`/builder/${proj.id}`)}
                className="bg-white/[0.02] border border-white/[0.06] hover:border-purple-500/30 rounded-xl p-5 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 shadow-md flex flex-col justify-between h-[150px]"
              >
                <div>
                  <h3 className="text-sm font-semibold text-white truncate">{proj.name}</h3>
                  <p className="text-zinc-500 text-xs mt-1.5 line-clamp-2 leading-relaxed">
                    {proj.description || 'No description provided.'}
                  </p>
                </div>

                <div className="border-t border-white/[0.03] pt-3 flex items-center gap-1.5 text-[10px] text-zinc-500 font-mono">
                  <Calendar size={12} />
                  <span>Updated: {new Date(proj.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* New Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0a0a0c] border border-white/[0.06] rounded-2xl p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-4">Create New Project</h2>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-zinc-400 font-medium">Project Name</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. My Next.js Dashboard"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="bg-[#050505] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-zinc-400 font-medium">Description (Optional)</label>
                <textarea
                  placeholder="Describe what your app does..."
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  className="bg-[#050505] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500 min-h-[80px] resize-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-white/[0.06] rounded-lg text-zinc-400 hover:text-zinc-200 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-cyan-600 hover:opacity-90 text-white rounded-lg text-xs font-semibold"
                >
                  {loading ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
