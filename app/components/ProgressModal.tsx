import React, { useEffect, useState, useMemo } from 'react';
import { Loader2, FileText, Image as ImageIcon, Brain, CheckCircle, X } from 'lucide-react';

interface ProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  processingType: 'image';
  isFinished?: boolean;
  onCancel?: () => void;
}

interface ProcessingStage {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
}

const ProgressModal = ({ isOpen, isFinished = false, onCancel }: ProgressModalProps) => {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);

  const stages: ProcessingStage[] = useMemo(() => [
    {
      id: 'upload',
      name: 'Uploading PDF',
      icon: <FileText className="w-5 h-5" />,
      description: 'Uploading and validating PDF file...'
    },
    {
      id: 'render',
      name: 'Rendering PDF',
      icon: <ImageIcon className="w-5 h-5" />,
      description: 'Converting PDF pages to high-quality images...'
    },
    {
      id: 'analyze',
      name: 'AI Analysis',
      icon: <Brain className="w-5 h-5" />,
      description: 'OpenAI is analyzing the invoice content...'
    },
    {
      id: 'complete',
      name: 'Processing Complete',
      icon: <CheckCircle className="w-5 h-5" />,
      description: 'Finalizing results and preparing data...'
    }
  ], []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setCurrentStageIndex(0);
      setProgress(0);
      return;
    }

    const interval = setInterval(() => {
      setProgress(prev => {
        if (isFinished) {
          setCurrentStageIndex(3);
          return 100;
        }

        const target = 95;
        const remaining = target - prev;

        const increment = (remaining * 0.015) + 0.05 + (Math.random() * 0.1);

        const newProgress = Math.min(prev + increment, 95);

        if (newProgress < 25) setCurrentStageIndex(0);
        else if (newProgress < 50) setCurrentStageIndex(1);
        else if (newProgress < 90) setCurrentStageIndex(2);
        else setCurrentStageIndex(2);

        return newProgress;
      });
    }, 200);

    return () => clearInterval(interval);
  }, [isOpen, isFinished]);



  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 select-none">
      <div className="bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-800 p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Processing Invoice</h2>
          <p className="text-zinc-400">
            Processing invoice with AI
          </p>
        </div>

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
              Processing...
            </span>
            <span className="text-xs text-zinc-500">
              Please wait
            </span>
          </div>
        </div>

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

        <div className="space-y-3">
          {stages.map((stage, index) => (
            <div
              key={stage.id}
              className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${index < currentStageIndex
                ? 'bg-green-500/10 border border-green-500/20'
                : index === currentStageIndex
                  ? 'bg-blue-500/10 border border-blue-500/20'
                  : 'bg-zinc-800/50 border border-zinc-700/50'
                }`}
            >
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${index < currentStageIndex
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
              <span className={`text-sm font-medium ${index < currentStageIndex
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

        <div className="mt-6 p-4 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
          <p className="text-xs text-zinc-400 text-center">
            AI is extracting structured data from your invoice
          </p>
        </div>

        {!isFinished && onCancel && (
          <div className="mt-4 flex justify-center">
            {showCancelConfirmation ? (
              <div className="flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
                <span className="text-sm text-zinc-300">Are you sure?</span>
                <button
                  onClick={onCancel}
                  className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-medium transition cursor-pointer"
                >
                  Yes, Stop
                </button>
                <button
                  onClick={() => setShowCancelConfirmation(false)}
                  className="px-4 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg text-xs font-medium transition cursor-pointer"
                >
                  No, Continue
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowCancelConfirmation(true)}
                className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium text-sm shadow-lg flex items-center gap-2 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
                Stop Processing
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgressModal;