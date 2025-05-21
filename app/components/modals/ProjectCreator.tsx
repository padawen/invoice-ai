'use client';

import React, { useState, useCallback } from 'react';
import { Loader2, FolderPlus, X } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

interface ProjectCreatorProps {
  onCancel: () => void;
  onProjectCreated: (project: string) => void;
  onError: (error: string) => void;
  existingProjects: string[];
}

const ProjectCreator = ({ 
  onCancel, 
  onProjectCreated, 
  onError,
  existingProjects 
}: ProjectCreatorProps) => {
  const [newProject, setNewProject] = useState('');
  const [loading, setLoading] = useState(false);
  
  const getToken = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return null;
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  }, []);

  const handleCreate = async () => {
    const trimmed = newProject.trim();
    if (!trimmed) return;

    if (existingProjects.includes(trimmed)) {
      onError('A project with this name already exists.');
      return;
    }

    setLoading(true);

    try {
      const token = await getToken();
      if (!token) {
        onError('Authentication error. Please log in again.');
        setLoading(false);
        return;
      }

      const res = await fetch('/api/project', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: trimmed }),
      });

      if (!res.ok) throw new Error();

      onProjectCreated(trimmed);
    } catch {
      onError('Failed to create project.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-green-400">Create New Project</h3>
        <button 
          onClick={onCancel}
          className="text-zinc-400 hover:text-white p-1 rounded-full hover:bg-zinc-800 transition-colors"
          aria-label="Back to project selection"
        >
          <X size={18} />
        </button>
      </div>
      <div className="mb-4">
        <input
          className="w-full px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 focus:border-green-500 text-white placeholder-zinc-500 focus:outline-none transition-colors"
          placeholder="Enter project name"
          value={newProject}
          onChange={(e) => setNewProject(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          autoFocus
          disabled={loading}
        />
      </div>
      
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleCreate}
          disabled={loading || !newProject.trim()}
          className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white px-4 py-3 rounded-lg font-medium shadow-md transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <FolderPlus size={18} />}
          <span>{loading ? 'Creating...' : 'Create Project'}</span>
        </button>
        <button
          onClick={onCancel}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors"
          disabled={loading}
        >
          <span>Cancel</span>
        </button>
      </div>
    </div>
  );
};

export default ProjectCreator; 