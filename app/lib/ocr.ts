'use client';

import type { OcrResponse } from '@/app/types';

const OCR_ENDPOINT = '/api/ocrProcess';
const REQUEST_TIMEOUT_MS = 180_000;

/**
 * Uploads the provided PDF to the OCR proxy route and returns the structured Doctr response.
 * Downstream callers can enrich the invoice editor with the normalized text payload.
 */
export async function runOcr(file: File): Promise<OcrResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(OCR_ENDPOINT, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });

    const payload = (await response.json()) as OcrResponse;
    if (!response.ok || !payload.ok) {
      const error = payload.error ?? 'ocr_failed';
      throw new Error(error);
    }

    return payload;
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      throw new Error('ocr_timeout');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Example integration idea:
 *
 * ```ts
 * import { runOcr } from '@/app/lib/ocr';
 *
 * if (processor === 'doctr') {
 *   const ocrResult = await runOcr(selectedFile);
 *   // TODO: persist ocrResult.normalized or forward it to the invoice parser pipeline.
 * }
 * ```
 *
 * Recommended insertion point: after detectType identifies an image-based PDF in `app/upload/page.tsx`
 * or immediately before invoking `/api/processDoctr` in `processInvoice`.
 */
