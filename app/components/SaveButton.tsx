'use client';

import React from 'react';
import { Save, Loader2, Info } from 'lucide-react';

export interface SaveButtonProps {
  isSaving: boolean;
  onSave: () => void;
  disabled?: boolean;
  className?: string;
  isDemo?: boolean;
}

const SaveButton: React.FC<SaveButtonProps> = ({ 
  isSaving, 
  onSave, 
  disabled = false, 
  className = '',
  isDemo = false 
}) => {
  return (
    <div className="relative">
      <button
        onClick={onSave}
        disabled={isSaving || disabled}
        className={`px-8 py-4 rounded-xl text-white text-lg font-semibold flex items-center justify-center gap-2 shadow-lg ${
          isSaving || disabled
            ? 'bg-zinc-600 cursor-not-allowed'
            : isDemo 
              ? 'bg-amber-600 hover:bg-amber-500 cursor-pointer'
              : 'bg-green-600 hover:bg-green-500 cursor-pointer'
        } transition-colors ${className}`}
        title={isDemo ? "Demo Mode - Data will not be saved to a database" : "Save changes"}
      >
        {isSaving ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Saving...
          </>
        ) : isDemo ? (
          <>
            <Info className="w-5 h-5" />
            Demo Save
          </>
        ) : (
          <>
            <Save className="w-5 h-5" />
            Save
          </>
        )}
      </button>
      
      {isDemo && !isSaving && (
        <div className="absolute -bottom-10 left-0 right-0 text-xs text-amber-400 text-center px-4 py-2">
          Demo mode - changes won&apos;t persist
        </div>
      )}
    </div>
  );
};

export default SaveButton;
