'use client';

import { useEffect, useState } from 'react';
import { Upload, FileText, AlertCircle, Loader2 } from 'lucide-react';
import { useUser } from '../providers';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import { useProcessing } from '../client-provider';

import PdfPreviewFrame from '../components/PdfPreviewFrame';
import ProgressModal from '../components/ProgressModal';
import PrivacyProgressModal from '../components/PrivacyProgressModal';
import type { EditableInvoice } from '@/app/types';

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
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showPrivacyProgressModal, setShowPrivacyProgressModal] = useState(false);
  const [progressProcessingType, setProgressProcessingType] = useState<'text' | 'image'>('text');

  const isOperationInProgress = isDetecting || localProcessing;

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

  const handleProcessWithPrivacy = async () => {
    await processInvoice('privacy');
  };

  const processInvoice = async (type: 'openai' | 'privacy') => {
    if (!file || !typeResult) return setError('No file or type detected');

    setLocalProcessing(true);
    setError(null);

    const isImageProcessing = typeResult === 'image';
    setProgressProcessingType(isImageProcessing ? 'image' : 'text');

    if (type === 'privacy') {
      setShowPrivacyProgressModal(true);
    } else {
      setShowProgressModal(true);
    }

    try {
      const token = await getToken();
      if (!token) {
        if (type === 'privacy') {
          setShowPrivacyProgressModal(false);
        } else {
          setShowProgressModal(false);
        }
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
      } else if (type === 'privacy') {
        endpoint = '/api/proxy/process-invoice';
        processingMethod = 'privacy';
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const rawText = await res.text();

      if (!res.ok) {
        throw new Error(`Processing failed with status ${res.status}: ${rawText}`);
      }

      const parsed = JSON.parse(rawText);

      if ('error' in parsed && parsed.error === 'PAGE_LIMIT_EXCEEDED') {
        setError('PDF exceeds the 10-page limit. Please upload a smaller document.');
        return;
      }

      if ('error' in parsed) {
        throw new Error(parsed.error || 'Processing failed');
      }

      const result = 'fallbackData' in parsed ? parsed.fallbackData : parsed;

      if (!isValidStructure(result)) {
        throw new Error('The AI processing result has an invalid structure. Please try again or contact support.');
      }

      sessionStorage.setItem('openai_json', JSON.stringify(result));
      sessionStorage.setItem('pdf_base64', await fileToBase64(file));
      sessionStorage.setItem('processing_method', processingMethod);

      setTimeout(() => {
        if (type === 'privacy') {
          setShowPrivacyProgressModal(false);
        } else {
          setShowProgressModal(false);
        }
        window.location.href = '/edit';
      }, 1000);

    } catch (err) {
      if (type === 'privacy') {
        setShowPrivacyProgressModal(false);
      } else {
        setShowProgressModal(false);
      }
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
                <div className="h-[600px]">
                  <PdfPreviewFrame src={fileUrl} />
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

              <div className="text-center text-sm text-zinc-500 max-w-2xl">
                <p className="mb-2">Choose your processing method:</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center text-xs">
                  <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3">
                    <div className="text-green-400 font-medium mb-1">OpenAI (Cloud)</div>
                    <div>Fast • High accuracy • External API</div>
                  </div>
                  <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
                    <div className="text-blue-400 font-medium mb-1">Privacy AI (Local)</div>
                    <div>Private • On-premise • No data sharing</div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-6 justify-center w-full max-w-2xl mx-auto">
                <button
                  onClick={handleProcessWithOpenAI}
                  disabled={isOperationInProgress}
                  className={`px-8 py-4 bg-green-600 hover:bg-green-500 text-white rounded-xl font-semibold text-lg shadow-lg flex flex-col items-center justify-center gap-2 transition ${
                    isOperationInProgress ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                  } flex-1 min-h-[80px]`}
                >
                  Extract with OpenAI
                  <span className="text-sm px-3 py-1 bg-green-700 rounded">Cloud</span>
                </button>

                <button
                  onClick={handleProcessWithPrivacy}
                  disabled={isOperationInProgress}
                  className={`px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-lg shadow-lg flex flex-col items-center justify-center gap-2 transition ${
                    isOperationInProgress ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                  } flex-1 min-h-[80px]`}
                >
                  Extract with Privacy AI
                  <span className="text-sm px-3 py-1 bg-blue-700 rounded">Local</span>
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

      <PrivacyProgressModal
        isOpen={showPrivacyProgressModal}
        onClose={() => setShowPrivacyProgressModal(false)}
      />
    </>
  );
};

export default UploadPage;

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });