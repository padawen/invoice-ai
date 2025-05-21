'use client';

import React from 'react';
import { Folder, CheckCircle, Info } from 'lucide-react';

interface ProjectListProps {
  projects: string[];
  selectedProject: string;
  onSelect: (project: string) => void;
  searchQuery: string;
  isDemo?: boolean;
}

const ProjectList = ({ 
  projects, 
  selectedProject, 
  onSelect, 
  searchQuery, 
  isDemo = false 
}: ProjectListProps) => {
  return (
    <div className="overflow-y-auto max-h-[50vh]">
      {projects.length > 0 ? (
        projects.map((project) => (
          <div
            key={project}
            onClick={() => onSelect(project)}
            className={`flex items-center gap-3 px-5 py-3.5 cursor-pointer transition-colors ${
              selectedProject === project 
                ? isDemo 
                  ? 'bg-amber-950/30 text-amber-400 border-l-2 border-amber-500' 
                  : 'bg-green-950/30 text-green-400 border-l-2 border-green-500' 
                : 'text-white border-l-2 border-transparent hover:bg-zinc-800 hover:border-l-2 hover:border-zinc-600'
            }`}
          >
            {isDemo ? (
              <Info size={18} className={selectedProject === project ? 'text-amber-400' : 'text-zinc-400'} />
            ) : (
              <Folder size={18} className={selectedProject === project ? 'text-green-400' : 'text-zinc-400'} />
            )}
            <span className="truncate font-medium">{project}</span>
            {selectedProject === project && (
              <CheckCircle size={16} className={`ml-auto flex-shrink-0 ${isDemo ? 'text-amber-400' : 'text-green-400'}`} />
            )}
          </div>
        ))
      ) : (
        <div className="px-5 py-8 text-center text-zinc-500">
          {searchQuery ? 'No matching projects found' : 'No projects available'}
        </div>
      )}
    </div>
  );
};

export default ProjectList; 