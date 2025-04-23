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
    <iframe
      src={src}
      className="w-full h-[500px] border border-zinc-700 rounded shadow-lg"
    />
  );
};

export default PdfPreviewFrame;
