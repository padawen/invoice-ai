'use client';

import { useEffect, useState, useRef } from 'react';
import { CheckCircle, XCircle, Loader2, Clock, Zap, Shield, AlertCircle } from 'lucide-react';

interface ProgressStep {
  step: string;
  progress: number;
  details?: string;
  error?: string;
  completed?: boolean;
}

interface RealTimeProgressModalProps {
  isOpen: boolean;
  jobId: string | null;
  processingType: 'privacy' | 'openai';
  onComplete: (result: unknown) => void;
  onError: (error: string) => void;
  onClose: () => void;
}

const getStepInfo = (step: string, processingType: 'privacy' | 'openai') => {
  const steps = {
    privacy: {
      'initializing': { label: 'Initializing', icon: Loader2, color: 'text-blue-400' },
      'uploading': { label: 'Uploading to Privacy Service', icon: Shield, color: 'text-blue-400' },
      'processing': { label: 'OCR & Local LLM Processing', icon: Shield, color: 'text-green-400' },
      'finalizing': { label: 'Formatting Results', icon: CheckCircle, color: 'text-green-400' },
      'completed': { label: 'Processing Complete!', icon: CheckCircle, color: 'text-green-500' },
      'error': { label: 'Processing Failed', icon: XCircle, color: 'text-red-500' }
    },
    openai: {
      'initializing': { label: 'Initializing', icon: Loader2, color: 'text-blue-400' },
      'uploading': { label: 'Uploading to OpenAI', icon: Zap, color: 'text-blue-400' },
      'processing': { label: 'AI Processing', icon: Zap, color: 'text-green-400' },
      'finalizing': { label: 'Formatting Results', icon: CheckCircle, color: 'text-green-400' },
      'completed': { label: 'Processing Complete!', icon: CheckCircle, color: 'text-green-500' },
      'error': { label: 'Processing Failed', icon: XCircle, color: 'text-red-500' }
    }
  };

  return steps[processingType][step] || { label: step, icon: Loader2, color: 'text-gray-400' };
};

const getTimeEstimate = (step: string, processingType: 'privacy' | 'openai') => {
  if (processingType === 'privacy') {
    switch (step) {
      case 'uploading': return '~10 seconds remaining';
      case 'processing': return '~2-3 minutes remaining';
      case 'finalizing': return '~10 seconds remaining';
      case 'completed': return 'Complete!';
      default: return '~2-3 minutes remaining';
    }
  } else {
    switch (step) {
      case 'uploading': return '~5 seconds remaining';
      case 'processing': return '~30-60 seconds remaining';
      case 'finalizing': return '~5 seconds remaining';
      case 'completed': return 'Complete!';
      default: return '~1-2 minutes remaining';
    }
  }
};

export default function RealTimeProgressModal({
  isOpen,
  jobId,
  processingType,
  onComplete,
  onError,
  onClose
}: RealTimeProgressModalProps) {
  const [progress, setProgress] = useState<ProgressStep>({
    step: 'initializing',
    progress: 0,
    details: 'Starting processing...'
  });
  const [startTime] = useState(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(Date.now() - startTime);
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  useEffect(() => {
    if (!isOpen || !jobId) return;

    const eventSource = new EventSource(`/api/processing/${jobId}/progress`);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const progressData: ProgressStep = JSON.parse(event.data);
        setProgress(progressData);

        if (progressData.completed && !progressData.error) {
          // Fetch the final result
          fetch(`/api/processing/privacy?jobId=${jobId}`)
            .then(res => res.json())
            .then(result => {
              eventSource.close();
              onComplete(result);
            })
            .catch(err => {
              eventSource.close();
              onError(`Failed to retrieve results: ${err.message}`);
            });
        } else if (progressData.error) {
          eventSource.close();
          onError(progressData.error);
        }
      } catch (err) {
        console.error('Error parsing SSE data:', err);
      }
    };

    eventSource.onerror = (event) => {
      console.error('SSE error:', event);
      eventSource.close();
      onError('Connection to progress stream failed');
    };

    return () => {
      eventSource.close();
    };
  }, [isOpen, jobId, onComplete, onError]);

  if (!isOpen) return null;

  const stepInfo = getStepInfo(progress.step, processingType);
  const StepIcon = stepInfo.icon;
  const timeEstimate = getTimeEstimate(progress.step, processingType);

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-zinc-900 to-black rounded-2xl shadow-2xl border border-zinc-700 p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            {processingType === 'privacy' ? (
              <Shield className="w-8 h-8 text-blue-400" />
            ) : (
              <Zap className="w-8 h-8 text-green-400" />
            )}
            <h2 className="text-2xl font-bold text-white">
              {processingType === 'privacy' ? 'Privacy AI Processing' : 'OpenAI Processing'}
            </h2>
          </div>
          <p className="text-zinc-400">
            {processingType === 'privacy'
              ? 'Local processing keeps your data private'
              : 'Fast cloud processing with OpenAI'}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="bg-zinc-800 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                progress.error ? 'bg-red-500' : 'bg-gradient-to-r from-green-500 to-emerald-500'
              }`}
              style={{ width: `${progress.progress}%` }}
            />
          </div>
          <div className="flex justify-between text-sm text-zinc-400 mt-2">
            <span>{progress.progress}% complete</span>
            <span>Elapsed: {formatTime(elapsedTime)}</span>
          </div>
        </div>

        {/* Current Step */}
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2 rounded-full ${progress.error ? 'bg-red-500/20' : 'bg-zinc-800'}`}>
            <StepIcon className={`w-5 h-5 ${stepInfo.color} ${
              progress.step === 'initializing' || progress.step === 'processing' ? 'animate-spin' : ''
            }`} />
          </div>
          <div className="flex-1">
            <div className="text-white font-medium">{stepInfo.label}</div>
            {progress.details && (
              <div className="text-zinc-400 text-sm">{progress.details}</div>
            )}
            {progress.error && (
              <div className="text-red-400 text-sm mt-1">{progress.error}</div>
            )}
          </div>
        </div>

        {/* Time Estimate */}
        <div className="flex items-center justify-center gap-2 text-zinc-400 text-sm mb-6">
          <Clock className="w-4 h-4" />
          <span>{timeEstimate}</span>
        </div>

        {/* Warning for Privacy Processing */}
        {processingType === 'privacy' && progress.step !== 'completed' && !progress.error && (
          <div className="flex items-start gap-2 bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 mb-4">
            <AlertCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-blue-300">
              <strong>Privacy Mode:</strong> Processing on local server with CPU inference.
              This takes longer but keeps your data completely private.
            </div>
          </div>
        )}

        {/* Close button - only show if completed or error */}
        {(progress.completed || progress.error) && (
          <div className="text-center">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}