import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import type { ChatCompletionContentPart } from 'openai/resources/chat/completions';
import { getGuidelines } from '@/lib/instructions';
import { createSupabaseClient } from '@/lib/supabase-server';
import { formatDateForInput } from '@/app/utils/dateFormatter';
import { rateLimit } from '@/lib/rate-limit';
import fs from 'fs';
import path from 'path';
import os from 'os';

declare global {
  interface Window {
    pdfRendered?: boolean;
    pdfError?: Error | string;
  }
}

const convertPdfToImages = async (pdfBuffer: Buffer): Promise<string[]> => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-'));

  try {
    const { pdf } = await import('pdf-to-img');

    const imagePaths: string[] = [];
    let pageNum = 1;

    for await (const image of await pdf(pdfBuffer, { scale: 2.0 })) {
      const imagePath = path.join(tempDir, `page-${pageNum}.png`);
      fs.writeFileSync(imagePath, image);
      imagePaths.push(imagePath);
      pageNum++;
    }

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

export async function POST(req: NextRequest) {
  const rateLimitResult = rateLimit(req, { limit: 5, interval: 60000 });
  if (!rateLimitResult.success && rateLimitResult.response) {
    return rateLimitResult.response;
  }

  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  const supabase = createSupabaseClient(token);
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  let imagePaths: string[] = [];

  try {
    const buffer = Buffer.from(await file.arrayBuffer());

    if (buffer.length === 0) {
      throw new Error('Uploaded file is empty');
    }

    if (buffer.length > 10 * 1024 * 1024) {
      throw new Error('File too large (max 10MB)');
    }

    imagePaths = await convertPdfToImages(buffer);

    if (!imagePaths.length) {
      throw new Error('No images extracted from PDF - the PDF might be corrupted or contain no convertible pages');
    }

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
      { type: 'text', text: getGuidelines() },
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

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key is not configured');
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content }],
    });

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

      if (parsed.issue_date) {
        parsed.issue_date = formatDateForInput(parsed.issue_date);
      }
      if (parsed.due_date) {
        parsed.due_date = formatDateForInput(parsed.due_date);
      }
      if (parsed.fulfillment_date) {
        parsed.fulfillment_date = formatDateForInput(parsed.fulfillment_date);
      }

      const output = { id: crypto.randomUUID(), ...parsed };

      cleanupTempFiles(imagePaths);
      return NextResponse.json(output);
    } catch (parseError) {
      throw new Error(`Failed to parse JSON from OpenAI response: ${(parseError as Error).message}`);
    }
  } catch (_) {
    if (imagePaths && imagePaths.length > 0) {
      cleanupTempFiles(imagePaths);
    }

    const errorMessage = (_ as Error).message || 'Unexpected server error';
    console.error('ProcessImagePDF Error:', {
      message: errorMessage,
      stack: (_ as Error).stack,
      name: (_ as Error).name,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json(
      {
        error: errorMessage,
        fallbackData: {
          id: crypto.randomUUID(),
          seller: { name: '', address: '', tax_id: '', email: '', phone: '' },
          buyer: { name: '', address: '', tax_id: '' },
          invoice_number: '',
          issue_date: '',
          fulfillment_date: '',
          due_date: '',
          payment_method: '',
          currency: 'HUF',
          invoice_data: []
        }
      },
      { status: 500 }
    );
  }
}