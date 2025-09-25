import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Loader2, FileText, Image as ImageIcon, Brain, CheckCircle, Shield, Zap, Clock, AlertCircle, XCircle } from 'lucide-react';

interface ProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  processingType: 'text' | 'image';
  // New SSE props
  useRealTime?: boolean;
  jobId?: string | null;
  serviceType?: 'openai' | 'privacy';
  onComplete?: (result: unknown) => void;
  onError?: (error: string) => void;
}

interface ProcessingStage {
  id: string;
  name: string;
  icon: React.ReactNode;
  duration: number;
  description: string;
}

interface RealTimeProgress {
  step: string;
  progress: number;
  details?: string;
  error?: string;
  completed?: boolean;
}

const ProgressModal = ({
  isOpen,
  processingType,
  useRealTime = false,
  jobId = null,
  serviceType = 'openai',
  onComplete,
  onError,
  onClose
}: ProgressModalProps) => {
  // Traditional timer-based state
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const startTimeRef = useRef<number | null>(null);

  // Real-time SSE state
  const [realTimeProgress, setRealTimeProgress] = useState<RealTimeProgress>({
    step: 'initializing',
    progress: 0,
    details: 'Starting processing...'
  });
  const [startTime] = useState(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);
  const eventSourceRef = useRef<EventSource | null>(null);

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

  // Elapsed time tracker for real-time mode
  useEffect(() => {
    if (!useRealTime) return;

    const interval = setInterval(() => {
      setElapsedTime(Date.now() - startTime);
    }, 1000);

    return () => clearInterval(interval);
  }, [useRealTime, startTime]);

  // SSE connection for real-time progress
  useEffect(() => {
    if (!useRealTime || !isOpen || !jobId) return;

    const eventSource = new EventSource(`/api/processing/${jobId}/progress`);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const progressData: RealTimeProgress = JSON.parse(event.data);
        setRealTimeProgress(progressData);

        if (progressData.completed && !progressData.error && onComplete) {
          // Fetch the final result
          const endpoint = serviceType === 'privacy' ? '/api/processing/privacy' : '/api/processing/openai';
          fetch(`${endpoint}?jobId=${jobId}`)
            .then(res => res.json())
            .then(result => {
              eventSource.close();
              onComplete(result);
            })
            .catch(err => {
              eventSource.close();
              onError?.(`Failed to retrieve results: ${err.message}`);
            });
        } else if (progressData.error && onError) {
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
      onError?.('Connection to progress stream failed');
    };

    return () => {
      eventSource.close();
    };
  }, [useRealTime, isOpen, jobId, onComplete, onError, serviceType]);

  // Traditional timer-based progress
  useEffect(() => {
    if (useRealTime) return; // Skip traditional progress when using real-time
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
  }, [isOpen, totalDuration, stages, useRealTime]);

  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${Math.ceil(seconds)}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.ceil(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatElapsedTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getStepInfo = (step: string, serviceType: 'privacy' | 'openai') => {
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
    return steps[serviceType][step] || { label: step, icon: Loader2, color: 'text-gray-400' };
  };

  const getTimeEstimate = (step: string, serviceType: 'privacy' | 'openai') => {
    if (serviceType === 'privacy') {
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

  if (!isOpen) return null;

  // Real-time progress rendering
  if (useRealTime) {
    const stepInfo = getStepInfo(realTimeProgress.step, serviceType);
    const StepIcon = stepInfo.icon;
    const timeEstimate = getTimeEstimate(realTimeProgress.step, serviceType);

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-gradient-to-br from-zinc-900 to-black rounded-2xl shadow-2xl border border-zinc-700 p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              {serviceType === 'privacy' ? (
                <Shield className="w-8 h-8 text-blue-400" />
              ) : (
                <Zap className="w-8 h-8 text-green-400" />
              )}
              <h2 className="text-2xl font-bold text-white">
                {serviceType === 'privacy' ? 'Privacy AI Processing' : 'OpenAI Processing'}
              </h2>
            </div>
            <p className="text-zinc-400">
              {serviceType === 'privacy'
                ? 'Local processing keeps your data private'
                : 'Fast cloud processing with OpenAI'}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="bg-zinc-800 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  realTimeProgress.error ? 'bg-red-500' : 'bg-gradient-to-r from-green-500 to-emerald-500'
                }`}
                style={{ width: `${realTimeProgress.progress}%` }}
              />
            </div>
            <div className="flex justify-between text-sm text-zinc-400 mt-2">
              <span>{realTimeProgress.progress}% complete</span>
              <span>Elapsed: {formatElapsedTime(elapsedTime)}</span>
            </div>
          </div>

          {/* Current Step */}
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-2 rounded-full ${realTimeProgress.error ? 'bg-red-500/20' : 'bg-zinc-800'}`}>
              <StepIcon className={`w-5 h-5 ${stepInfo.color} ${
                realTimeProgress.step === 'initializing' || realTimeProgress.step === 'processing' ? 'animate-spin' : ''
              }`} />
            </div>
            <div className="flex-1">
              <div className="text-white font-medium">{stepInfo.label}</div>
              {realTimeProgress.details && (
                <div className="text-zinc-400 text-sm">{realTimeProgress.details}</div>
              )}
              {realTimeProgress.error && (
                <div className="text-red-400 text-sm mt-1">{realTimeProgress.error}</div>
              )}
            </div>
          </div>

          {/* Time Estimate */}
          <div className="flex items-center justify-center gap-2 text-zinc-400 text-sm mb-6">
            <Clock className="w-4 h-4" />
            <span>{timeEstimate}</span>
          </div>

          {/* Warning for Privacy Processing */}
          {serviceType === 'privacy' && realTimeProgress.step !== 'completed' && !realTimeProgress.error && (
            <div className="flex items-start gap-2 bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 mb-4">
              <AlertCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-blue-300">
                <strong>Privacy Mode:</strong> Processing on local server with CPU inference.
                This takes longer but keeps your data completely private.
              </div>
            </div>
          )}

          {/* Close button - only show if completed or error */}
          {(realTimeProgress.completed || realTimeProgress.error) && (
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

  // Traditional timer-based progress rendering
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-800 p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Processing Invoice</h2>
          <p className="text-zinc-400">
            Processing {processingType === 'image' ? 'image-based' : 'text-based'} PDF with AI
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
              {timeRemaining > 0 ? `~${formatTime(timeRemaining)} remaining` : 'Almost done...'}
            </span>
            <span className="text-xs text-zinc-500">
              {formatTime(totalDuration)} total
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