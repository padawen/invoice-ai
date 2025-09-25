import { NextRequest } from 'next/server';

// Store active progress streams
const progressStreams = new Map<string, ReadableStreamDefaultController<string>>();
const progressData = new Map<string, { step: string; progress: number; details?: string; error?: string; completed?: boolean }>();

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  const jobId = params.jobId;

  const stream = new ReadableStream({
    start(controller) {
      // Store the controller for this job
      progressStreams.set(jobId, controller);

      // Send initial progress if exists
      const currentProgress = progressData.get(jobId);
      if (currentProgress) {
        controller.enqueue(`data: ${JSON.stringify(currentProgress)}\n\n`);
      } else {
        // Send initial state
        controller.enqueue(`data: ${JSON.stringify({
          step: 'initializing',
          progress: 0,
          details: 'Starting processing...'
        })}\n\n`);
      }
    },

    cancel() {
      // Clean up when client disconnects
      progressStreams.delete(jobId);
      progressData.delete(jobId);
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  });
}

// Helper function to update progress (can be called from other API routes)
export function updateProgress(
  jobId: string,
  step: string,
  progress: number,
  details?: string,
  error?: string,
  completed = false
) {
  const progressInfo = { step, progress, details, error, completed };
  progressData.set(jobId, progressInfo);

  const controller = progressStreams.get(jobId);
  if (controller) {
    try {
      controller.enqueue(`data: ${JSON.stringify(progressInfo)}\n\n`);

      // Close stream if completed or error
      if (completed || error) {
        controller.close();
        progressStreams.delete(jobId);
        // Keep data for a bit in case of reconnection
        setTimeout(() => progressData.delete(jobId), 30000);
      }
    } catch {
      // Controller might be closed
      progressStreams.delete(jobId);
    }
  }
}