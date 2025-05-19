'use client';

import { useState } from 'react';
import { Pencil, Check, Trash2 } from 'lucide-react';

interface ProjectCardProps {
  id: string;
  name: string;
  onSave: (id: string, newName: string) => Promise<void> | void;
  onClick: () => void;
  onDelete?: () => void;
}

const ProjectCard = ({ id, name, onSave, onClick, onDelete }: ProjectCardProps) => {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditing(true);
    setSuccess(false);
    setError(null);
  };

  const cancelEditing = () => {
    setEditing(false);
    setValue(name); 
  };

  const saveName = async () => {
    if (value.trim() && value !== name) {
      setSaving(true);
      setError(null);
      try {
        await onSave(id, value.trim());
        setSuccess(true);
      } catch (err) {
        console.error('Error saving project name:', err);
        setError('Failed to save project name');
      }
      setSaving(false);
    }
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') saveName();
    if (e.key === 'Escape') cancelEditing();
  };

  return (
    <div
      className="relative bg-zinc-900/80 rounded-xl p-6 flex flex-col gap-2 border border-zinc-800 transition hover:border-green-500/50 cursor-pointer group min-h-[140px]"
      onClick={onClick}
    >
      <div className="flex items-center gap-2 mb-2">
        {editing ? (
          <>
            <input
              className="bg-zinc-800 text-white rounded-md px-3 py-1 border border-zinc-700 focus:border-green-400 focus:outline-none text-base font-semibold w-full transition"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={saveName}
              autoFocus
              disabled={saving}
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                saveName();
              }}
              disabled={saving}
              title="Save project name"
              className="bg-green-500 hover:bg-green-400 text-white p-1.5 rounded-full transition"
            >
              <Check size={16} />
            </button>
          </>
        ) : (
          <span className="text-base font-semibold text-white flex-1 truncate">
            {name}
          </span>
        )}
      </div>

      <div className="text-zinc-400 text-xs mb-2">Project</div>

      {success && <span className="text-green-400 text-xs">Saved!</span>}
      {error && <span className="text-red-400 text-xs">{error}</span>}

      <div className="absolute bottom-3 right-3 flex gap-2">
        <button
          onClick={startEditing}
          title="Edit project name"
          className="bg-green-500 hover:bg-green-400 text-white rounded-full p-2 transition"
        >
          <Pencil size={16} />
        </button>
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            title="Delete project"
            className="bg-red-500 hover:bg-red-400 text-white rounded-full p-2 transition"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

export default ProjectCard;
