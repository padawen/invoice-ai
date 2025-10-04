import { NextRequest, NextResponse } from 'next/server';
import { getAuthHeader, proxyToPrivacyApi, parseJsonResponse } from '@/lib/api-utils';
import { handleApiError } from '@/lib/errors';
import { rateLimit } from '@/lib/rate-limit';
import type { PrivacyProgressData } from '@/app/types/api';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ jobId: string }> }
) {
  const rateLimitResult = rateLimit(request, { limit: 30, interval: 60000 });
  if (!rateLimitResult.success && rateLimitResult.response) {
    return rateLimitResult.response;
  }

  try {
    const { jobId } = await context.params;
    getAuthHeader(request);

    const response = await proxyToPrivacyApi(`/progress/${jobId}`, {
      method: 'GET',
    });

    const result = await parseJsonResponse<PrivacyProgressData>(response);
    return NextResponse.json(result);

  } catch (error) {
    console.error('Progress proxy error:', error);
    return handleApiError(error);
  }
}