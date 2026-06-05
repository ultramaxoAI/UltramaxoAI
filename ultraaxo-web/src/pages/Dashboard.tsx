import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '../store/projectStore';
import { Cpu, Plus, LogOut, Code, Calendar, AlertCircle } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const { token, projects, setProjects, logout, isOnline } = useProjectStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    async function loadProjects() {
      try {
        const res = await fetch('http://localhost:3000/api/projects', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          setProjects(data);
        }
      } catch (err) {
        console.error('Failed to load projects', err);
      }
    }

    loadProjects();
  }, [token, navigate, setProjects]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('http://localhost:3000/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
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

      // Close modal & navigate to the workspace
      setIsModalOpen(false);
      navigate(`/project/${data.id}`);
    } catch (err) {
      console.error(err);
      alert('Error creating project');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="w-screen h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans overflow-hidden">
      {/* Top Navbar */}
      <header className="bg-zinc-950 border-b border-zinc-900 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-600/15 border border-purple-500/20 flex items-center justify-center">
            <Cpu size={16} className="text-purple-400" />
          </div>
          <span className="font-bold text-lg bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            UltraaxoAI
          </span>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn btn-primary text-xs px-3.5 py-2 flex items-center gap-1.5"
          >
            <Plus size={14} /> New Project
          </button>
          <button
            onClick={handleLogout}
            className="btn btn-ghost text-xs px-3 py-2 flex items-center gap-1.5 text-zinc-400 hover:text-zinc-200"
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-8 max-w-6xl mx-auto w-full">
        {/* Offline notice bar */}
        {!isOnline && (
          <div className="mb-6 p-3 bg-amber-950/20 border border-amber-500/20 rounded-xl flex items-center gap-2.5 text-xs text-amber-400">
            <AlertCircle size={16} />
            <span>You are currently offline. You can open existing cached projects to code offline, but creating new projects requires connection.</span>
          </div>
        )}

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Your Projects</h1>
          <p className="text-zinc-500 text-xs mt-1">Select a workspace to resume coding and chatting with the AI agent</p>
        </div>

        {projects.length === 0 ? (
          <div className="glass-panel border border-zinc-900 rounded-2xl p-12 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-purple-600/5 border border-purple-500/10 flex items-center justify-center mb-4">
              <Code size={20} className="text-purple-400/60" />
            </div>
            <h3 className="text-zinc-200 font-semibold text-sm">No Projects Created Yet</h3>
            <p className="text-zinc-500 text-xs mt-1 max-w-xs leading-relaxed">
              Create your first project by clicking the button in the top right to start building with UltraaxoAI.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn btn-primary text-xs px-4 py-2 mt-5 flex items-center gap-1.5"
            >
              <Plus size={14} /> Create Your First Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((proj) => (
              <div
                key={proj.id}
                onClick={() => navigate(`/project/${proj.id}`)}
                className="glass-panel border border-zinc-900 hover:border-purple-500/30 rounded-xl p-5 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 shadow-md flex flex-col justify-between h-[150px]"
              >
                <div>
                  <h3 className="text-sm font-semibold text-white truncate">{proj.name}</h3>
                  <p className="text-zinc-500 text-xs mt-1.5 line-clamp-2 leading-relaxed">
                    {proj.description || 'No description provided.'}
                  </p>
                </div>

                <div className="border-t border-zinc-900/60 pt-3 flex items-center gap-1.5 text-[10px] text-zinc-500 font-mono">
                  <Calendar size={12} />
                  <span>Updated: {new Date(proj.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl animate-slide-in">
            <h2 className="text-lg font-bold text-white mb-4">Create New Project</h2>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-zinc-400 font-medium">Project Name</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. My Awesome Shop"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="input text-sm w-full"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-zinc-400 font-medium">Description (Optional)</label>
                <textarea
                  placeholder="Describe what your app does..."
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  className="input text-sm w-full min-h-[80px] resize-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-secondary text-xs px-3.5 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary text-xs px-4 py-2"
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
