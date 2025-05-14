'use client';

import { Search } from 'lucide-react';

interface DetectTypeButtonProps {
  onClick: () => void;
  isDetecting: boolean;
  large?: boolean;
}

const DetectTypeButton = ({ onClick, isDetecting, large = false }: DetectTypeButtonProps) => {
  const baseClasses =
    'group flex items-center justify-center gap-2 text-white rounded-lg font-medium transition-all';
  const sizeClasses = large ? 'px-10 py-5 text-lg' : 'px-6 py-3';
  const stateClasses =
    'bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-zinc-800';
  const iconSize = large ? 28 : 20;

  return (
    <button
      onClick={onClick}
      disabled={isDetecting}
      className={`${baseClasses} ${sizeClasses} ${stateClasses}`}
      style={large ? { minWidth: 240 } : {}}
    >
      <Search
        size={iconSize}
        className={`${isDetecting ? 'animate-spin' : 'group-hover:scale-110'} transition-transform`}
      />
      <span>{isDetecting ? 'Detecting...' : 'Detect PDF Type'}</span>
    </button>
  );
};

export default DetectTypeButton;
