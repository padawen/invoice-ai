import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;

    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const privacyApiBaseUrl = process.env.PRIVACY_API_URL;
    const privacyApiKey = process.env.PRIVACY_API_KEY;

    if (!privacyApiBaseUrl) {
      return NextResponse.json({ error: 'Privacy API URL not configured' }, { status: 500 });
    }

    const privacyApiUrl = `${privacyApiBaseUrl}/cancel-job/${jobId}`;

    const headers: HeadersInit = {};
    if (privacyApiKey) {
      headers['Authorization'] = `Bearer ${privacyApiKey}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(privacyApiUrl, {
      method: 'DELETE',
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Privacy API cancel failed:', response.status, errorText);
      return NextResponse.json(
        { error: `Cancel failed: ${errorText}` },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);

  } catch (error) {
    console.error('Cancel proxy error:', error);

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return NextResponse.json(
          {
            error: 'Cancel request timed out',
            ...(process.env.NODE_ENV === 'development' && {
              details: 'Request to privacy API timed out after 5 seconds'
            })
          },
          { status: 504 }
        );
      }
      if (error.message.includes('ECONNREFUSED')) {
        return NextResponse.json(
          {
            error: 'Cannot connect to privacy API for cancellation.',
            ...(process.env.NODE_ENV === 'development' && {
              details: 'ECONNREFUSED - Connection refused by target server'
            })
          },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      {
        error: 'Failed to cancel job',
        ...(process.env.NODE_ENV === 'development' && {
          details: error instanceof Error ? error.message : 'Unknown error'
        })
      },
      { status: 500 }
    );
  }
}