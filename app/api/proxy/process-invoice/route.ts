import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();

    const privacyApiBaseUrl = process.env.PRIVACY_API_URL;
    const privacyApiKey = process.env.PRIVACY_API_KEY;

    if (!privacyApiBaseUrl) {
      return NextResponse.json({ error: 'Privacy API URL not configured' }, { status: 500 });
    }
    const privacyApiUrl = `${privacyApiBaseUrl}/process-invoice`;

    const headers: HeadersInit = {};
    if (privacyApiKey) {
      headers['Authorization'] = `Bearer ${privacyApiKey}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 350000);

    const response = await fetch(privacyApiUrl, {
      method: 'POST',
      headers,
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Privacy API responded with error:', response.status, errorText);
      return NextResponse.json(
        { error: `Privacy API error: ${errorText}` },
        { status: response.status }
      );
    }

    const result = await response.json();

    if (result._processing_metadata) {
      result._processing_metadata.privacy_service = true;
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Proxy error:', error);

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return NextResponse.json(
          { error: 'Privacy API request timed out after 350 seconds.' },
          { status: 504 }
        );
      }
      if (error.message.includes('ECONNREFUSED')) {
        return NextResponse.json(
          {
            error: 'Cannot connect to privacy API. Please check if the service is running.',
            details: 'ECONNREFUSED - Connection refused by target server',
            url: process.env.PRIVACY_API_URL || 'Environment variable not set'
          },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      {
        error: 'Failed to process request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}