import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Get the privacy API URL from environment
    const privacyApiUrl = process.env.PRIVACY_API_URL || 'http://localhost:5000';
    const healthUrl = `${privacyApiUrl}/health`;

    // Check if the privacy API is healthy with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(healthUrl, {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return NextResponse.json(
        { status: 'unhealthy', message: 'Privacy API is down' },
        { status: 503 }
      );
    }

    const result = await response.json();
    return NextResponse.json({
      status: 'healthy',
      privacyApi: result,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      { status: 'unhealthy', message: 'Privacy API is unreachable' },
      { status: 503 }
    );
  }
}