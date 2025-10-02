'use client';

import { Folder, Trash2, Cloud, Shield } from 'lucide-react';

interface ExtractionStats {
  openai: number;
  privacy: number;
  total: number;
}

interface ProjectCardProps {
  id?: string;
  name: string;
  onClick: () => void;
  onDelete?: () => void;
  extractionStats?: ExtractionStats;
}

const ProjectCard = ({ name, onClick, onDelete, extractionStats }: ProjectCardProps) => {
  const openaiPercentage = extractionStats && extractionStats.total > 0
    ? Math.round((extractionStats.openai / extractionStats.total) * 100)
    : 0;
  const privacyPercentage = extractionStats && extractionStats.total > 0
    ? Math.round((extractionStats.privacy / extractionStats.total) * 100)
    : 0;

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
        <div className="flex items-center space-x-2 max-w-[80%] min-w-0">
          <Folder className="text-green-400 flex-shrink-0" size={20} />
          <span className="text-xl font-semibold truncate text-white" title={name}>
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
            className="bg-zinc-800 hover:bg-red-500 text-zinc-400 hover:text-white rounded-full p-2 transition-all duration-300 shadow-md flex-shrink-0 ml-2 cursor-pointer"
            aria-label="Delete project"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {extractionStats && extractionStats.total > 0 && (
        <div className="space-y-2">
          <div className="flex gap-2">
            {extractionStats.openai > 0 && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-green-500/20 text-green-400 border border-green-500/30 text-xs">
                <Cloud size={10} />
                <span className="font-medium">{openaiPercentage}%</span>
              </div>
            )}
            {extractionStats.privacy > 0 && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs">
                <Shield size={10} />
                <span className="font-medium">{privacyPercentage}%</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-auto text-right">
        <div className="text-xs text-zinc-500 italic">Click to view</div>
      </div>
    </div>
  );
};

export default ProjectCard;
