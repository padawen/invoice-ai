import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Loader2, FileText, Image as ImageIcon, Brain, CheckCircle } from 'lucide-react';

interface ProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  processingType: 'text' | 'image';
}

interface ProcessingStage {
  id: string;
  name: string;
  icon: React.ReactNode;
  duration: number; // in seconds
  description: string;
}

const ProgressModal = ({ isOpen, processingType }: ProgressModalProps) => {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const startTimeRef = useRef<number | null>(null);

  const stages: ProcessingStage[] = useMemo(() => processingType === 'image' 
    ? [
        {
          id: 'upload',
          name: 'Uploading PDF',
          icon: <FileText className="w-5 h-5" />,
          duration: 2,
          description: 'Uploading and validating PDF file...'
        },
        {
          id: 'render',
          name: 'Rendering PDF',
          icon: <ImageIcon className="w-5 h-5" />,
          duration: 8,
          description: 'Converting PDF pages to high-quality images...'
        },
        {
          id: 'analyze',
          name: 'AI Analysis',
          icon: <Brain className="w-5 h-5" />,
          duration: 15,
          description: 'OpenAI is analyzing the invoice content...'
        },
        {
          id: 'complete',
          name: 'Processing Complete',
          icon: <CheckCircle className="w-5 h-5" />,
          duration: 1,
          description: 'Finalizing results and preparing data...'
        }
      ]
    : [
        {
          id: 'upload',
          name: 'Uploading PDF',
          icon: <FileText className="w-5 h-5" />,
          duration: 2,
          description: 'Uploading and validating PDF file...'
        },
        {
          id: 'extract',
          name: 'Extracting Text',
          icon: <FileText className="w-5 h-5" />,
          duration: 5,
          description: 'Extracting text content from PDF...'
        },
        {
          id: 'analyze',
          name: 'AI Analysis',
          icon: <Brain className="w-5 h-5" />,
          duration: 12,
          description: 'OpenAI is analyzing the invoice content...'
        },
        {
          id: 'complete',
          name: 'Processing Complete',
          icon: <CheckCircle className="w-5 h-5" />,
          duration: 1,
          description: 'Finalizing results and preparing data...'
        }
      ], [processingType]);

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
      
      // Calculate which stage we should be in based on elapsed time
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
      
      // Calculate overall progress
      const overallProgress = Math.min((elapsed / totalDuration) * 100, 100);
      setProgress(overallProgress);
      
      // Calculate time remaining
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
      <div className="bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-800 p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Processing Invoice</h2>
          <p className="text-zinc-400">
            Processing {processingType === 'image' ? 'image-based' : 'text-based'} PDF with AI
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-zinc-400">Overall Progress</span>
            <span className="text-sm text-green-400 font-medium">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all duration-300 ease-out"
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

        {/* Current Stage */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center justify-center w-10 h-10 bg-green-500/20 rounded-full">
              {currentStageIndex === stages.length - 1 ? (
                <CheckCircle className="w-5 h-5 text-green-400" />
              ) : (
                <Loader2 className="w-5 h-5 text-green-400 animate-spin" />
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

        {/* Stage List */}
        <div className="space-y-3">
          {stages.map((stage, index) => (
            <div 
              key={stage.id}
              className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                index < currentStageIndex 
                  ? 'bg-green-500/10 border border-green-500/20' 
                  : index === currentStageIndex
                  ? 'bg-blue-500/10 border border-blue-500/20'
                  : 'bg-zinc-800/50 border border-zinc-700/50'
              }`}
            >
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                index < currentStageIndex 
                  ? 'bg-green-500/20 text-green-400' 
                  : index === currentStageIndex
                  ? 'bg-blue-500/20 text-blue-400'
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
                  ? 'text-green-400' 
                  : index === currentStageIndex
                  ? 'text-blue-400'
                  : 'text-zinc-500'
              }`}>
                {stage.name}
              </span>
            </div>
          ))}
        </div>

        {/* Tips */}
        <div className="mt-6 p-4 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
          <p className="text-xs text-zinc-400 text-center">
            💡 {processingType === 'image' 
              ? 'Image processing takes longer but works with scanned documents'
              : 'Text processing is faster for digital PDFs with selectable text'
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProgressModal;