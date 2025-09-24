import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const DEFAULT_MAX_FILE_MB = 20;
const REQUEST_TIMEOUT_MS = 180_000;

export async function POST(request: NextRequest) {
  const serviceUrl = process.env.OCR_SERVICE_URL;
  if (!serviceUrl) {
    return NextResponse.json({ ok: false, error: 'ocr_service_unconfigured' }, { status: 500 });
  }

  const formData = await request.formData();
  const file = formData.get('file');

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ ok: false, error: 'file_missing' }, { status: 400 });
  }

  if (file.size === 0) {
    return NextResponse.json({ ok: false, error: 'file_empty' }, { status: 400 });
  }

  const maxFileMb = Number(process.env.OCR_MAX_FILE_MB ?? DEFAULT_MAX_FILE_MB);
  const maxBytes = maxFileMb * 1024 * 1024;
  if (Number.isFinite(maxBytes) && file.size > maxBytes) {
    return NextResponse.json(
      { ok: false, error: 'file_too_large', details: { limit_mb: maxFileMb } },
      { status: 400 }
    );
  }

  const forwardFormData = new FormData();
  forwardFormData.append('file', file);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let upstreamResponse: Response;
  try {
    const normalizedUrl = serviceUrl.endsWith('/') ? serviceUrl.slice(0, -1) : serviceUrl;
    upstreamResponse = await fetch(`${normalizedUrl}/ocr/pdf`, {
      method: 'POST',
      body: forwardFormData,
      signal: controller.signal,
    });
  } catch (error) {
    clearTimeout(timeout);
    if ((error as Error).name === 'AbortError') {
      return NextResponse.json({ ok: false, error: 'ocr_timeout' }, { status: 504 });
    }

    return NextResponse.json({ ok: false, error: 'ocr_failed', details: { message: String(error) } }, { status: 502 });
  } finally {
    clearTimeout(timeout);
  }

  const contentType = upstreamResponse.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');

  if (!upstreamResponse.ok) {
    if (isJson) {
      const payload = await upstreamResponse.json();
      return NextResponse.json(payload, { status: upstreamResponse.status });
    }

    const message = await upstreamResponse.text();
    return NextResponse.json(
      { ok: false, error: 'ocr_failed', details: { status: upstreamResponse.status, message } },
      { status: upstreamResponse.status }
    );
  }

  if (isJson) {
    const payload = await upstreamResponse.json();
    return NextResponse.json(payload, { status: upstreamResponse.status });
  }

  return NextResponse.json(
    { ok: false, error: 'invalid_response', details: { message: 'OCR service did not return JSON' } },
    { status: 502 }
  );
}
