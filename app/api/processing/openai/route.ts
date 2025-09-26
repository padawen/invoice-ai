import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import type { ChatCompletionContentPart } from 'openai/resources/chat/completions';
import { getGuidelinesText, getGuidelinesImage } from '@/lib/instructions';
import { createSupabaseClient } from '@/lib/supabase-server';
import { formatDateForInput } from '@/app/utils/dateFormatter';
import { updateProgress } from '../utils/progress';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { chromium } from 'playwright';

declare global {
  interface Window {
    pdfRendered?: boolean;
    pdfError?: Error | string;
  }
}

const fileFromBuffer = (
  buffer: Buffer,
  filename: string,
  contentType = 'application/pdf'
): File => new File([buffer], filename, { type: contentType });

export async function POST(request: NextRequest) {
  try {
    // Get the authorization header from the original request
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify token
    const token = authHeader.replace('Bearer ', '');
    const supabase = createSupabaseClient(token);
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Generate a unique job ID
    const jobId = `openai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Get the form data from the request
    const formData = await request.formData();
    const processingType = formData.get('processingType') as 'text' | 'image' || 'text';

    // Start processing in background
    processOpenAIInvoice(jobId, formData, processingType);

    // Return job ID immediately
    return NextResponse.json({
      jobId,
      message: 'Processing started. Connect to SSE endpoint for progress updates.',
      progressUrl: `/api/processing/${jobId}/progress`
    });

  } catch (error) {
    console.error('OpenAI processing error:', error);
    return NextResponse.json(
      {
        error: 'Failed to start processing',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function processOpenAIInvoice(jobId: string, formData: FormData, processingType: 'text' | 'image') {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
    });

    if (!process.env.OPENAI_API_KEY) {
      updateProgress(jobId, 'error', 100, 'Configuration error', 'OpenAI API key is not configured');
      return;
    }

    const file = formData.get('file') as File | null;
    if (!file) {
      updateProgress(jobId, 'error', 100, 'No file provided', 'File is required for processing');
      return;
    }

    updateProgress(jobId, 'uploading', 10, 'Uploading file to OpenAI...');

    console.log('OpenAI processing type:', processingType);
    console.log('Starting OpenAI processing for job:', jobId);

    const buffer = Buffer.from(await file.arrayBuffer());

    if (buffer.length === 0) {
      updateProgress(jobId, 'error', 100, 'File error', 'Uploaded file is empty');
      return;
    }

    if (buffer.length > 50 * 1024 * 1024) {
      updateProgress(jobId, 'error', 100, 'File error', 'File too large (max 50MB)');
      return;
    }

    let result;

    if (processingType === 'text') {
      result = await processTextPDF(openai, buffer, jobId);
    } else {
      result = await processImagePDF(openai, buffer, jobId);
    }

    updateProgress(jobId, 'finalizing', 90, 'Formatting results...');

    // Format dates
    if (result.issue_date) {
      result.issue_date = formatDateForInput(result.issue_date);
    }
    if (result.due_date) {
      result.due_date = formatDateForInput(result.due_date);
    }
    if (result.fulfillment_date) {
      result.fulfillment_date = formatDateForInput(result.fulfillment_date);
    }

    updateProgress(jobId, 'completed', 100, 'Processing completed successfully!', undefined, true);

    // Store the result for retrieval
    global.processingResults = global.processingResults || {};
    global.processingResults[jobId] = result;

  } catch (error) {
    console.error('OpenAI processing error:', error);

    // More specific error messages
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        updateProgress(jobId, 'error', 100, 'Authentication failed', 'OpenAI API key is invalid or missing');
        return;
      }
      if (error.message.includes('rate limit')) {
        updateProgress(jobId, 'error', 100, 'Rate limit exceeded', 'OpenAI API rate limit reached. Please try again later.');
        return;
      }
      if (error.message.includes('timeout')) {
        updateProgress(jobId, 'error', 100, 'Request timed out', 'OpenAI API request timed out. Please try again.');
        return;
      }
    }

    updateProgress(jobId, 'error', 100, 'Processing failed', error instanceof Error ? error.message : 'Unknown error');
  }
}

async function processTextPDF(openai: OpenAI, buffer: Buffer, jobId: string) {
  updateProgress(jobId, 'processing', 25, 'Creating OpenAI assistant...');

  const uploadedFile = await openai.files.create({
    file: fileFromBuffer(buffer, 'invoice.pdf'),
    purpose: 'assistants',
  });

  updateProgress(jobId, 'processing', 35, 'Setting up AI assistant...');

  const assistant = await openai.beta.assistants.create({
    name: 'PDF Assistant',
    model: 'gpt-4o',
    instructions: 'You are an invoice reader chatbot. Output a structured JSON object.',
    tools: [{ type: 'file_search' }],
  });

  const thread = await openai.beta.threads.create();

  updateProgress(jobId, 'processing', 45, 'Uploading document to assistant...');

  await openai.beta.threads.messages.create(thread.id, {
    role: 'user',
    content: getGuidelinesText(),
    attachments: [
      {
        file_id: uploadedFile.id,
        tools: [{ type: 'file_search' }],
      },
    ],
  });

  updateProgress(jobId, 'processing', 55, 'Starting AI analysis...');

  const run = await openai.beta.threads.runs.create(thread.id, {
    assistant_id: assistant.id,
  });

  let result;
  let attempts = 0;
  const maxAttempts = 15;

  while (attempts < maxAttempts) {
    const status = await openai.beta.threads.runs.retrieve(thread.id, run.id);

    // Update progress based on attempts
    const progressValue = Math.min(55 + (attempts * 2), 85);
    updateProgress(jobId, 'processing', progressValue, 'AI is analyzing the document...');

    if (status.status === 'completed') {
      result = await openai.beta.threads.messages.list(thread.id);
      break;
    }

    if (status.status === 'failed') {
      console.error('OpenAI run failed:', status.last_error);
      throw new Error(`OpenAI processing failed: ${status.last_error?.message || 'Unknown error'}`);
    }

    await new Promise((res) => setTimeout(res, 1000));
    attempts++;
  }

  if (!result) {
    throw new Error('Timed out waiting for OpenAI to respond');
  }

  const msg = result.data[0]?.content.find(
    (c) => c.type === 'text'
  ) as { type: 'text'; text: { value: string } } | undefined;

  if (!msg?.text?.value) {
    console.error('No valid message returned from assistant');
    throw new Error('No valid message returned from assistant');
  }

  const raw = msg.text.value;

  const tryExtractJson = (text: string): unknown => {
    const match = text.match(/{[\s\S]*}/);
    if (!match) {
      console.error('No JSON object found in response:', text);
      throw new Error('No JSON object found in assistant response');
    }
    try {
      const parsed = JSON.parse(match[0]);
      return parsed;
    } catch (err) {
      console.error('JSON parsing failed:', err);
      console.error('Attempted to parse:', match[0]);
      throw new Error(`Failed to parse JSON: ${(err as Error).message}`);
    }
  };

  const parsed = tryExtractJson(raw);

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Parsed result is not a valid object');
  }

  const result_obj = parsed as {
    seller?: unknown;
    buyer?: unknown;
    invoice_data?: unknown;
    issue_date?: string;
    due_date?: string;
    fulfillment_date?: string;
  };

  if (!result_obj.seller || !result_obj.buyer || !Array.isArray(result_obj.invoice_data)) {
    console.warn('Missing required fields in parsed result:', {
      hasSeller: !!result_obj.seller,
      hasBuyer: !!result_obj.buyer,
      hasInvoiceData: Array.isArray(result_obj.invoice_data)
    });
  }

  return result_obj;
}

async function processImagePDF(openai: OpenAI, buffer: Buffer, jobId: string) {
  updateProgress(jobId, 'processing', 25, 'Converting PDF to images...');

  const imagePaths = await convertPdfToImages(buffer);

  if (!imagePaths.length) {
    throw new Error('No images extracted from PDF - the PDF might be corrupted or contain no convertible pages');
  }

  updateProgress(jobId, 'processing', 45, 'Preparing images for AI analysis...');

  // Verify images exist and are valid
  for (const imagePath of imagePaths) {
    if (!fs.existsSync(imagePath)) {
      throw new Error(`Generated image file does not exist: ${imagePath}`);
    }
    const stats = fs.statSync(imagePath);
    if (stats.size === 0) {
      throw new Error(`Generated image file is empty: ${imagePath}`);
    }
  }

  const content: ChatCompletionContentPart[] = [
    { type: 'text', text: getGuidelinesImage() },
    ...imagePaths.map(
      (p): ChatCompletionContentPart => {
        const { base64, mimeType } = encodeImageToBase64(p);
        return {
          type: 'image_url',
          image_url: { url: `data:${mimeType};base64,${base64}` },
        };
      }
    ),
  ];

  updateProgress(jobId, 'processing', 65, 'Analyzing images with AI...');

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content }],
  });

  // Cleanup temp files
  cleanupTempFiles(imagePaths);

  if (!response.choices || response.choices.length === 0) {
    throw new Error('No response choices returned from OpenAI API');
  }

  const responseText = response.choices[0].message?.content ?? '';

  if (!responseText || responseText.trim().length === 0) {
    throw new Error('Empty response received from OpenAI API');
  }

  let cleanedResponse = responseText;

  if (cleanedResponse.startsWith('```json') && cleanedResponse.endsWith('```')) {
    cleanedResponse = cleanedResponse.slice(7, -3).trim();
  } else if (cleanedResponse.startsWith('```') && cleanedResponse.endsWith('```')) {
    cleanedResponse = cleanedResponse.slice(3, -3).trim();
  }

  const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No valid JSON found in OpenAI response');
  }

  try {
    const jsonStr = jsonMatch[0];
    const parsed = JSON.parse(jsonStr);

    if (!parsed.seller || !parsed.buyer || !Array.isArray(parsed.invoice_data)) {
      throw new Error('OpenAI response missing required fields (seller, buyer, or invoice_data)');
    }

    return { id: crypto.randomUUID(), ...parsed };
  } catch (parseError) {
    throw new Error(`Failed to parse JSON from OpenAI response: ${(parseError as Error).message}`);
  }
}

// Helper functions for image processing
const convertPdfToImages = async (pdfBuffer: Buffer): Promise<string[]> => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-'));

  try {
    const browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });

    const context = await browser.newContext({
      viewport: { width: 1200, height: 1600 }
    });

    const page = await context.newPage();

    const base64Data = pdfBuffer.toString('base64');

    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
          <style>
            body { margin: 0; padding: 20px; background: white; }
            #pdf-container { width: 100%; }
            canvas { display: block; margin: 20px 0; border: 1px solid #ccc; }
          </style>
        </head>
        <body>
          <div id="pdf-container"></div>
          <script>
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

            async function renderPDF() {
              try {
                const pdfData = atob('${base64Data}');
                const pdf = await pdfjsLib.getDocument({data: pdfData}).promise;
                const container = document.getElementById('pdf-container');

                for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                  const page = await pdf.getPage(pageNum);
                  const viewport = page.getViewport({scale: 2.0});

                  const canvas = document.createElement('canvas');
                  canvas.width = viewport.width;
                  canvas.height = viewport.height;
                  canvas.id = 'page-' + pageNum;

                  const context = canvas.getContext('2d');
                  await page.render({canvasContext: context, viewport: viewport}).promise;

                  container.appendChild(canvas);
                }

                window.pdfRendered = true;
              } catch (error) {
                console.error('PDF rendering error:', error);
                window.pdfError = error;
              }
            }

            renderPDF();
          </script>
        </body>
      </html>
    `);

    await page.waitForFunction(() => window.pdfRendered || window.pdfError, { timeout: 30000 });

    const pdfError = await page.evaluate(() => window.pdfError);
    if (pdfError) {
      throw new Error(`PDF rendering failed: ${pdfError}`);
    }

    const canvasElements = await page.$$('canvas');
    const imagePaths: string[] = [];

    for (let i = 0; i < canvasElements.length; i++) {
      try {
        await canvasElements[i].screenshot({
          type: 'png',
          path: path.join(tempDir, `page-${i + 1}.png`)
        });
        imagePaths.push(path.join(tempDir, `page-${i + 1}.png`));
      } catch (error) {
        console.warn('Failed to screenshot canvas, skipping:', error);
        continue;
      }
    }

    await browser.close();

    if (imagePaths.length === 0) {
      throw new Error('No images were generated from the PDF');
    }

    return imagePaths;

  } catch (error) {
    console.error('PDF processing error:', error);
    throw error;
  }
};

const encodeImageToBase64 = (imagePath: string): { base64: string; mimeType: string } => {
  const imageBuffer = fs.readFileSync(imagePath);
  const base64 = imageBuffer.toString('base64');

  const ext = path.extname(imagePath).toLowerCase();
  let mimeType = 'image/png';

  switch (ext) {
    case '.jpg':
    case '.jpeg':
      mimeType = 'image/jpeg';
      break;
    case '.png':
      mimeType = 'image/png';
      break;
    case '.gif':
      mimeType = 'image/gif';
      break;
    case '.webp':
      mimeType = 'image/webp';
      break;
  }

  return { base64, mimeType };
};

const cleanupTempFiles = (paths: string[]) => {
  if (!paths || paths.length === 0) return;

  const dir = path.dirname(paths[0]);

  const isTempDir = dir.includes('tmp') ||
                   dir.includes('temp') ||
                   dir.includes('Temp') ||
                   dir.includes('AppData\\Local\\Temp') ||
                   dir.includes('AppData/Local/Temp');

  if (!isTempDir) {
    return;
  }

  try {
    paths.forEach((p) => {
      if (fs.existsSync(p)) {
        fs.unlinkSync(p);
      }
    });

    if (fs.existsSync(dir)) {
      const remainingFiles = fs.readdirSync(dir);
      if (remainingFiles.length === 0) {
        fs.rmdirSync(dir);
      }
    }
  } catch {
  }
};

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