import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '../store/projectStore';
import { Mail, Lock, Cpu, Github, LogIn } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { setAuth, token } = useProjectStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If already logged in, redirect to dashboard
    if (token) {
      navigate('/dashboard');
    }
  }, [token, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setError('');
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      setAuth(data.user, data.token);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGithubOAuth = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/auth/oauth/github/url');
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Failed to get GitHub URL', err);
    }
  };

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-zinc-950 px-4 relative overflow-hidden font-sans">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] rounded-full bg-purple-600/10 blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] rounded-full bg-cyan-600/10 blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md glass-panel p-8 rounded-2xl border border-zinc-800 shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-purple-600/15 border border-purple-500/20 flex items-center justify-center mx-auto mb-4 animate-glow">
            <Cpu size={24} className="text-purple-400" />
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            Welcome to UltraaxoAI
          </h2>
          <p className="text-zinc-500 text-xs mt-1.5">
            Login to access your workspace and start building
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-950/30 border border-red-500/20 rounded-lg text-xs text-red-400 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-zinc-400 font-medium">Email Address</label>
            <div className="relative flex items-center">
              <Mail className="absolute left-3.5 text-zinc-500" size={16} />
              <input
                required
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full input pl-10 text-sm"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-zinc-400 font-medium">Password</label>
            <div className="relative flex items-center">
              <Lock className="absolute left-3.5 text-zinc-500" size={16} />
              <input
                required
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full input pl-10 text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn btn-primary py-2.5 text-sm mt-2 flex items-center justify-center gap-2"
          >
            <LogIn size={16} /> {loading ? 'Logging in...' : 'Sign In'}
          </button>
        </form>

        <div className="relative flex py-5 items-center">
          <div className="flex-grow border-t border-zinc-800"></div>
          <span className="flex-shrink mx-4 text-[10px] text-zinc-500 uppercase tracking-widest">Or continue with</span>
          <div className="flex-grow border-t border-zinc-800"></div>
        </div>

        <button
          onClick={handleGithubOAuth}
          className="w-full btn btn-secondary py-2.5 text-sm flex items-center justify-center gap-2"
        >
          <Github size={16} /> Sign In with GitHub
        </button>

        <p className="text-center text-xs text-zinc-500 mt-6">
          Don't have an account?{' '}
          <span 
            onClick={() => navigate('/register')}
            className="text-purple-400 hover:text-purple-300 cursor-pointer underline"
          >
            Sign up
          </span>
        </p>
      </div>
    </div>
  );
}
