'use client';

import { Trash2 } from 'lucide-react';

interface ProjectCardProps {
  id?: string;
  name: string;
  onClick: () => void;
  onDelete?: () => void;
}

const ProjectCard = ({ name, onClick, onDelete }: ProjectCardProps) => {
  return (
    <div
      className="group relative overflow-hidden bg-gradient-to-br from-zinc-900 to-zinc-950 rounded-xl p-6 border border-zinc-800 shadow-lg transition-all duration-300 hover:border-green-500/40 hover:shadow-green-900/20 hover:shadow-xl cursor-pointer"
      onClick={onClick}
    >
      <div className="flex flex-col gap-3">
        {/* Project name */}
        <span className="text-lg font-bold text-white truncate group-hover:text-green-400 transition-colors duration-300">
          {name}
        </span>
        
        {/* Visual elements */}
        <div className="absolute top-0 right-0 h-20 w-20 -mr-10 -mt-10 bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-full blur-xl transform group-hover:scale-150 transition-all duration-500 opacity-0 group-hover:opacity-100"></div>
        
        {/* Decorative line */}
        <div className="w-16 h-0.5 bg-gradient-to-r from-green-500/50 to-transparent rounded-full mt-auto"></div>
      </div>

      {/* Delete button */}
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          title="Delete project"
          className="absolute bottom-3 right-3 bg-zinc-800 hover:bg-red-500 text-zinc-400 hover:text-white rounded-full p-2 transition-all duration-300 shadow-md"
        >
          <Trash2 size={16} />
        </button>
      )}
    </div>
  );
};

export default ProjectCard;
