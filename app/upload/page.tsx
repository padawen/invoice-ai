'use client';

import React, { useState, useEffect } from 'react';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import PdfPreviewFrame from '../components/PdfPreviewFrame';
import DetectTypeButton from '../components/DetectTypeButton';
import ProcessAIButton from '../components/ProcessAIButton';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import { useUser } from '@supabase/auth-helpers-react';

// Helper to convert file to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export default function UploadPage() {
  const user = useUser();
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [typeResult, setTypeResult] = useState<string | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createSupabaseBrowserClient();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    setError(null);
    
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      // Create a blob URL for preview
      const blobUrl = URL.createObjectURL(selectedFile);
      setFileUrl(blobUrl);
      setTypeResult(null);
    } else {
      setError('Please upload a valid PDF file!');
    }
  };

  const handleDetectClick = async () => {
    if (!file) {
      setError('No file selected');
      return;
    }
    setIsDetecting(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        alert('You must be logged in to use this feature.');
        return;
      }

      const formData = new FormData();
      formData.append('file', file);

      const detectRes = await fetch('/api/detectType', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      const detectData = await detectRes.json();
      setTypeResult(detectData.type || 'unknown');
    } catch {
      setError('An error occurred while detecting the file type');
    } finally {
      setIsDetecting(false);
    }
  };

  const handleProcessWithOpenAI = async () => {
    if (!file || !typeResult) {
      setError('No file or type detected');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        alert('You must be logged in to use this feature.');
        return;
      }

      const formData = new FormData();
      formData.append('file', file);

      const endpoint =
        typeResult === 'text' ? '/api/processTextPDF' : '/api/processImagePDF';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await res.json();

      // Store the file and result in sessionStorage
      sessionStorage.setItem('openai_json', JSON.stringify(result));
      // Store the file as base64
      const base64 = await fileToBase64(file);
      sessionStorage.setItem('pdf_base64', base64);

      window.location.href = '/edit';
    } catch (error) {
      console.error('Error uploading file:', error);
      setError(error instanceof Error ? error.message : 'Failed to upload file');
      setIsProcessing(false);
    }
  };

  // Cleanup blob URL when component unmounts
  useEffect(() => {
    return () => {
      if (fileUrl) {
        URL.revokeObjectURL(fileUrl);
      }
    };
  }, [fileUrl]);

  if (!user) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-zinc-900 via-black to-zinc-800 text-white flex flex-col items-center justify-center">
        <div className="bg-zinc-900/80 rounded-2xl shadow-2xl p-10 border border-zinc-800 backdrop-blur-md flex flex-col items-center gap-6">
          <h1 className="text-3xl font-bold text-green-400 mb-2">Login Required</h1>
          <p className="text-zinc-400 text-lg mb-4">You must be logged in to upload and process invoices.</p>
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
          <p className="text-zinc-400 text-lg">
            Upload your invoice and let our AI process it for you
          </p>
        </div>

        <div className="flex flex-col items-center gap-6">
          <div className="w-full max-w-md">
            <label
              htmlFor="file-upload"
              className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-zinc-700 rounded-xl bg-zinc-800/50 backdrop-blur-sm hover:border-green-500/50 transition-colors cursor-pointer group"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-10 h-10 mb-3 text-zinc-400 group-hover:text-green-400 transition-colors" />
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
            <div className="flex justify-center">
              <ProcessAIButton
                onClick={handleProcessWithOpenAI}
                isProcessing={isProcessing}
                large
              />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
