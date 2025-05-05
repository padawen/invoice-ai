import { useState } from 'react';
import { Pencil, Check, Trash2 } from 'lucide-react';

interface ProjectCardProps {
  id: string;
  name: string;
  onSave: (id: string, newName: string) => Promise<void> | void;
  onClick: () => void;
  onDelete?: () => void; // Optional delete handler
}

const ProjectCard = ({ id, name, onSave, onClick, onDelete }: ProjectCardProps) => {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditing(true);
    setSuccess(false);
    setError(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  };

  const saveName = async () => {
    if (value !== name) {
      setSaving(true);
      setError(null);
      try {
        await onSave(id, value);
        setSuccess(true);
      } catch (err) {
        setError('Failed to save');
      }
      setSaving(false);
    }
    setEditing(false);
  };

  const handleInputBlur = () => {
    saveName();
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      saveName();
    }
  };

  const handleSaveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    saveName();
  };

  return (
    <div
      className="relative bg-gradient-to-br from-zinc-800 via-zinc-900 to-black rounded-2xl shadow-xl p-8 flex flex-col gap-4 border-2 border-zinc-800 transition-all duration-200 cursor-pointer group min-h-[180px]"
      onClick={onClick}
    >
      <div className="flex items-center gap-2 mb-2">
        {editing ? (
          <>
            <input
              className="bg-zinc-900 text-white rounded-lg px-4 py-2 border-2 border-zinc-700 focus:border-green-400 focus:outline-none text-lg font-semibold w-full transition-all"
              value={value}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              onKeyDown={handleInputKeyDown}
              autoFocus
              disabled={saving}
            />
            <button
              className="bg-green-500 hover:bg-green-400 text-white p-2 rounded-full transition-colors shadow ml-2"
              onClick={handleSaveClick}
              disabled={saving}
              tabIndex={-1}
              title="Save project name"
            >
              <Check size={22} />
            </button>
          </>
        ) : (
          <span className="text-xl font-bold text-white flex-1 truncate">
            {name}
          </span>
        )}
      </div>
      <div className="text-zinc-400 text-sm mb-2">Project</div>
      {editing && <div className="border-b border-zinc-700 mb-2"></div>}
      {success && <span className="text-green-400 text-xs">Saved!</span>}
      {error && <span className="text-red-400 text-xs">{error}</span>}
      {/* Action icons at the bottom right */}
      <div className="absolute bottom-4 right-4 flex gap-3">
        <button
          className="bg-green-500 hover:bg-green-400 text-white rounded-full p-3 shadow-lg transition-transform duration-150 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-green-300"
          onClick={e => { e.stopPropagation(); handleEditClick(e); }}
          tabIndex={-1}
          title="Edit project name"
        >
          <Pencil size={22} />
        </button>
        {onDelete && (
          <button
            className="bg-red-500 hover:bg-red-400 text-white rounded-full p-3 shadow-lg transition-transform duration-150 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-red-300"
            onClick={e => { e.stopPropagation(); onDelete(); }}
            title="Delete project"
          >
            <Trash2 size={22} />
          </button>
        )}
      </div>
    </div>
  );
};

export default ProjectCard; 