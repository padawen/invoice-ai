import { NextResponse } from 'next/server';
import { config } from '@/lib/config';
import { fetchWithTimeout } from '@/lib/api-utils';
import { handleApiError, ExternalServiceError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import type { HealthCheckResponse } from '@/app/types/api';

export async function GET() {
  try {
    const baseUrl = config.privacy.apiUrl.replace('/process-invoice', '');
    const healthUrl = `${baseUrl}/health`;

    const response = await fetchWithTimeout(healthUrl, {
      method: 'GET',
      timeout: 5000,
    });

    if (!response.ok) {
      throw new ExternalServiceError('Privacy API', `Health check failed with status ${response.status}`);
    }

    const result = await response.json();

    const healthResponse: HealthCheckResponse = {
      status: 'healthy',
      privacyApi: result,
      url: healthUrl,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(healthResponse);

  } catch (error) {
    logger.error('Health check error', error);
    return handleApiError(error);
  }
}