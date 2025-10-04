import { NextRequest, NextResponse } from 'next/server';

class RateLimiter {
  private requests: Map<string, number[]> = new Map();

  check(identifier: string, limit: number, interval: number): boolean {
    const now = Date.now();
    const requests = this.requests.get(identifier) || [];

    const recentRequests = requests.filter(time => now - time < interval);

    if (recentRequests.length >= limit) {
      return false;
    }

    recentRequests.push(now);
    this.requests.set(identifier, recentRequests);

    return true;
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, times] of this.requests.entries()) {
      const recent = times.filter(time => now - time < 60000);
      if (recent.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, recent);
      }
    }
  }
}

const limiter = new RateLimiter();

setInterval(() => limiter.cleanup(), 60000);

export function rateLimit(
  request: NextRequest,
  options: { limit?: number; interval?: number } = {}
): { success: boolean; response?: NextResponse } {
  const { limit = 10, interval = 60000 } = options;

  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  const identifier = `${ip}-${request.nextUrl.pathname}`;

  const allowed = limiter.check(identifier, limit, interval);

  if (!allowed) {
    return {
      success: false,
      response: NextResponse.json(
        {
          error: 'Too many requests',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: Math.ceil(interval / 1000),
        },
        { status: 429 }
      ),
    };
  }

  return { success: true };
}

export function withRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>,
  options?: { limit?: number; interval?: number }
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const result = rateLimit(request, options);

    if (!result.success && result.response) {
      return result.response;
    }

    return handler(request);
  };
}
