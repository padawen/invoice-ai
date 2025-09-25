import { NextRequest, NextResponse } from 'next/server';

const EXCLUDED_FORWARD_HEADERS = new Set(['host', 'connection', 'content-length', 'accept-encoding']);
const RESPONSE_FORWARD_HEADERS = ['content-type', 'content-disposition', 'cache-control'] as const;
const REQUEST_TIMEOUT_MS = 60_000;

export const runtime = 'nodejs';
export const maxDuration = 60;
export const maxBodySize = '50mb';

function buildTargetUrl(path: string): string {
  const base = process.env.PRIVACY_API_TARGET;

  if (!base) {
    throw new Error('PRIVACY_API_TARGET environment variable is not configured');
  }

  return `${base.replace(/\/+$/, '')}${path}`;
}

function filterRequestHeaders(source: Headers, skipContentType = false): Headers {
  const headers = new Headers();

  source.forEach((value, key) => {
    const lowerKey = key.toLowerCase();

    if (EXCLUDED_FORWARD_HEADERS.has(lowerKey)) {
      return;
    }

    if (skipContentType && lowerKey === 'content-type') {
      return;
    }

    headers.set(key, value);
  });

  return headers;
}

function jsonErrorResponse(status: number, message: string): NextResponse {
  return NextResponse.json({ ok: false, status, message }, { status });
}

async function readUpstreamError(response: Response): Promise<string> {
  const contentType = response.headers.get('content-type') ?? '';

  try {
    if (contentType.includes('application/json')) {
      const body = await response.json();
      return typeof body === 'string' ? body : JSON.stringify(body);
    }

    return await response.text();
  } catch (error) {
    return error instanceof Error ? error.message : 'Failed to read upstream error response';
  }
}

export async function POST(request: NextRequest) {
  let targetUrl: string;

  try {
    targetUrl = buildTargetUrl('/process-invoice');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown configuration error';
    console.error('POST proxy error:', message);
    return jsonErrorResponse(500, message);
  }

  const contentType = request.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');
  const isMultipart = contentType.startsWith('multipart/form-data');

  const headers = filterRequestHeaders(request.headers, isMultipart);

  let body: BodyInit | null = null;

  try {
    if (isJson) {
      body = await request.text();
      headers.set('content-type', 'application/json');
    } else if (isMultipart) {
      const formData = await request.formData();
      body = formData;
      headers.delete('content-type');
    } else if (request.body) {
      body = request.body as unknown as BodyInit;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to read request body';
    console.error(`POST ${targetUrl} body parse error:`, message);
    return jsonErrorResponse(400, message);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const upstreamResponse = await fetch(targetUrl, {
      method: 'POST',
      headers,
      body: body ?? undefined,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!upstreamResponse.ok) {
      const errorMessage = await readUpstreamError(upstreamResponse);
      console.error(`POST ${targetUrl} upstream error:`, errorMessage);
      return jsonErrorResponse(upstreamResponse.status, errorMessage || upstreamResponse.statusText);
    }

    const upstreamContentType = upstreamResponse.headers.get('content-type') ?? '';

    if (upstreamContentType.includes('application/json')) {
      const data = await upstreamResponse.json();
      return NextResponse.json(data, { status: upstreamResponse.status });
    }

    const responseHeaders = new Headers();
    for (const header of RESPONSE_FORWARD_HEADERS) {
      const value = upstreamResponse.headers.get(header);
      if (value) {
        responseHeaders.set(header, value);
      }
    }

    return new NextResponse(upstreamResponse.body, {
      status: upstreamResponse.status,
      headers: responseHeaders,
    });
  } catch (error) {
    clearTimeout(timeout);

    const isAbortError = error instanceof Error && error.name === 'AbortError';
    const status = isAbortError ? 504 : 502;
    const message = error instanceof Error ? error.message : 'Unknown proxy error';

    console.error(`POST ${targetUrl} proxy failure:`, message);

    return jsonErrorResponse(status, message);
  }
}
