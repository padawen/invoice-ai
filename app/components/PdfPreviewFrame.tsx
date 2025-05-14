'use client';

interface Props {
  src: string | null | undefined;
}

const PdfPreviewFrame = ({ src }: Props) => {
  if (!src || src.trim() === '') {
    return (
      <div className="h-[500px] w-full flex items-center justify-center text-zinc-500 border border-zinc-700 rounded shadow">
        No PDF selected
      </div>
    );
  }

  return (
    <object
      data={src}
      type="application/pdf"
      className="w-full h-[500px] border border-zinc-700 rounded shadow-lg"
    >
      <embed src={src} type="application/pdf" className="w-full h-[500px]" />
      <p>This browser does not support embedded PDFs. Please <a href={src} target="_blank" rel="noopener noreferrer">click here to download the PDF</a>.</p>
    </object>
  );
};

export default PdfPreviewFrame;
