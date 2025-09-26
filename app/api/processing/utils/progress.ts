// Store active progress streams
const progressStreams = new Map<string, ReadableStreamDefaultController<string>>();
const progressData = new Map<string, { step: string; progress: number; details?: string; error?: string; completed?: boolean }>();

export function getProgressStreams() {
  return progressStreams;
}

export function getProgressData() {
  return progressData;
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