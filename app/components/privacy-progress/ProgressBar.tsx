import React from 'react';

interface ProgressBarProps {
  progress: number;
  timeRemaining: number;
  totalDuration: number;
}

function formatTime(seconds: number): string {
  if (seconds < 60) {
    return `${Math.ceil(seconds)}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.ceil(seconds % 60);
  return `${minutes}m ${remainingSeconds}s`;
}

const ProgressBar = React.memo(({ progress, timeRemaining, totalDuration }: ProgressBarProps) => (
  <div className="mb-8">
    <div className="flex justify-between items-center mb-2">
      <span className="text-sm text-zinc-400">Overall Progress</span>
      <span className="text-sm text-blue-400 font-medium">
        {Math.round(progress)}%
      </span>
    </div>
    <div className="w-full bg-zinc-800 rounded-full h-3">
      <div
        className="bg-gradient-to-r from-blue-500 to-cyan-500 h-3 rounded-full transition-all duration-300 ease-out"
        style={{ width: `${progress}%` }}
        role="progressbar"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Processing progress"
      />
    </div>
    <div className="flex justify-between items-center mt-2">
      <span className="text-xs text-zinc-500">
        {timeRemaining > 0 ? `~${formatTime(timeRemaining)} remaining` : 'Almost done...'}
      </span>
      <span className="text-xs text-zinc-500">
        {formatTime(totalDuration)} total
      </span>
    </div>
  </div>
));

ProgressBar.displayName = 'ProgressBar';

export default ProgressBar;
