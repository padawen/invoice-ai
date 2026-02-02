'use client';

interface PdfPreviewFrameProps {
  src?: string | null;
}

const PdfPreviewFrame = ({ src }: PdfPreviewFrameProps) => {
  if (!src || src.trim() === '') {
    return (
      <div className="h-full w-full flex items-center justify-center text-zinc-500 border border-zinc-700 rounded shadow-inner bg-zinc-900">
        No PDF selected
      </div>
    );
  }

  return (
    <div className="relative w-full h-full border border-zinc-700 rounded shadow-lg overflow-hidden">
      <iframe
        src={src}
        className="w-full h-full"
        title="PDF preview"
        style={{ border: 'none' }}
      />

      <div className="absolute bottom-4 left-4 bg-zinc-800/80 backdrop-blur-sm text-zinc-300 px-3 py-1.5 rounded-lg text-sm font-medium shadow-lg">
        PDF Preview
      </div>
    </div>
  );
};

export default PdfPreviewFrame;
