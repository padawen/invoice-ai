'use client';

import { useEffect, useState } from 'react';
import { Upload, FileText, AlertCircle, Loader2 } from 'lucide-react';
import { useUser } from '../providers';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import { runOcr } from '@/app/lib/ocr';
import { useProcessing } from '../client-provider';

import PdfPreviewFrame from '../components/PdfPreviewFrame';
import ProgressModal from '../components/ProgressModal';
import type { EditableInvoice, NormalizedPage, NormalizedResult } from '@/app/types';

type OcrPanelState = {
  pages: NormalizedPage[];
  fullText: string;
  durationMs: number;
  pagesCount: number;
  fileName: string;
};

const UploadPage = () => {
  const user = useUser();
  const { setIsProcessing } = useProcessing();
  const [supabase, setSupabase] = useState<ReturnType<typeof createSupabaseBrowserClient> | null>(null);

  useEffect(() => {
    const client = createSupabaseBrowserClient();
    if (client) setSupabase(client);
  }, []);

  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [typeResult, setTypeResult] = useState<'text' | 'image' | 'unknown' | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [localProcessing, setLocalProcessing] = useState(false);
  const [isRunningOcr, setIsRunningOcr] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [progressProcessingType, setProgressProcessingType] = useState<'text' | 'image'>('text');
  const [ocrResult, setOcrResult] = useState<OcrPanelState | null>(null);

  const isOperationInProgress = isDetecting || localProcessing || isRunningOcr;
  
  useEffect(() => {
    setIsProcessing(isOperationInProgress);
    return () => setIsProcessing(false);
  }, [isOperationInProgress, setIsProcessing]);

  const getToken = async (): Promise<string | null> => {
    if (!supabase) return null;
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || null;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    processFile(selectedFile);
  };

  const processFile = (selectedFile?: File) => {
    setError(null);

    if (!selectedFile) return;

    if (selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setFileUrl(URL.createObjectURL(selectedFile));
      setTypeResult(null);
      setOcrResult(null);

      handleDetectType(selectedFile);
    } else {
      setError('Please upload a valid PDF file!');
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    processFile(droppedFile);
  };

  const handleDetectType = async (pdfFile: File) => {
    if (!pdfFile) return setError('No file selected');
    setIsDetecting(true);
    setError(null);

    const attemptDetection = async (): Promise<{ type: 'text' | 'image' | 'unknown' }> => {
      try {
        const token = await getToken();
        if (!token) {
          throw new Error('Authentication token not available');
        }

        const formData = new FormData();
        formData.append('file', pdfFile);
        
        const res = await fetch('/api/detectType', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        if (!res.ok) {
          const errorText = await res.text();
          console.error('Detection request failed:', res.status, errorText);
          throw new Error(`Detection request failed with status ${res.status}: ${errorText}`);
        }
        
        const data = await res.json();
        return data;
      } catch (err) {
        console.error('Detection error:', err);
        throw err;
      }
    };

    try {
      let lastError: Error | null = null;
      for (let i = 0; i < 3; i++) {
        try {
          const data = await attemptDetection();
          setTypeResult(data.type || 'unknown');
          return; 
        } catch (err) {
          lastError = err instanceof Error ? err : new Error(String(err));
          
          if (i < 2) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }
      
      console.error('All detection attempts failed:', lastError);
      throw lastError || new Error('Failed after multiple attempts');
    } catch (err) {
      console.error('All detection attempts failed:', err);
      setError(`Detection failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsDetecting(false);
    }
  };

  const handleProcessWithOpenAI = async () => {
    await processInvoice('openai');
  };

  const handleRunOcr = async () => {
    if (!file) return setError('No file selected');

    setIsRunningOcr(true);
    setError(null);
    setOcrResult(null);

    try {
      const response = await runOcr(file);
      const { pages, fullText } = extractNormalizedPages(response.normalized);
      setOcrResult({
        pages,
        fullText,
        durationMs: response.duration_ms,
        pagesCount: response.pages,
        fileName: response.file_name,
      });
    } catch (err) {
      console.error('OCR error:', err);
      const message = err instanceof Error ? err.message : 'Failed to run OCR';
      if (message === 'ocr_timeout') {
        setError('OCR request timed out. Please try again.');
      } else if (message === 'ocr_failed') {
        setError('OCR service failed to process the document.');
      } else if (message === 'ocr_service_unconfigured') {
        setError(
          'OCR service is not configured. Start the DocTR service or set OCR_SERVICE_URL/NEXT_PUBLIC_OCR_SERVICE_URL.',
        );
      } else {
        setError(message);
      }
    } finally {
      setIsRunningOcr(false);
    }
  };

  const processInvoice = async (type: 'openai' | 'localllm' | 'doctr') => {
    if (!file || !typeResult) return setError('No file or type detected');

    setLocalProcessing(true);
    setError(null);

    const isImageProcessing = typeResult === 'image' || type === 'doctr';
    setProgressProcessingType(isImageProcessing ? 'image' : 'text');
    setShowProgressModal(true);

    try {
      const token = await getToken();
      if (!token) {
        setShowProgressModal(false);
        return alert('You must be logged in to use this feature.');
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('processor', type);

      let endpoint = '/api/processTextPDF';
      let processingMethod = 'text';

      if (type === 'openai') {
        if (typeResult === 'text') {
          endpoint = '/api/processTextPDF';
          processingMethod = 'text';
        } else {
          endpoint = '/api/processImagePDF';
          processingMethod = 'image';
        }
      } else if (type === 'localllm') {
        endpoint = '/api/processLocalLLM'; 
        processingMethod = 'text';
      } else if (type === 'doctr') {
        // TODO(invoice-ocr): invoke runOcr(file) from '@/app/lib/ocr' here to fetch the Doctr payload before falling back to legacy handlers.
        endpoint = '/api/processDoctr';
        processingMethod = 'image';
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const rawText = await res.text();
      const parsed = JSON.parse(rawText);

      if ('error' in parsed && parsed.error === 'PAGE_LIMIT_EXCEEDED') {
        setError('PDF exceeds the 10-page limit. Please upload a smaller document.');
        return;
      }

      const result = 'fallbackData' in parsed ? parsed.fallbackData : parsed;

      if (!isValidStructure(result)) {
        throw new Error('The AI processing result has an invalid structure. Please try again or contact support.');
      }

      sessionStorage.setItem('openai_json', JSON.stringify(result));
      sessionStorage.setItem('pdf_base64', await fileToBase64(file));
      sessionStorage.setItem('processing_method', processingMethod);

      setTimeout(() => {
        setShowProgressModal(false);
        window.location.href = '/edit';
      }, 1000);

    } catch (err) {
      setShowProgressModal(false);
      setError(err instanceof Error ? err.message : 'Failed to process file');
    } finally {
      setLocalProcessing(false);
    }
  };

  const isValidStructure = (data: unknown): data is EditableInvoice => {
    return (
      typeof data === 'object' &&
      data !== null &&
      'seller' in data &&
      'buyer' in data &&
      'invoice_data' in data &&
      Array.isArray((data as EditableInvoice).invoice_data)
    );
  };

  useEffect(() => {
    return () => {
      if (fileUrl) URL.revokeObjectURL(fileUrl);
    };
  }, [fileUrl]);

  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-900 via-black to-zinc-800 text-white">
        <div className="bg-zinc-900/80 rounded-2xl shadow-2xl p-10 border border-zinc-800 backdrop-blur-md flex flex-col items-center gap-6">
          <h1 className="text-3xl font-bold text-green-400">Login Required</h1>
          <p className="text-zinc-400 text-lg text-center">
            You must be logged in to upload and process invoices.
          </p>
          <a
            href="/auth/login"
            className="px-8 py-4 bg-green-600 hover:bg-green-500 rounded-xl text-white font-semibold text-lg shadow-lg transition"
          >
            Login to Continue
          </a>
        </div>
      </main>
    );
  }

  return (
    <>
      <main className="min-h-screen bg-gradient-to-br from-zinc-900 via-black to-zinc-800 text-white py-12 px-4">
        <div className="w-full max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
              Upload Invoice PDF
            </h1>
            <p className="text-zinc-400 text-lg">Upload your invoice and let our AI process it</p>
          </div>

          <div className="flex flex-col items-center gap-6">
            <div className="w-full max-w-md">
              <label
                htmlFor="file-upload"
                className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed ${
                  isDragging ? 'border-green-500 bg-green-500/10' : 'border-zinc-700 bg-zinc-800/50'
                } rounded-xl backdrop-blur-sm hover:border-green-500/50 transition-colors cursor-pointer group ${
                  isOperationInProgress ? 'opacity-50 pointer-events-none' : ''
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className={`w-10 h-10 mb-3 ${isDragging ? 'text-green-400' : 'text-zinc-400'} group-hover:text-green-400`} />
                  <p className="mb-2 text-sm text-zinc-400">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-zinc-500">PDF files only</p>
                </div>
                <input
                  id="file-upload"
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={isOperationInProgress}
                />
              </label>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 bg-red-400/10 px-4 py-2 rounded-lg">
                <AlertCircle size={20} />
                <span>{error}</span>
              </div>
            )}

            {fileUrl && (
              <div className="w-full">
                <div className="flex items-center gap-2 mb-2">
                  <FileText size={20} className="text-green-400" />
                  <span className="text-zinc-300">{file?.name}</span>
                </div>
                <div className="flex flex-col lg:flex-row gap-6">
                  <div className="lg:flex-1">
                    <div className="h-[600px]">
                      <PdfPreviewFrame src={fileUrl} />
                    </div>
                  </div>

                  {ocrResult && (
                    <div className="lg:w-5/12 xl:w-1/3 bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 overflow-hidden">
                      <p className="text-sm text-zinc-400 mb-3 truncate">{ocrResult.fileName}</p>
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-zinc-500">Pages</p>
                          <p className="text-lg font-semibold text-green-400">{ocrResult.pagesCount}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wide text-zinc-500">Duration</p>
                          <p className="text-lg font-semibold text-green-400">
                            {(ocrResult.durationMs / 1000).toFixed(1)}s
                          </p>
                        </div>
                      </div>

                      <div className="h-[520px] overflow-y-auto space-y-4 pr-1">
                        {ocrResult.pages.length > 0 ? (
                          ocrResult.pages.map((page, index) => (
                            <div
                              key={page.page_index ?? index}
                              className="bg-black/20 border border-zinc-800 rounded-xl p-3"
                            >
                              <h3 className="text-sm font-semibold text-green-300 mb-2">
                                Page {page.page_index + 1}
                              </h3>
                              <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">
                                {page.text || 'No text extracted for this page.'}
                              </p>
                            </div>
                          ))
                        ) : (
                          <div className="text-sm text-zinc-400">
                            No OCR text available for this document.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {isDetecting && (
            <div className="flex justify-center mt-8">
              <div className="flex items-center gap-3 text-green-400">
                <Loader2 size={24} className="animate-spin" />
                <span>Detecting document type...</span>
              </div>
            </div>
          )}

          {typeResult && (
            <div className="space-y-6 flex flex-col items-center mt-8">
              <div className="flex items-center justify-center gap-2 text-lg mb-4">
                <span className="text-zinc-400">Detected type:</span>
                <span className="px-3 py-1 bg-zinc-800 rounded-lg text-green-400 font-medium">
                  {typeResult}
                </span>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center w-full">
                <button
                  onClick={handleProcessWithOpenAI}
                  disabled={isOperationInProgress}
                  className={`px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-semibold shadow-lg flex items-center justify-center gap-2 transition ${
                    isOperationInProgress ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  Extract with OpenAI
                </button>
                
                <button
                  disabled={true}
                  className="px-6 py-3 bg-blue-600/40 text-white/70 rounded-xl font-semibold shadow-lg flex items-center justify-center gap-2 cursor-not-allowed opacity-70"
                >
                  Extract with Local LLM - Ollama
                  <span className="text-xs px-2 py-0.5 bg-zinc-800 rounded ml-1">Coming soon</span>
                </button>

                <button
                  onClick={handleRunOcr}
                  disabled={isOperationInProgress || !file}
                  className={`px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-semibold shadow-lg flex items-center justify-center gap-2 transition ${
                    isOperationInProgress || !file ? 'opacity-50 cursor-not-allowed hover:bg-purple-600' : ''
                  }`}
                >
                  {isRunningOcr ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Running dOCTR...
                    </>
                  ) : (
                    'Run dOCTR'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <ProgressModal 
        isOpen={showProgressModal}
        processingType={progressProcessingType}
        onClose={() => setShowProgressModal(false)}
      />
    </>
  );
};

export default UploadPage;

const extractNormalizedPages = (
  normalized: NormalizedResult,
): { pages: NormalizedPage[]; fullText: string } => {
  if (Array.isArray(normalized)) {
    return {
      pages: normalized,
      fullText: normalized.map(page => page.text).join('\n\n'),
    };
  }

  const pages = normalized?.pages ?? [];
  const fullText =
    typeof normalized?.full_text === 'string'
      ? normalized.full_text
      : pages.map(page => page.text).join('\n\n');

  return { pages, fullText };
};

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
