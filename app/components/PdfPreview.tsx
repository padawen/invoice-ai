/* 'use client';

import { Document, Page, pdfjs } from 'react-pdf';
import { useState } from 'react';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';

interface Props {
  fileUrl: string;
}

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@5.1.91/build/pdf.worker.min.js`;

const PdfPreview = ({ fileUrl }: Props) => {
  const [numPages, setNumPages] = useState<number>(0);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  return (
    <div className="w-full h-full overflow-auto">
      <Document file={fileUrl} onLoadSuccess={onDocumentLoadSuccess}>
        {Array.from({ length: numPages }, (_, index) => (
          <Page
            key={`page_${index + 1}`}
            pageNumber={index + 1}
            width={600}
          />
        ))}
      </Document>
    </div>
  );
};

export default PdfPreview;
 */