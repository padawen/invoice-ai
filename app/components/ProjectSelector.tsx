'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, CheckCircle, AlertCircle, FolderPlus, Plus, X, Search, Folder } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

let clientSideSupabase: ReturnType<typeof createSupabaseBrowserClient> | null = null;

interface Props {
  onSelect: (project: string) => void;
}

const ProjectSelector = ({ onSelect }: Props) => {
  const [supabase, setSupabase] = useState<ReturnType<typeof createSupabaseBrowserClient> | null>(null);
  const [projects, setProjects] = useState<string[]>([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [newProject, setNewProject] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [expanded, setExpanded] = useState(false);

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
      setExpanded(false);
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

  const handleSelect = (project: string) => {
    setSelectedProject(project);
    onSelect(project);
    setExpanded(false);
  };

  const filteredProjects = projects.filter(p => 
    p.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full space-y-4">
      <div className="relative">
        {/* Selected Project Display / Trigger */}
        <div 
          onClick={() => setExpanded(!expanded)} 
          className="flex items-center justify-between w-full pl-5 pr-5 py-4 rounded-xl bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 hover:border-green-500/50 text-white cursor-pointer shadow-md transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-600/20 text-green-400">
              <Folder size={20} />
            </div>
            <div>
              {selectedProject ? (
                <span className="font-medium">{selectedProject}</span>
              ) : (
                <span className="text-zinc-500">Select a project</span>
              )}
            </div>
          </div>
          <div className="h-9 w-9 flex items-center justify-center rounded-lg bg-zinc-800 group-hover:bg-zinc-700 transition-colors">
            <div className={`transform transition-transform ${expanded ? 'rotate-180' : ''}`}>
              <svg width="14" height="8" viewBox="0 0 14 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 1L7 7L13 1" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Dropdown */}
        {expanded && (
          <div className="absolute mt-2 w-full rounded-xl overflow-hidden z-50 bg-zinc-800 border border-zinc-700 shadow-lg transform origin-top transition-all">
            {/* Search and Create New */}
            <div className="p-4 border-b border-zinc-700">
              <div className="relative mb-3">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                  <Search size={18} />
                </div>
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500/50"
                />
              </div>
              <button
                onClick={() => setIsCreating(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium shadow-md transition-colors"
              >
                <Plus size={18} />
                Create New Project
              </button>
            </div>

            {/* Project List */}
            {!isCreating ? (
              <div className="max-h-64 overflow-y-auto py-2">
                {filteredProjects.length > 0 ? (
                  filteredProjects.map((project) => (
                    <div
                      key={project}
                      onClick={() => handleSelect(project)}
                      className={`flex items-center gap-3 px-4 py-3 hover:bg-zinc-700 cursor-pointer transition-colors ${
                        selectedProject === project ? 'bg-green-900/20 text-green-400' : 'text-white'
                      }`}
                    >
                      <Folder size={18} className={selectedProject === project ? 'text-green-400' : 'text-zinc-400'} />
                      <span>{project}</span>
                      {selectedProject === project && (
                        <CheckCircle size={16} className="ml-auto text-green-400" />
                      )}
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-6 text-center text-zinc-500">
                    {searchQuery ? 'No matching projects found' : 'No projects available'}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4">
                <div className="mb-3">
                  <input
                    className="w-full px-4 py-3 rounded-lg bg-zinc-900 border border-zinc-700 focus:border-green-500/50 text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-green-500/50 transition-all"
                    placeholder="Enter new project name"
                    value={newProject}
                    onChange={(e) => setNewProject(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                    autoFocus
                    disabled={loading}
                  />
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={handleCreate}
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white px-4 py-2.5 rounded-lg font-medium shadow-md transition-colors disabled:opacity-60 text-sm"
                  >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <FolderPlus size={16} />}
                    <span>{loading ? 'Creating...' : 'Create Project'}</span>
                  </button>
                  <button
                    onClick={cancelCreate}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors text-sm"
                    disabled={loading}
                  >
                    <X size={16} />
                    <span>Cancel</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-400 bg-red-400/10 px-4 py-2 rounded-lg mt-2 text-sm">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}
      
      {success && (
        <div className="flex items-center gap-2 text-green-400 bg-green-400/10 px-4 py-2 rounded-lg mt-2 text-sm">
          <CheckCircle size={16} />
          <span>Project created successfully!</span>
        </div>
      )}
    </div>
  );
};

export default ProjectSelector;

