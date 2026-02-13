import { NextRequest, NextResponse } from 'next/server';
import { getAuthHeader, proxyToPrivacyApi, parseJsonResponse } from '@/lib/api-utils';
import { handleApiError } from '@/lib/errors';
import { rateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import type { TimeEstimationResponse } from '@/app/types/api';

export async function POST(request: NextRequest) {
  const rateLimitResult = rateLimit(request, { limit: 30, interval: 60000 });
  if (!rateLimitResult.success && rateLimitResult.response) {
    return rateLimitResult.response;
  }

  try {
    getAuthHeader(request);

    const formData = await request.formData();

    const response = await proxyToPrivacyApi('/estimate-time', {
      method: 'POST',
      body: formData,
    });

    const result = await parseJsonResponse<TimeEstimationResponse>(response);
    return NextResponse.json(result);

  } catch (error) {
    logger.error('Time estimation proxy error', error);
    return handleApiError(error);
  }
}
