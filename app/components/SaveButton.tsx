'use client';

import React from 'react';
import { Save, Loader2 } from 'lucide-react';

export interface SaveButtonProps {
  isSaving: boolean;
  onSave: () => void;
  disabled?: boolean;
  className?: string;
}

const SaveButton: React.FC<SaveButtonProps> = ({ isSaving, onSave, disabled = false, className = '' }) => {
  return (
    <button
      onClick={onSave}
      disabled={isSaving || disabled}
      className={`px-8 py-4 rounded-xl text-white text-lg font-semibold flex items-center gap-2 shadow-lg ${
        isSaving || disabled
          ? 'bg-zinc-600 cursor-not-allowed'
          : 'bg-green-600 hover:bg-green-500 cursor-pointer'
      } transition-colors ${className}`}
    >
      {isSaving ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          Saving...
        </>
      ) : (
        <>
          <Save className="w-5 h-5" />
          Save
        </>
      )}
    </button>
  );
};

export default SaveButton;
