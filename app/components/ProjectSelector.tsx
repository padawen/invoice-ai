'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle, Folder, ChevronDown } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import ProjectModal from './modals/ProjectModal';

interface Props {
  onSelect: (project: string) => void;
}

const ProjectSelector = ({ onSelect }: Props) => {
  const [projects, setProjects] = useState<string[]>([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        
        if (!supabase) {
          setError('Failed to initialize Supabase client');
          return;
        }
        
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        
        if (!token) return;

        const res = await fetch('/api/project', {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();

        if (Array.isArray(data.projects)) {
          setProjects(data.projects);
          if (data.projects.length === 0) {
            setIsModalOpen(true);
          }
        } else {
          throw new Error();
        }
      } catch {
        setError('Failed to load projects.');
      }
    };

    fetchProjects();
  }, []);

  const handleSelectProject = (project: string) => {
    setSelectedProject(project);
    onSelect(project);
  };

  return (
    <div className="w-full">
      {/* Project Selector Trigger Button */}
      <div 
        onClick={() => setIsModalOpen(true)} 
        className="flex items-center justify-between w-full pl-5 pr-5 py-4 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-green-500/50 text-white cursor-pointer shadow-md transition-all group"
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
          <ChevronDown className="text-green-500" size={18} />
        </div>
      </div>

      {/* Modal */}
      <ProjectModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onSelect={handleSelectProject}
        selectedProject={selectedProject}
        existingProjects={projects}
      />

      {/* Display error message */}
      {error && (
        <div className="mt-4 flex items-center gap-2 text-red-400 bg-red-400/10 px-4 py-3 rounded-lg">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default ProjectSelector;

