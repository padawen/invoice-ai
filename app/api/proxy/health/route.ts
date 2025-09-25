import { NextResponse } from 'next/server';

const REQUEST_TIMEOUT_MS = 10_000;

export const runtime = 'nodejs';
export const maxDuration = 10;

function buildTargetUrl(path: string): string {
  const base = process.env.PRIVACY_API_TARGET;

  if (!base) {
    throw new Error('PRIVACY_API_TARGET environment variable is not configured');
  }

  return `${base.replace(/\/+$/, '')}${path}`;
}

function jsonErrorResponse(status: number, message: string): NextResponse {
  return NextResponse.json({ ok: false, status, message }, { status });
}

export async function GET() {
  let targetUrl: string;

  try {
    targetUrl = buildTargetUrl('/health');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown configuration error';
    console.error('GET proxy error:', message);
    return jsonErrorResponse(500, message);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const upstreamResponse = await fetch(targetUrl, {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const contentType = upstreamResponse.headers.get('content-type') ?? '';
    if (!contentType.includes('application/json')) {
      const fallback = await upstreamResponse.text();
      console.error(`GET ${targetUrl} unexpected content-type:`, contentType);
      return jsonErrorResponse(upstreamResponse.status, fallback || 'Upstream returned a non-JSON response');
    }

    const data = await upstreamResponse.json();
    return NextResponse.json(data, { status: upstreamResponse.status });
  } catch (error) {
    clearTimeout(timeout);

    const isAbortError = error instanceof Error && error.name === 'AbortError';
    const status = isAbortError ? 504 : 502;
    const message = error instanceof Error ? error.message : 'Unknown proxy error';

    console.error(`GET ${targetUrl} proxy failure:`, message);

    return jsonErrorResponse(status, message);
  }
}
