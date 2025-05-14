'use client';

interface PdfPreviewFrameProps {
  src?: string | null;
}

const PdfPreviewFrame = ({ src }: PdfPreviewFrameProps) => {
  if (!src || src.trim() === '') {
    return (
      <div className="h-[500px] w-full flex items-center justify-center text-zinc-500 border border-zinc-700 rounded shadow-inner bg-zinc-900">
        No PDF selected
      </div>
    );
  }

  return (
    <div className="w-full h-[500px] border border-zinc-700 rounded shadow-lg overflow-hidden">
      <object
        data={src}
        type="application/pdf"
        className="w-full h-full"
        aria-label="PDF preview"
      >
        <p className="p-4 text-zinc-400 text-sm bg-zinc-900">
          This browser does not support embedded PDFs.{' '}
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-400 underline hover:text-green-300"
          >
            Click here to download the PDF.
          </a>
        </p>
      </object>
    </div>
  );
};

export default PdfPreviewFrame;
