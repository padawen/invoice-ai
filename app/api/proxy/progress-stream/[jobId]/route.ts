import { NextRequest } from 'next/server';
import { serverEnv } from '@/lib/env';

const PRIVACY_API_URL = serverEnv.privacyApiUrl || 'http://localhost:5000';
const PRIVACY_API_KEY = process.env.PRIVACY_API_KEY || '';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;

  const authToken = request.nextUrl.searchParams.get('auth') || '';

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let isActive = true;

      const sendEvent = (event: string, data: unknown) => {
        if (!isActive) return;
        const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(message));
      };

      const pollProgress = async () => {
        try {
          const headers: Record<string, string> = {
            'x-api-key': PRIVACY_API_KEY,
          };

          if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
          }

          const response = await fetch(`${PRIVACY_API_URL}/progress/${jobId}`, {
            headers,
          });

          if (!response.ok) {
            throw new Error(`Failed to fetch progress: ${response.status}`);
          }

          const data = await response.json();

          sendEvent('progress', {
            progress: data.progress,
            stage: data.stage,
            message: data.message,
            status: data.status
          });

          if (data.status === 'completed') {
            sendEvent('complete', {
              result: data.result
            });
            isActive = false;
            controller.close();
            return true;
          } else if (data.status === 'error') {
            sendEvent('error', {
              error: data.error || 'Processing failed'
            });
            isActive = false;
            controller.close();
            return true;
          }

          return false;
        } catch (error) {
          sendEvent('error', {
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          isActive = false;
          controller.close();
          return true;
        }
      };

      const intervalId = setInterval(async () => {
        if (!isActive) {
          clearInterval(intervalId);
          return;
        }
        const shouldStop = await pollProgress();
        if (shouldStop) {
          clearInterval(intervalId);
        }
      }, 1000);

      await pollProgress();

      request.signal.addEventListener('abort', () => {
        isActive = false;
        clearInterval(intervalId);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
