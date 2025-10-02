import { NextRequest } from 'next/server';

const PRIVACY_API_URL = process.env.PRIVACY_API_URL || 'http://localhost:5000';
const PRIVACY_API_KEY = process.env.PRIVACY_API_KEY || '';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;

  // Get auth token from query param (EventSource doesn't support headers)
  const authToken = request.nextUrl.searchParams.get('auth') || '';

  console.log('[SSE-API] GET request received for jobId:', jobId);
  console.log('[SSE-API] Auth token present:', !!authToken);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      console.log('[SSE-API] Stream started for jobId:', jobId);
      let isActive = true;

      const sendEvent = (event: string, data: unknown) => {
        if (!isActive) return;
        console.log('[SSE-API] Sending event:', event, 'data:', data);
        const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(message));
      };

      const pollProgress = async () => {
        try {
          const headers: Record<string, string> = {
            'x-api-key': PRIVACY_API_KEY,
          };

          // Add auth token if provided
          if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
          }

          console.log('[SSE-API] Polling progress for jobId:', jobId);
          const response = await fetch(`${PRIVACY_API_URL}/progress/${jobId}`, {
            headers,
          });

          console.log('[SSE-API] Progress API response status:', response.status);

          if (!response.ok) {
            throw new Error(`Failed to fetch progress: ${response.status}`);
          }

          const data = await response.json();
          console.log('[SSE-API] Progress data:', data);

          // Send progress update
          sendEvent('progress', {
            progress: data.progress,
            stage: data.stage,
            message: data.message,
            status: data.status
          });

          // Check if completed or error
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

      // Poll every second
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

      // Initial poll
      await pollProgress();

      // Cleanup on connection close
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
