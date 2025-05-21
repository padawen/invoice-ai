'use client';

import { Folder, Trash2 } from 'lucide-react';

interface ProjectCardProps {
  id?: string;
  name: string;
  onClick: () => void;
  onDelete?: () => void;
}

const ProjectCard = ({ name, onClick, onDelete }: ProjectCardProps) => {
  return (
    <div
      className="bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-xl shadow-lg p-6 flex flex-col gap-3 border border-zinc-700 transition-all duration-300 group relative cursor-pointer overflow-hidden"
      onClick={onClick}
      tabIndex={0}
      role="button"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick();
        }
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Folder className="text-green-400" size={20} />
          <span className="text-xl font-semibold truncate text-white">
            {name}
          </span>
        </div>
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            title="Delete project"
            className="bg-zinc-800 hover:bg-red-500 text-zinc-400 hover:text-white rounded-full p-2 transition-all duration-300 shadow-md"
            aria-label="Delete project"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      <div className="mt-auto text-right">
        <div className="text-xs text-zinc-500 italic">Click to view</div>
      </div>
    </div>
  );
};

export default ProjectCard;
