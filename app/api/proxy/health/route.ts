import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const privacyApiUrl = process.env.PRIVACY_API_URL;

    if (!privacyApiUrl) {
      return NextResponse.json({
        status: 'unhealthy',
        message: 'Privacy API URL not configured'
      }, { status: 500 });
    }

    const baseUrl = privacyApiUrl.replace('/process-invoice', '');
    const healthUrl = `${baseUrl}/health`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(healthUrl, {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return NextResponse.json(
        {
          status: 'unhealthy',
          message: 'Privacy API is down',
          url: healthUrl,
          httpStatus: response.status
        },
        { status: 503 }
      );
    }

    const result = await response.json();
    return NextResponse.json({
      status: 'healthy',
      privacyApi: result,
      url: healthUrl,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Health check error:', error);

    const privacyApiUrl = process.env.PRIVACY_API_URL;
    const baseUrl = privacyApiUrl?.replace('/process-invoice', '') || 'NOT_CONFIGURED';
    const healthUrl = `${baseUrl}/health`;

    return NextResponse.json(
      {
        status: 'unhealthy',
        message: 'Privacy API is unreachable',
        error: error instanceof Error ? error.message : 'Unknown error',
        url: healthUrl,
        envVar: process.env.PRIVACY_API_URL ? 'set' : 'not set'
      },
      { status: 503 }
    );
  }
}