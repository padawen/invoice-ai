import React from 'react';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import type { PrivacyProgressData } from '@/app/types/api';

interface ProcessingStage {
  id: string;
  name: string;
  icon: React.ReactNode;
  duration: number;
  description: string;
}

interface StageListProps {
  stages: ProcessingStage[];
  currentStageIndex: number;
  progressData: PrivacyProgressData | null;
  error: string | null;
}

const StageList = React.memo(({ stages, currentStageIndex, progressData, error }: StageListProps) => (
  <div className="space-y-3" role="list" aria-label="Processing stages">
    {stages.map((stage, index) => {
      const stageData = progressData?.stages?.[stage.id as keyof typeof progressData.stages];
      const isCompleted = stageData?.status === 'completed' || index < currentStageIndex;
      const isCurrent = index === currentStageIndex && progressData?.status !== 'completed';
      const hasError = error && index === currentStageIndex;

      return (
        <div
          key={stage.id}
          className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
            hasError
              ? 'bg-red-500/10 border border-red-500/20'
              : isCompleted
              ? 'bg-green-500/10 border border-green-500/20'
              : isCurrent
              ? 'bg-cyan-500/10 border border-cyan-500/20'
              : 'bg-zinc-800/50 border border-zinc-700/50'
          }`}
          role="listitem"
          aria-current={isCurrent ? 'step' : undefined}
        >
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
            hasError
              ? 'bg-red-500/20 text-red-400'
              : isCompleted
              ? 'bg-green-500/20 text-green-400'
              : isCurrent
              ? 'bg-cyan-500/20 text-cyan-400'
              : 'bg-zinc-700/50 text-zinc-500'
          }`}>
            {hasError ? (
              <AlertCircle className="w-4 h-4" aria-label="Error" />
            ) : isCompleted ? (
              <CheckCircle className="w-4 h-4" aria-label="Completed" />
            ) : isCurrent ? (
              <Loader2 className="w-4 h-4 animate-spin" aria-label="In progress" />
            ) : (
              stage.icon
            )}
          </div>
          <div className="flex-1">
            <span className={`text-sm font-medium ${
              hasError
                ? 'text-red-400'
                : isCompleted
                ? 'text-green-400'
                : isCurrent
                ? 'text-cyan-400'
                : 'text-zinc-500'
            }`}>
              {stage.name}
            </span>
            {stageData?.duration && (
              <span className="text-xs text-zinc-500 ml-2">
                ({stageData.duration.toFixed(1)}s)
              </span>
            )}
          </div>
          {stageData?.progress && (
            <span className="text-xs text-zinc-400">
              {stageData.progress}%
            </span>
          )}
        </div>
      );
    })}
  </div>
));

StageList.displayName = 'StageList';

export default StageList;
