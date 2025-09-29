import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Loader2, Shield, FileText, Brain, CheckCircle, AlertCircle, Server } from 'lucide-react';

interface PrivacyProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ProcessingStage {
  id: string;
  name: string;
  icon: React.ReactNode;
  duration: number;
  description: string;
}

const PrivacyProgressModal = ({ isOpen }: PrivacyProgressModalProps) => {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const startTimeRef = useRef<number | null>(null);

  const stages: ProcessingStage[] = useMemo(() => [
    {
      id: 'upload',
      name: 'Uploading to Privacy Server',
      icon: <Shield className="w-5 h-5" />,
      duration: 8,
      description: 'Securely uploading PDF to local privacy server...'
    },
    {
      id: 'ocr',
      name: 'OCR Text Extraction',
      icon: <FileText className="w-5 h-5" />,
      duration: 45,
      description: 'Extracting text using local OCR - no external services...'
    },
    {
      id: 'analyze',
      name: 'Local AI Processing',
      icon: <Brain className="w-5 h-5" />,
      duration: 120,
      description: 'Processing with local LLM - your data stays private...'
    },
    {
      id: 'finalize',
      name: 'Formatting Results',
      icon: <Server className="w-5 h-5" />,
      duration: 10,
      description: 'Structuring data and preparing final results...'
    },
    {
      id: 'complete',
      name: 'Processing Complete',
      icon: <CheckCircle className="w-5 h-5" />,
      duration: 2,
      description: 'Privacy processing complete - no data shared externally!'
    }
  ], []);

  const totalDuration = useMemo(() => stages.reduce((sum, stage) => sum + stage.duration, 0), [stages]);

  useEffect(() => {
    if (!isOpen) {
      setCurrentStageIndex(0);
      setProgress(0);
      setTimeRemaining(0);
      startTimeRef.current = null;
      return;
    }

    startTimeRef.current = Date.now();

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = startTimeRef.current ? (now - startTimeRef.current) / 1000 : 0;

      let cumulativeTime = 0;
      let newStageIndex = 0;

      for (let i = 0; i < stages.length; i++) {
        if (elapsed >= cumulativeTime && elapsed < cumulativeTime + stages[i].duration) {
          newStageIndex = i;
          break;
        }
        cumulativeTime += stages[i].duration;
        if (i === stages.length - 1) {
          newStageIndex = stages.length - 1;
        }
      }

      setCurrentStageIndex(newStageIndex);

      const overallProgress = Math.min((elapsed / totalDuration) * 100, 100);
      setProgress(overallProgress);

      const remaining = Math.max(totalDuration - elapsed, 0);
      setTimeRemaining(remaining);

    }, 100);

    return () => clearInterval(interval);
  }, [isOpen, totalDuration, stages]);

  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${Math.ceil(seconds)}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.ceil(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-zinc-900 to-black rounded-2xl shadow-2xl border border-blue-700/50 p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="w-8 h-8 text-blue-400" />
            <h2 className="text-2xl font-bold text-white">Privacy AI Processing</h2>
          </div>
          <p className="text-blue-300">
            Local processing keeps your data completely private
          </p>
        </div>

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

        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-500/20 rounded-full">
              {currentStageIndex === stages.length - 1 ? (
                <CheckCircle className="w-5 h-5 text-blue-400" />
              ) : (
                <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
              )}
            </div>
            <div>
              <h3 className="text-white font-semibold">
                {stages[currentStageIndex]?.name}
              </h3>
              <p className="text-zinc-400 text-sm">
                {stages[currentStageIndex]?.description}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {stages.map((stage, index) => (
            <div
              key={stage.id}
              className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                index < currentStageIndex
                  ? 'bg-blue-500/10 border border-blue-500/20'
                  : index === currentStageIndex
                  ? 'bg-cyan-500/10 border border-cyan-500/20'
                  : 'bg-zinc-800/50 border border-zinc-700/50'
              }`}
            >
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                index < currentStageIndex
                  ? 'bg-blue-500/20 text-blue-400'
                  : index === currentStageIndex
                  ? 'bg-cyan-500/20 text-cyan-400'
                  : 'bg-zinc-700/50 text-zinc-500'
              }`}>
                {index < currentStageIndex ? (
                  <CheckCircle className="w-4 h-4" />
                ) : index === currentStageIndex ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  stage.icon
                )}
              </div>
              <span className={`text-sm font-medium ${
                index < currentStageIndex
                  ? 'text-blue-400'
                  : index === currentStageIndex
                  ? 'text-cyan-400'
                  : 'text-zinc-500'
              }`}>
                {stage.name}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-blue-300">
              <div className="font-medium mb-1">🔒 Privacy Mode Active</div>
              <div>
                Processing on local server with CPU inference. This takes longer but ensures your
                invoice data never leaves your infrastructure and is not shared with external AI services.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyProgressModal;