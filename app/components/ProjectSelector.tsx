'use client';
import React, { useState, useEffect } from 'react';
import { Loader2, CheckCircle, AlertCircle, FolderPlus, Plus } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

interface Props {
  onSelect: (project: string) => void;
}

const ProjectSelector = ({ onSelect }: Props) => {
  const [projects, setProjects] = useState<string[]>([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [newProject, setNewProject] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const supabase = createSupabaseBrowserClient();

  const getSupabaseToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) {
      setError('You must be logged in to manage projects.');
      return null;
    }
    return token;
  };

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const token = await getSupabaseToken();
        if (!token) return;
        const res = await fetch('/api/project', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (data.projects) {
          setProjects(data.projects);
          if (data.projects.length === 0) {
            setIsCreating(true);
          }
        }
      } catch {
        setError('Failed to load projects.');
      }
    };
    fetchProjects();
  }, []);

  const handleCreate = async () => {
    const trimmedName = newProject.trim();
    if (!trimmedName) return;

    if (projects.includes(trimmedName)) {
      setError('A project with this name already exists.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const token = await getSupabaseToken();
      if (!token) return;
      const res = await fetch('/api/project', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: trimmedName }),
      });

      if (!res.ok) throw new Error('Failed to create project');

      const updated = [...projects, trimmedName];
      setProjects(updated);
      setSelectedProject(trimmedName);
      onSelect(trimmedName);
      setNewProject('');
      setIsCreating(false);
      setSuccess(true);
    } catch {
      setError('Failed to create project.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto bg-zinc-900/80 rounded-2xl shadow-lg p-8 space-y-6 border border-zinc-800">
      <div className="flex items-center justify-between mb-2">
        <label className="text-lg font-semibold text-zinc-200">Project</label>
        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 text-base text-green-400 hover:text-green-300 transition-colors font-bold"
          >
            <Plus size={20} />
            <span>New Project</span>
          </button>
        )}
      </div>

      {isCreating ? (
        <div className="space-y-4">
          <input
            className="w-full px-6 py-4 rounded-xl bg-zinc-800 border-2 border-zinc-700 text-white placeholder-zinc-500 text-lg focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all"
            placeholder="Enter project name"
            value={newProject}
            onChange={(e) => setNewProject(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            autoFocus
            disabled={loading}
          />
          <div className="flex gap-3">
            <button
              onClick={handleCreate}
              disabled={loading}
              className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white px-8 py-3 rounded-xl font-bold shadow-lg transition-all border border-green-600 hover:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-400 text-lg disabled:opacity-60"
            >
              {loading ? <Loader2 size={22} className="animate-spin" /> : <FolderPlus size={22} />}
              <span>{loading ? 'Creating...' : 'Create Project'}</span>
            </button>
            <button
              onClick={() => {
                setIsCreating(false);
                setNewProject('');
                setError(null);
                setSuccess(false);
              }}
              className="px-6 py-3 text-zinc-400 hover:text-zinc-300 transition-colors text-lg font-semibold"
              disabled={loading}
            >
              Cancel
            </button>
          </div>
          {error && (
            <div className="flex items-center gap-2 text-red-400 bg-red-400/10 px-4 py-2 rounded-lg mt-2">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 text-green-400 bg-green-400/10 px-4 py-2 rounded-lg mt-2">
              <CheckCircle size={20} />
              <span>Project created!</span>
            </div>
          )}
        </div>
      ) : (
        <select
          className="w-full px-6 py-4 rounded-xl bg-zinc-800 border-2 border-zinc-700 text-white text-lg focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all"
          value={selectedProject}
          onChange={(e) => {
            setSelectedProject(e.target.value);
            onSelect(e.target.value);
          }}
        >
          <option value="">Select a project</option>
          {projects.map((p) => (
            <option key={p} value={p} className="bg-zinc-900">
              {p}
            </option>
          ))}
        </select>
      )}
    </div>
  );
};

export default ProjectSelector;
