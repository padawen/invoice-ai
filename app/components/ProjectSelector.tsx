'use client';
import React, { useState } from 'react';
import { FolderPlus, Plus } from 'lucide-react';

interface Props {
  projects: string[];
  onSelect: (project: string) => void;
}

const ProjectSelector = ({ projects, onSelect }: Props) => {
  const [newProject, setNewProject] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = () => {
    if (newProject.trim()) {
      onSelect(newProject);
      setNewProject('');
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-zinc-300">Project</label>
        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 text-sm text-green-400 hover:text-green-300 transition-colors"
          >
            <Plus size={16} />
            <span>New Project</span>
          </button>
        )}
      </div>

      {isCreating ? (
        <div className="space-y-3">
          <input
            className="w-full px-4 py-2 rounded-lg bg-zinc-900/50 border border-zinc-700/50 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all"
            placeholder="Enter project name"
            value={newProject}
            onChange={(e) => setNewProject(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <FolderPlus size={16} />
              <span>Create Project</span>
            </button>
            <button
              onClick={() => {
                setIsCreating(false);
                setNewProject('');
              }}
              className="px-4 py-2 text-zinc-400 hover:text-zinc-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <select
          className="w-full px-4 py-2 rounded-lg bg-zinc-900/50 border border-zinc-700/50 text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all"
          onChange={(e) => onSelect(e.target.value)}
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
