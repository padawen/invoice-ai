import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;

    // Get the authorization header from the original request
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      console.log('No auth header provided');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the privacy API configuration from environment
    const privacyApiBaseUrl = process.env.PRIVACY_API_URL;
    const privacyApiKey = process.env.PRIVACY_API_KEY;

    console.log('Privacy API URL:', privacyApiBaseUrl);

    if (!privacyApiBaseUrl) {
      return NextResponse.json({ error: 'Privacy API URL not configured' }, { status: 500 });
    }

    const privacyApiUrl = `${privacyApiBaseUrl}/progress/${jobId}`;
    console.log('Calling privacy API at:', privacyApiUrl);

    // Prepare headers with API key authentication
    const headers: HeadersInit = {};
    if (privacyApiKey) {
      headers['Authorization'] = `Bearer ${privacyApiKey}`;
    }

    // Forward the request to the privacy API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(privacyApiUrl, {
      method: 'GET',
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Privacy API progress check failed:', response.status, errorText);
      return NextResponse.json(
        { error: `Progress check failed: ${errorText}` },
        { status: response.status }
      );
    }

    const result = await response.json();
    console.log('Privacy API response:', result);
    return NextResponse.json(result);

  } catch (error) {
    console.error('Progress proxy error:', error);

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return NextResponse.json(
          {
            error: 'Progress check request timed out',
            details: 'Request to privacy API timed out after 10 seconds'
          },
          { status: 504 }
        );
      }
      if (error.message.includes('ECONNREFUSED')) {
        return NextResponse.json(
          {
            error: 'Cannot connect to privacy API for progress check.',
            details: 'ECONNREFUSED - Connection refused by target server',
            url: process.env.PRIVACY_API_URL || 'Environment variable not set'
          },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      {
        error: 'Failed to check progress',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}