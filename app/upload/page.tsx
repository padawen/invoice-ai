'use client';

import { useState } from 'react';
import PdfPreviewFrame from '../components/PdfPreviewFrame';
import DetectTypeButton from '../components/DetectTypeButton';
import ProcessAIButton from '../components/ProcessAIButton';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [filePath, setFilePath] = useState<string | null>(null);
  const [typeResult, setTypeResult] = useState<string | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setFileUrl(URL.createObjectURL(selectedFile));
      setTypeResult(null);
      setFilePath(null);
    } else {
      alert('Please upload a valid PDF file!');
    }
  };

  const handleDetectClick = async () => {
    if (!file) return alert('No file selected');
    setIsDetecting(true);

    const formData = new FormData();
    formData.append('file', file);

    const saveRes = await fetch('/api/saveFile', {
      method: 'POST',
      body: formData,
    });
    const { filePath } = await saveRes.json();
    setFilePath(filePath);

    const detectRes = await fetch('/api/detectType', {
      method: 'POST',
      body: JSON.stringify({ filePath }),
      headers: { 'Content-Type': 'application/json' },
    });
    const detectData = await detectRes.json();
    setTypeResult(detectData.type || 'unknown');

    setIsDetecting(false);
  };

  const handleProcessWithOpenAI = async () => {
    if (!file || !filePath || !typeResult) return alert('No file or type detected');

    setIsProcessing(true);

    const formData = new FormData();
    formData.append('file', file);

    const endpoint =
      typeResult === 'text' ? '/api/processTextPDF' : '/api/processImagePDF';

    const res = await fetch(endpoint, {
      method: 'POST',
      body: formData,
    });

    const result = await res.json();

    localStorage.setItem('openai_json', JSON.stringify(result));
    localStorage.setItem('pdf_url', fileUrl || '');

    window.location.href = '/edit';
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-white py-12 px-4 flex flex-col items-center">
      <div className="w-full max-w-4xl space-y-8">
        <h1 className="text-4xl font-bold text-green-400 text-center">
          Upload Invoice PDF
        </h1>

        <div className="flex flex-col items-center gap-4">
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="file:bg-green-600 file:hover:bg-green-700 file:text-white file:font-semibold file:px-4 file:py-2 file:rounded-lg file:border-0 bg-zinc-800 text-sm text-zinc-300 p-2 rounded w-full max-w-md"
          />

          {fileUrl && <PdfPreviewFrame src={fileUrl} />}
        </div>

        {!typeResult && (
          <div className="text-center">
            <DetectTypeButton onClick={handleDetectClick} isDetecting={isDetecting} />
          </div>
        )}

        {typeResult && (
          <>
            <p className="text-center text-lg">
              <span className="text-zinc-400 mr-2">Detected type:</span>
              <span className="text-white font-medium">{typeResult}</span>
            </p>
            <div className="text-center">
              <ProcessAIButton
                onClick={handleProcessWithOpenAI}
                isProcessing={isProcessing}
              />
            </div>
          </>
        )}
      </div>
    </main>
  );
}
