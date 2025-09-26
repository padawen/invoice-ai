import { NextRequest, NextResponse } from 'next/server';
import { updateProgress } from '../utils/progress';

export async function POST(request: NextRequest) {
  try {
    // Get the authorization header from the original request
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Generate a unique job ID
    const jobId = `privacy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Get the form data from the request
    const formData = await request.formData();

    // Start processing in background
    processPrivacyInvoice(jobId, formData);

    // Return job ID immediately
    return NextResponse.json({
      jobId,
      message: 'Processing started. Connect to SSE endpoint for progress updates.',
      progressUrl: `/api/processing/${jobId}/progress`
    });

  } catch (error) {
    console.error('Privacy processing error:', error);
    return NextResponse.json(
      {
        error: 'Failed to start processing',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function processPrivacyInvoice(jobId: string, formData: FormData) {
  try {
    // Get the privacy API URL from environment
    const privacyApiUrl = process.env.PRIVACY_API_URL || 'http://localhost:5000/process-invoice';

    updateProgress(jobId, 'uploading', 10, 'Uploading file to privacy service...');

    console.log('Privacy API URL:', privacyApiUrl);
    console.log('Starting privacy processing for job:', jobId);

    updateProgress(jobId, 'processing', 20, 'Starting OCR text extraction...');

    // Forward the request to the privacy API with extended timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minute timeout

    const response = await fetch(privacyApiUrl, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    updateProgress(jobId, 'processing', 60, 'Processing with local LLM...');

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Privacy API responded with error:', response.status, errorText);
      updateProgress(jobId, 'error', 100, 'Privacy API error', `Privacy API error: ${errorText}`);
      return;
    }

    updateProgress(jobId, 'finalizing', 90, 'Formatting results...');

    const result = await response.json();
    console.log('Privacy API responded successfully');

    updateProgress(jobId, 'completed', 100, 'Processing completed successfully!', undefined, true);

    // Store the result for retrieval
    // Note: In production, you'd store this in a database or Redis
    global.processingResults = global.processingResults || {};
    global.processingResults[jobId] = result;

  } catch (error) {
    console.error('Privacy processing error:', error);

    // More specific error messages
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        updateProgress(jobId, 'error', 100, 'Request timed out', 'Privacy API request timed out (5min). The service might be overloaded or down.');
        return;
      }
      if (error.message.includes('ECONNREFUSED')) {
        updateProgress(jobId, 'error', 100, 'Connection failed', 'Cannot connect to privacy API. Please check if the service is running.');
        return;
      }
    }

    updateProgress(jobId, 'error', 100, 'Processing failed', error instanceof Error ? error.message : 'Unknown error');
  }
}

// Endpoint to get final results
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const jobId = url.searchParams.get('jobId');

  if (!jobId) {
    return NextResponse.json({ error: 'Job ID required' }, { status: 400 });
  }

  const results = global.processingResults?.[jobId];
  if (!results) {
    return NextResponse.json({ error: 'Results not found or expired' }, { status: 404 });
  }

  // Clean up the result after retrieval
  delete global.processingResults![jobId];

  return NextResponse.json(results);
}