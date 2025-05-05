'use client';

import { Search } from 'lucide-react';

interface Props {
  onClick: () => void;
  isDetecting: boolean;
  large?: boolean;
}

const DetectTypeButton = ({ onClick, isDetecting, large }: Props) => (
  <button
    onClick={onClick}
    disabled={isDetecting}
    className={`group flex items-center justify-center gap-2 ${large ? 'px-10 py-5 text-lg' : 'px-6 py-3'} bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-zinc-800`}
    style={large ? { minWidth: 240 } : {}}
  >
    <Search size={large ? 28 : 20} className={`${isDetecting ? 'animate-spin' : 'group-hover:scale-110'} transition-transform`} />
    <span>{isDetecting ? 'Detecting...' : 'Detect PDF Type'}</span>
  </button>
);

export default DetectTypeButton;
