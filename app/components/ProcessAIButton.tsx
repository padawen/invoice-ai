'use client';

import { Sparkles } from 'lucide-react';

interface Props {
  onClick: () => void;
  isProcessing: boolean;
  large?: boolean;
}

const ProcessAIButton = ({ onClick, isProcessing, large }: Props) => (
  <button
    onClick={onClick}
    disabled={isProcessing}
    className={`group flex items-center justify-center gap-2 ${large ? 'px-10 py-5 text-lg' : 'px-6 py-3'} bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-green-600`}
    style={large ? { minWidth: 240 } : {}}
  >
    <Sparkles size={large ? 28 : 20} className={`${isProcessing ? 'animate-pulse' : 'group-hover:scale-110'} transition-transform`} />
    <span>{isProcessing ? 'Processing...' : 'Process with AI'}</span>
  </button>
);

export default ProcessAIButton;
