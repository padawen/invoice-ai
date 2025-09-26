import { NextRequest } from 'next/server';
import { getProgressStreams, getProgressData } from '../../utils/progress';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  const progressStreams = getProgressStreams();
  const progressData = getProgressData();

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

