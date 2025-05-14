'use client';

import { Sparkles } from 'lucide-react';

interface ProcessAIButtonProps {
  onClick: () => void;
  isProcessing: boolean;
  large?: boolean;
}

const ProcessAIButton = ({
  onClick,
  isProcessing,
  large = false,
}: ProcessAIButtonProps) => {
  const baseClasses =
    'group flex items-center justify-center gap-2 text-white rounded-lg font-medium transition-all';
  const sizeClasses = large ? 'px-10 py-5 text-lg' : 'px-6 py-3';
  const stateClasses =
    'bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-green-600';
  const iconSize = large ? 28 : 20;

  return (
    <button
      onClick={onClick}
      disabled={isProcessing}
      className={`${baseClasses} ${sizeClasses} ${stateClasses}`}
      style={large ? { minWidth: 240 } : {}}
    >
      <Sparkles
        size={iconSize}
        className={`transition-transform ${
          isProcessing ? 'animate-pulse' : 'group-hover:scale-110'
        }`}
      />
      <span>{isProcessing ? 'Processing...' : 'Process with AI'}</span>
    </button>
  );
};

export default ProcessAIButton;
