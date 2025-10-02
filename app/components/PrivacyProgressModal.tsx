import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Loader2, Shield, FileText, Brain, CheckCircle, AlertCircle, Server, Upload, X } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

interface PrivacyProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId?: string;
  file?: File;
}

interface ProcessingStage {
  id: string;
  name: string;
  icon: React.ReactNode;
  duration: number;
  description: string;
}

interface ProgressData {
  id: string;
  filename: string;
  status: 'started' | 'processing' | 'completed' | 'error';
  progress: number;
  stage: string;
  message: string;
  created_at: string;
  updated_at: string;
  stages: {
    upload: { progress: number; status: string; duration?: number };
    ocr: { progress: number; status: string; duration?: number };
    llm: { progress: number; status: string; duration?: number };
    postprocess: { progress: number; status: string; duration?: number };
  };
  error?: string;
  result?: Record<string, unknown>;
}

const PrivacyProgressModal = ({ isOpen, jobId, file }: PrivacyProgressModalProps) => {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  const processingStartTimeRef = useRef<number | null>(null);
  const [supabase, setSupabase] = useState<ReturnType<typeof createSupabaseBrowserClient> | null>(null);

  useEffect(() => {
    const client = createSupabaseBrowserClient();
    if (client) setSupabase(client);
  }, []);

  const stages: ProcessingStage[] = useMemo(() => [
    {
      id: 'upload',
      name: 'File Upload',
      icon: <Upload className="w-5 h-5" />,
      duration: 5,
      description: 'Uploading file to privacy server...'
    },
    {
      id: 'ocr',
      name: 'OCR Text Extraction',
      icon: <FileText className="w-5 h-5" />,
      duration: 15,
      description: 'Extracting text using local OCR - no external services...'
    },
    {
      id: 'llm',
      name: 'Local AI Processing',
      icon: <Brain className="w-5 h-5" />,
      duration: 70,
      description: 'Processing with local LLM - your data stays private...'
    },
    {
      id: 'postprocess',
      name: 'Post-processing',
      icon: <Server className="w-5 h-5" />,
      duration: 10,
      description: 'Structuring data and preparing final results...'
    }
  ], []);

  const totalDuration = useMemo(() => stages.reduce((sum, stage) => sum + stage.duration, 0), [stages]);

  // SSE Progress streaming effect
  useEffect(() => {
    if (!isOpen || !jobId) {
      setCurrentStageIndex(0);
      setProgress(0);
      setTimeRemaining(0);
      setProgressData(null);
      setError(null);
      startTimeRef.current = null;
      processingStartTimeRef.current = null;
      return;
    }

    startTimeRef.current = Date.now();
    processingStartTimeRef.current = Date.now();

    // Get auth token for SSE connection (passed as query param since EventSource doesn't support headers)
    const getAuthToken = async () => {
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        return session?.access_token || '';
      }
      return '';
    };

    const setupSSE = async () => {
      const authToken = await getAuthToken();
      const progressUrl = `/api/proxy/progress-stream/${jobId}${authToken ? `?auth=${authToken}` : ''}`;
      const eventSource = new EventSource(progressUrl);

      // Map stage to index
      const stageToIndex = {
        'upload': 0,
        'ocr': 1,
        'llm': 2,
        'postprocess': 3
      };

      // Handle progress updates
      eventSource.addEventListener('progress', (event) => {
        try {
          const data: ProgressData = JSON.parse(event.data);
          setProgressData(data);
          setProgress(data.progress);

          const stageIndex = stageToIndex[data.stage as keyof typeof stageToIndex] ?? 0;
          setCurrentStageIndex(stageIndex);

          // Calculate time remaining based on current progress and elapsed time
          // Only calculate if we have meaningful progress (>5%) to avoid wild estimates
          if (startTimeRef.current && data.progress > 5) {
            const elapsed = (Date.now() - startTimeRef.current) / 1000;
            const progressRate = data.progress / elapsed;
            const remaining = progressRate > 0 ? (100 - data.progress) / progressRate : 0;
            setTimeRemaining(Math.max(remaining, 0));
          }
        } catch {
          // Failed to parse progress data
        }
      });

      // Handle completion
      eventSource.addEventListener('complete', (event) => {
        try {
          const data: { result: unknown } = JSON.parse(event.data);
          eventSource.close();

          // Processing completed successfully - save result and redirect
          const saveResultAndRedirect = async () => {
            const endTime = Date.now();
            const extractionTime = processingStartTimeRef.current
              ? (endTime - processingStartTimeRef.current) / 1000
              : 0;

            sessionStorage.setItem('openai_json', JSON.stringify(data.result));
            if (file) {
              sessionStorage.setItem('pdf_base64', await fileToBase64(file));
            }
            sessionStorage.setItem('processing_method', 'privacy');
            sessionStorage.setItem('extraction_method', 'privacy');
            sessionStorage.setItem('extraction_time', extractionTime.toString());

            setTimeout(() => {
              window.location.href = '/edit';
            }, 1000);
          };

          saveResultAndRedirect();
        } catch {
          setError('Failed to process completion data');
        }
      });

      // Handle errors
      eventSource.addEventListener('error', (event) => {
        try {
          const data: { error: string } = JSON.parse((event as MessageEvent).data);
          setError(data.error || 'Processing failed');
        } catch {
          setError('Connection error. Please try again.');
        }
        eventSource.close();
      });

      // Handle connection errors
      eventSource.onerror = () => {
        eventSource.close();
        setError('Connection lost. Please try again.');
      };

      return eventSource;
    };

    const eventSourcePromise = setupSSE();

    // Cleanup on unmount
    return () => {
      eventSourcePromise.then(es => es.close());
    };
  }, [isOpen, jobId, supabase, file]);

  const handleCancel = async () => {
    if (!jobId || isCancelling) return;

    try {
      setIsCancelling(true);

      let authToken = '';
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        authToken = session?.access_token || '';
      }

      const cancelUrl = `/api/proxy/cancel/${jobId}`;
      const response = await fetch(cancelUrl, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (response.ok) {
        console.log('Job cancelled successfully');
        // Close modal and go back to upload page
        window.location.href = '/upload';
      } else {
        const errorText = await response.text();
        console.error('Cancel failed:', errorText);
        setError('Failed to cancel processing');
      }
    } catch (err) {
      console.error('Cancel error:', err);
      setError('Failed to cancel processing');
    } finally {
      setIsCancelling(false);
    }
  };

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
              {error ? (
                <AlertCircle className="w-5 h-5 text-red-400" />
              ) : progressData?.status === 'completed' ? (
                <CheckCircle className="w-5 h-5 text-green-400" />
              ) : (
                <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
              )}
            </div>
            <div>
              <h3 className="text-white font-semibold">
                {error ? 'Processing Error' :
                 progressData?.status === 'completed' ? 'Processing Complete' :
                 stages[currentStageIndex]?.name || 'Processing'}
              </h3>
              <p className="text-zinc-400 text-sm">
                {error ? error :
                 progressData?.message ||
                 stages[currentStageIndex]?.description}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
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
                    <AlertCircle className="w-4 h-4" />
                  ) : isCompleted ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : isCurrent ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
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

        <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-blue-300">
              <div className="font-medium mb-1">Privacy Mode Active</div>
              <div>
                Processing on local server with CPU inference. This takes longer but ensures your
                invoice data never leaves your infrastructure and is not shared with external AI services.
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-4 flex justify-center">
          {/* Stop button - only show if processing and not completed/errored */}
          {progressData?.status === 'processing' && !error && (
            <button
              onClick={handleCancel}
              disabled={isCancelling}
              className={`px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium text-sm shadow-lg flex items-center gap-2 transition ${
                isCancelling ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              {isCancelling ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Stopping...
                </>
              ) : (
                <>
                  <X className="w-4 h-4" />
                  Stop Processing
                </>
              )}
            </button>
          )}

          {/* Close button - show when there's an error or processing is cancelled (NOT when completed) */}
          {(error || progressData?.status === 'error') && (
            <button
              onClick={() => window.location.href = '/upload'}
              className="px-6 py-2 bg-zinc-600 hover:bg-zinc-500 text-white rounded-lg font-medium text-sm shadow-lg flex items-center gap-2 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export default PrivacyProgressModal;