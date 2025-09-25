import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Get the authorization header from the original request
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the form data from the request
    const formData = await request.formData();

    // Get the privacy API URL from environment
    const privacyApiUrl = process.env.PRIVACY_API_URL || 'http://localhost:5000/process-invoice';

    // Forward the request to the privacy API
    const response = await fetch(privacyApiUrl, {
      method: 'POST',
      body: formData,
      // Don't include authorization header as the privacy API doesn't need it
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Privacy API error: ${errorText}` },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);

  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}