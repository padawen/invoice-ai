'use client';

import { useEffect, useState, useRef } from 'react';

interface PdfPreviewFrameProps {
  src?: string | null;
}

const PdfPreviewFrame = ({ src }: PdfPreviewFrameProps) => {
  const [pages, setPages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!src || src.trim() === '') {
      setPages([]);
      return;
    }

    const renderPdf = async () => {
      setLoading(true);
      setError(null);

      try {
        const pdfjs = await import('pdfjs-dist');
        pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

        // Convert base64 to array buffer
        const base64Data = src.includes(',') ? src.split(',')[1] : src;
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const pdf = await pdfjs.getDocument({ data: bytes }).promise;
        const renderedPages: string[] = [];

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const viewport = page.getViewport({ scale: 1.5 });

          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;

          const context = canvas.getContext('2d');
          if (!context) continue;

          await page.render({
            canvasContext: context,
            viewport: viewport,
            canvas: canvas,
          }).promise;

          renderedPages.push(canvas.toDataURL('image/png'));
          canvas.remove();
        }

        setPages(renderedPages);
      } catch (err) {
        console.error('PDF preview error:', err);
        setError('Failed to load PDF preview');
      } finally {
        setLoading(false);
      }
    };

    renderPdf();
  }, [src]);

  if (!src || src.trim() === '') {
    return (
      <div className="h-full w-full flex items-center justify-center text-zinc-500 border border-zinc-700 rounded shadow-inner bg-zinc-900">
        No PDF selected
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center text-zinc-400 border border-zinc-700 rounded shadow-inner bg-zinc-900">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
          <span>Loading preview...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full w-full flex items-center justify-center text-red-400 border border-zinc-700 rounded shadow-inner bg-zinc-900">
        {error}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full border border-zinc-700 rounded shadow-lg overflow-auto bg-zinc-800"
    >
      <div className="flex flex-col items-center gap-4 p-4">
        {pages.map((pageDataUrl, index) => (
          <img
            key={index}
            src={pageDataUrl}
            alt={`Page ${index + 1}`}
            className="max-w-full shadow-lg rounded"
          />
        ))}
      </div>

      <div className="sticky bottom-4 left-4 inline-block bg-zinc-800/80 backdrop-blur-sm text-zinc-300 px-3 py-1.5 rounded-lg text-sm font-medium shadow-lg ml-4">
        PDF Preview ({pages.length} page{pages.length !== 1 ? 's' : ''})
      </div>
    </div>
  );
};

export default PdfPreviewFrame;
