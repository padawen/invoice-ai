'use client';

import { useEffect, useState } from 'react';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { useUser } from '../providers';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

import PdfPreviewFrame from '../components/PdfPreviewFrame';
import DetectTypeButton from '../components/DetectTypeButton';
import ProcessAIButton from '../components/ProcessAIButton';
import type { EditableInvoice } from '@/app/types';

const UploadPage = () => {
  const user = useUser();
  const [supabase, setSupabase] = useState<ReturnType<typeof createSupabaseBrowserClient> | null>(null);

  useEffect(() => {
    const client = createSupabaseBrowserClient();
    if (client) setSupabase(client);
  }, []);

  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [typeResult, setTypeResult] = useState<'text' | 'image' | 'unknown' | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getToken = async (): Promise<string | null> => {
    if (!supabase) return null;
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || null;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    setError(null);

    if (selectedFile?.type === 'application/pdf') {
      setFile(selectedFile);
      setFileUrl(URL.createObjectURL(selectedFile));
      setTypeResult(null);
    } else {
      setError('Please upload a valid PDF file!');
    }
  };

  const handleDetectClick = async () => {
    if (!file) return setError('No file selected');
    setIsDetecting(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) return alert('You must be logged in to use this feature.');

      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/detectType', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) throw new Error('Detection request failed');
      const data: { type: 'text' | 'image' | 'unknown' } = await res.json();
      setTypeResult(data.type || 'unknown');
    } catch {
      setError('An error occurred while detecting the file type');
    } finally {
      setIsDetecting(false);
    }
  };

  const handleProcessWithOpenAI = async () => {
    if (!file || !typeResult) return setError('No file or type detected');

    setIsProcessing(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) return alert('You must be logged in to use this feature.');

      const formData = new FormData();
      formData.append('file', file);

      const endpoint =
        typeResult === 'text' ? '/api/processTextPDF' : '/api/processImagePDF';

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
        throw new Error('Invalid AI result structure');
      }

      sessionStorage.setItem('openai_json', JSON.stringify(result));
      sessionStorage.setItem('pdf_base64', await fileToBase64(file));

      window.location.href = '/edit';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process file');
    } finally {
      setIsProcessing(false);
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
              className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-zinc-700 rounded-xl bg-zinc-800/50 backdrop-blur-sm hover:border-green-500/50 transition-colors cursor-pointer group"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-10 h-10 mb-3 text-zinc-400 group-hover:text-green-400" />
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
            <div className="w-full max-w-2xl">
              <div className="flex items-center gap-2 mb-2">
                <FileText size={20} className="text-green-400" />
                <span className="text-zinc-300">{file?.name}</span>
              </div>
              <PdfPreviewFrame src={fileUrl} />
            </div>
          )}
        </div>

        {!typeResult && file && (
          <div className="flex justify-center mt-8">
            <DetectTypeButton onClick={handleDetectClick} isDetecting={isDetecting} large />
          </div>
        )}

        {typeResult && (
          <div className="space-y-6 flex flex-col items-center mt-8">
            <div className="flex items-center justify-center gap-2 text-lg">
              <span className="text-zinc-400">Detected type:</span>
              <span className="px-3 py-1 bg-zinc-800 rounded-lg text-green-400 font-medium">
                {typeResult}
              </span>
            </div>
            <ProcessAIButton
              onClick={handleProcessWithOpenAI}
              isProcessing={isProcessing}
              large
            />
          </div>
        )}
      </div>
    </main>
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
