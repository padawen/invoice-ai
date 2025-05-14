'use client';

import { Save } from 'lucide-react';

interface SaveButtonProps {
  isSaving: boolean;
  onSave: () => void;
}

const SaveButton = ({ isSaving, onSave }: SaveButtonProps) => {
  return (
    <button
      onClick={onSave}
      disabled={isSaving}
      className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Save size={20} className={isSaving ? 'animate-pulse' : ''} />
      <span>{isSaving ? 'Saving...' : 'Save to Database'}</span>
    </button>
  );
};

export default SaveButton;
