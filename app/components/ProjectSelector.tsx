'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, CheckCircle, AlertCircle, FolderPlus, Plus } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

let clientSideSupabase: ReturnType<typeof createBrowserClient> | null = null;

interface Props {
  onSelect: (project: string) => void;
}

const ProjectSelector = ({ onSelect }: Props) => {
  const [supabase, setSupabase] = useState<ReturnType<typeof createBrowserClient> | null>(null);
  const [projects, setProjects] = useState<string[]>([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [newProject, setNewProject] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!clientSideSupabase) {
        clientSideSupabase = createSupabaseBrowserClient();
      }
      setSupabase(clientSideSupabase);
    }
  }, []);

  const getToken = useCallback(async () => {
    if (!supabase) return null;
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  }, [supabase]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const token = await getToken();
        if (!token) return;

        const res = await fetch('/api/project', {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();

        if (Array.isArray(data.projects)) {
          setProjects(data.projects);
          if (data.projects.length === 0) setIsCreating(true);
        } else {
          throw new Error();
        }
      } catch {
        setError('Failed to load projects.');
      }
    };

    if (supabase) {
      fetchProjects();
    }
  }, [getToken, supabase]);

  const handleCreate = async () => {
    const trimmed = newProject.trim();
    if (!trimmed) return;

    if (projects.includes(trimmed)) {
      setError('A project with this name already exists.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const token = await getToken();
      if (!token) return;

      const res = await fetch('/api/project', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: trimmed }),
      });

      if (!res.ok) throw new Error();

      const updated = [...projects, trimmed];
      setProjects(updated);
      setSelectedProject(trimmed);
      setNewProject('');
      setIsCreating(false);
      setSuccess(true);
      onSelect(trimmed);
    } catch {
      setError('Failed to create project.');
    } finally {
      setLoading(false);
    }
  };

  const cancelCreate = () => {
    setNewProject('');
    setIsCreating(false);
    setError(null);
    setSuccess(false);
  };

  return (
    <div className="w-full max-w-xl mx-auto bg-zinc-900/80 rounded-2xl shadow-lg p-8 space-y-6 border border-zinc-800">
      <div className="flex items-center justify-between mb-2">
        <label className="text-lg font-semibold text-zinc-200">Project</label>
        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 text-base text-green-400 hover:text-green-300 transition font-bold"
          >
            <Plus size={20} />
            New Project
          </button>
        )}
      </div>

      {isCreating ? (
        <div className="space-y-4">
          <input
            className="w-full px-6 py-4 rounded-xl bg-zinc-800 border-2 border-zinc-700 text-white placeholder-zinc-500 text-lg focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition"
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
              className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white px-8 py-3 rounded-xl font-bold shadow-lg transition border border-green-600 hover:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-400 text-lg disabled:opacity-60"
            >
              {loading ? <Loader2 size={22} className="animate-spin" /> : <FolderPlus size={22} />}
              <span>{loading ? 'Creating...' : 'Create Project'}</span>
            </button>
            <button
              onClick={cancelCreate}
              className="px-6 py-3 text-zinc-400 hover:text-zinc-300 transition text-lg font-semibold"
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
          className="w-full px-6 py-4 rounded-xl bg-zinc-800 border-2 border-zinc-700 text-white text-lg focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition"
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

