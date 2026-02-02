'use client';

export interface PdfConversionResult {
    images: string[];
    pageCount: number;
}

export async function convertPdfToImages(
    pdfFile: File,
    scale: number = 2.0,
    maxPages: number = 10
): Promise<PdfConversionResult> {
    const pdfjs = await import('pdfjs-dist');

    pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;

    const pageCount = pdf.numPages;

    if (pageCount > maxPages) {
        throw new Error(`PDF has ${pageCount} pages, maximum allowed is ${maxPages}`);
    }

    const images: string[] = [];

    for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const context = canvas.getContext('2d');
        if (!context) {
            throw new Error('Failed to get canvas 2D context');
        }

        await page.render({
            canvasContext: context,
            viewport: viewport,
            canvas: canvas,
        }).promise;

        const dataUrl = canvas.toDataURL('image/png');
        images.push(dataUrl);

        canvas.remove();
    }

    return { images, pageCount };
}

export function isPdfFile(file: File): boolean {
    return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}
