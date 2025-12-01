import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Loader2, Shield, FileText, Brain, CheckCircle, AlertCircle, Server, Upload, X, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import type { TimeEstimationResponse } from '@/app/types/api';

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
  isSubStage?: boolean;
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
  const router = useRouter();
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  const processingStartTimeRef = useRef<number | null>(null);
  const [supabase] = useState<ReturnType<typeof createSupabaseBrowserClient> | null>(() => createSupabaseBrowserClient());
  const [timeEstimation, setTimeEstimation] = useState<TimeEstimationResponse | null>(null);
  const [isEstimating, setIsEstimating] = useState(false);
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
  const timeEstimationRef = useRef<TimeEstimationResponse | null>(null);

  const stages: ProcessingStage[] = useMemo(() => {
    if (timeEstimation) {
      return [
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
          duration: timeEstimation.breakdown.ocr,
          description: `Extracted ${timeEstimation.char_count.toLocaleString()} characters using local OCR`
        },
        {
          id: 'llm',
          name: 'Local AI Processing',
          icon: <Brain className="w-5 h-5" />,
          duration: timeEstimation.breakdown.metadata_extraction + timeEstimation.breakdown.items_extraction,
          description: 'Processing invoice data with local LLM...'
        },
        {
          id: 'metadata',
          name: 'Metadata Extraction',
          icon: <Brain className="w-4 h-4" />,
          duration: timeEstimation.breakdown.metadata_extraction,
          description: 'Extracting seller, buyer, and invoice details...',
          isSubStage: true
        },
        {
          id: 'items',
          name: 'Line Items Extraction',
          icon: <Brain className="w-4 h-4" />,
          duration: timeEstimation.breakdown.items_extraction,
          description: 'Extracting invoice line items and amounts...',
          isSubStage: true
        },
        {
          id: 'postprocess',
          name: 'Post-processing',
          icon: <Server className="w-5 h-5" />,
          duration: 10,
          description: 'Structuring data and preparing final results...'
        }
      ];
    }

    // Default durations if no estimation available
    return [
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
        duration: 20,
        description: 'Extracting text using local OCR - no external services...'
      },
      {
        id: 'llm',
        name: 'Local AI Processing',
        icon: <Brain className="w-5 h-5" />,
        duration: 160,
        description: 'Processing invoice data with local LLM...'
      },
      {
        id: 'postprocess',
        name: 'Post-processing',
        icon: <Server className="w-5 h-5" />,
        duration: 15,
        description: 'Structuring data and preparing final results...'
      }
    ];
  }, [timeEstimation]);


  const activeSubStage = useMemo(() => {
    if (!progressData || progressData.stage !== 'llm') {
      return null;
    }

    const message = progressData.message?.toLowerCase() || '';

    if (message.includes('metadata')) {
      return 'metadata';
    } else if (message.includes('line items') || message.includes('items')) {
      return 'items';
    }

    return null;
  }, [progressData]);

  useEffect(() => {
    if (!isOpen || !file || timeEstimation || isEstimating) {
      return;
    }

    const fetchEstimation = async () => {
      setIsEstimating(true);
      try {
        let authToken = '';
        if (supabase) {
          const { data: { session } } = await supabase.auth.getSession();
          authToken = session?.access_token || '';
        }

        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/proxy/estimate-time', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`
          },
          body: formData,
        });

        if (response.ok) {
          const estimation = await response.json();
          setTimeEstimation(estimation);
          timeEstimationRef.current = estimation;
        }
      } catch (err) {
        console.error('Failed to fetch time estimation:', err);
      } finally {
        setIsEstimating(false);
      }
    };

    fetchEstimation();
  }, [isOpen, file, timeEstimation, isEstimating, supabase]);

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

      const stageToIndex = {
        'upload': 0,
        'ocr': 1,
        'llm': 2,
        'postprocess': 3
      };

      eventSource.addEventListener('progress', (event) => {
        try {
          const data: ProgressData = JSON.parse(event.data);
          setProgressData(data);

          const stageIndex = stageToIndex[data.stage as keyof typeof stageToIndex] ?? 0;
          setCurrentStageIndex(stageIndex);

          if (startTimeRef.current) {
            const elapsed = (Date.now() - startTimeRef.current) / 1000;

            if (timeEstimationRef.current) {
              const estimatedTotal = timeEstimationRef.current.estimated_time_seconds;
              const calculatedProgress = Math.min((elapsed / estimatedTotal) * 100, 99);
              setProgress(calculatedProgress);

              const remaining = Math.max(estimatedTotal - elapsed, 0);
              setTimeRemaining(remaining);
            } else {
              setProgress(data.progress);

              if (data.progress > 5) {
                const progressRate = data.progress / 100;
                const estimatedTotal = progressRate > 0 ? elapsed / progressRate : 0;
                const remaining = Math.max(estimatedTotal - elapsed, 0);
                setTimeRemaining(remaining);
              }
            }
          }
        } catch {
        }
      });

      eventSource.addEventListener('complete', (event) => {
        try {
          const data: { result: unknown } = JSON.parse(event.data);
          eventSource.close();

          setProgress(100);
          setCurrentStageIndex(stages.length - 1);
          setProgressData(prev => {
            if (!prev) return {
              id: 'completed',
              filename: file?.name || 'unknown',
              status: 'completed',
              progress: 100,
              stage: 'postprocess',
              message: 'Processing complete!',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              stages: {
                upload: { progress: 100, status: 'completed' },
                ocr: { progress: 100, status: 'completed' },
                llm: { progress: 100, status: 'completed' },
                postprocess: { progress: 100, status: 'completed' }
              }
            };
            return {
              ...prev,
              status: 'completed',
              message: 'Processing complete!',
              progress: 100
            };
          });

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
              router.push('/edit');
            }, 1500);
          };

          saveResultAndRedirect();
        } catch {
          setError('Failed to process completion data');
        }
      });

      eventSource.addEventListener('error', (event) => {
        try {
          const data: { error: string } = JSON.parse((event as MessageEvent).data);
          setError(data.error || 'Processing failed');
        } catch {
          setError('Connection error. Please try again.');
        }
        eventSource.close();
      });

      eventSource.onerror = () => {
        eventSource.close();
        setError('Connection lost. Please try again.');
      };

      return eventSource;
    };

    const eventSourcePromise = setupSSE();

    return () => {
      eventSourcePromise.then(es => es.close());
    };
  }, [isOpen, jobId, supabase, file, router, stages.length]);

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
        router.push('/upload');
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 select-none">
      <div className="bg-gradient-to-br from-zinc-900 to-black rounded-2xl shadow-2xl border border-blue-700/50 p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="w-8 h-8 text-blue-400" />
            <h2 className="text-2xl font-bold text-white">Privacy AI Processing</h2>
          </div>
          <p className="text-blue-300">
            Local processing keeps your data completely private
          </p>
          {isEstimating && (
            <div className="mt-3 flex items-center justify-center gap-2 text-sm">
              <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
              <span className="text-zinc-400">
                Calculating estimated time...
              </span>
            </div>
          )}
          {timeEstimation && !isEstimating && (
            <div className="mt-3 flex items-center justify-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-blue-400" />
              <span className="text-zinc-400">
                Estimated time: <span className="text-blue-400 font-medium">{formatTime(timeEstimation.estimated_time_seconds)}</span>
              </span>
            </div>
          )}
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
              {timeEstimation ? (
                timeRemaining > 0 ? `~${formatTime(timeRemaining)} remaining` : 'Almost done...'
              ) : (
                'Calculating...'
              )}
            </span>
            <span className="text-xs text-zinc-500">
              {timeEstimation
                ? `${formatTime(timeEstimation.estimated_time_seconds)} estimated`
                : 'Estimating time...'
              }
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
            if (stage.id === 'llm' && timeEstimation) {
              return null;
            }

            let isCompleted = false;
            let isCurrent = false;

            if (stage.isSubStage) {
              const llmCompleted = currentStageIndex > 2;
              if (stage.id === 'metadata') {
                isCompleted = activeSubStage === 'items' || llmCompleted;
                isCurrent = activeSubStage === 'metadata';
              } else if (stage.id === 'items') {
                isCompleted = llmCompleted;
                isCurrent = activeSubStage === 'items';
              }
            } else {
              const stageData = progressData?.stages?.[stage.id as keyof typeof progressData.stages];
              isCompleted = stageData?.status === 'completed' || index < currentStageIndex;
              isCurrent = index === currentStageIndex && progressData?.status !== 'completed';
            }

            const hasError = error && index === currentStageIndex;

            return (
              <div
                key={stage.id}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${stage.isSubStage ? 'ml-11' : ''
                  } ${hasError
                    ? 'bg-red-500/10 border border-red-500/20'
                    : isCompleted
                      ? 'bg-green-500/10 border border-green-500/20'
                      : isCurrent
                        ? 'bg-cyan-500/10 border border-cyan-500/20'
                        : 'bg-zinc-800/50 border border-zinc-700/50'
                  }`}
              >
                <div className={`flex items-center justify-center ${stage.isSubStage ? 'w-6 h-6' : 'w-8 h-8'
                  } rounded-full ${hasError
                    ? 'bg-red-500/20 text-red-400'
                    : isCompleted
                      ? 'bg-green-500/20 text-green-400'
                      : isCurrent
                        ? 'bg-cyan-500/20 text-cyan-400'
                        : 'bg-zinc-700/50 text-zinc-500'
                  }`}>
                  {hasError ? (
                    <AlertCircle className={stage.isSubStage ? 'w-3 h-3' : 'w-4 h-4'} />
                  ) : isCompleted ? (
                    <CheckCircle className={stage.isSubStage ? 'w-3 h-3' : 'w-4 h-4'} />
                  ) : isCurrent ? (
                    <Loader2 className={`${stage.isSubStage ? 'w-3 h-3' : 'w-4 h-4'} animate-spin`} />
                  ) : (
                    stage.icon
                  )}
                </div>
                <div className="flex-1">
                  <span className={`${stage.isSubStage ? 'text-xs' : 'text-sm'} font-medium ${hasError
                    ? 'text-red-400'
                    : isCompleted
                      ? 'text-green-400'
                      : isCurrent
                        ? 'text-cyan-400'
                        : 'text-zinc-500'
                    }`}>
                    {stage.name}
                  </span>
                  {stage.id === 'ocr' && timeEstimation && (isCompleted || isCurrent) && (
                    <div className={`text-xs mt-1 ${isCompleted ? 'text-green-400' : 'text-cyan-400'
                      }`}>
                      {timeEstimation.char_count.toLocaleString()} characters extracted
                    </div>
                  )}
                </div>
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
                Processing on local server with GPU acceleration. This takes longer but ensures your
                invoice data never leaves your infrastructure and is not shared with external AI services.
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-center">
          {progressData?.status === 'processing' && !error && (
            showCancelConfirmation ? (
              <div className="flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
                <span className="text-sm text-zinc-300">Are you sure?</span>
                <button
                  onClick={handleCancel}
                  disabled={isCancelling}
                  className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-2"
                >
                  {isCancelling ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                  Yes, Stop
                </button>
                <button
                  onClick={() => setShowCancelConfirmation(false)}
                  disabled={isCancelling}
                  className="px-4 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg text-xs font-medium transition cursor-pointer"
                >
                  No, Continue
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowCancelConfirmation(true)}
                disabled={isCancelling}
                className={`px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium text-sm shadow-lg flex items-center gap-2 transition ${isCancelling ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
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
            )
          )}

          {(error || progressData?.status === 'error') && (
            <button
              onClick={() => router.push('/upload')}
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