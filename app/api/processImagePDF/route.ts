import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import type { ChatCompletionContentPart } from 'openai/resources/chat/completions';
import { getGuidelinesImage } from '@/lib/instructions';
import { createSupabaseClient } from '@/lib/supabase';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { Poppler } from 'node-poppler';

// Init OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Helpers
const getPageCount = async (pdfPath: string): Promise<number> => {
  const poppler = new Poppler();
  const info = await poppler.pdfInfo(pdfPath);
  return typeof info === 'object' && info !== null ? (info as Record<string, number>).pages || 0 : 0;
};

const extractImagesFromPdf = async (pdfBuffer: Buffer): Promise<string[]> => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-'));
  const inputPdfPath = path.join(tempDir, 'input.pdf');
  const poppler = new Poppler();

  fs.writeFileSync(inputPdfPath, pdfBuffer);

  const pageCount = await getPageCount(inputPdfPath);
  if (pageCount > 10) throw new Error('PAGE_LIMIT_EXCEEDED');

  await poppler.pdfToCairo(inputPdfPath, path.join(tempDir, 'page'), {
    pngFile: true,
    resolutionXYAxis: 300,
    singleFile: false,
    firstPageToConvert: 1,
    lastPageToConvert: Math.min(pageCount, 10),
  });

  return fs
    .readdirSync(tempDir)
    .filter(file => file.endsWith('.png'))
    .map(file => path.join(tempDir, file));
};

const encodeImageToBase64 = (imagePath: string): string =>
  fs.readFileSync(imagePath).toString('base64');

const cleanupTempFiles = (paths: string[]) => {
  const dir = path.dirname(paths[0] || '');
  paths.forEach(p => fs.existsSync(p) && fs.unlinkSync(p));
  const inputPdf = path.join(dir, 'input.pdf');
  if (fs.existsSync(inputPdf)) fs.unlinkSync(inputPdf);
  if (fs.existsSync(dir)) fs.rmdirSync(dir);
};

// API Route
export async function POST(req: NextRequest) {
  try {
    // Auth
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    const supabase = createSupabaseClient(token);
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // File Handling
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const imagePaths = await extractImagesFromPdf(buffer);
    if (imagePaths.length === 0) {
      throw new Error('No images extracted from PDF');
    }

    // Construct content for GPT
    const content: ChatCompletionContentPart[] = [
      { type: 'text', text: getGuidelinesImage() },
      ...imagePaths.map(
        (imagePath): ChatCompletionContentPart => ({
          type: 'image_url',
          image_url: {
            url: `data:image/png;base64,${encodeImageToBase64(imagePath)}`,
          },
        })
      ),
    ];

    const openaiResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content }],
    });

    const responseText = openaiResponse.choices[0].message?.content ?? '';
    const jsonStart = responseText.indexOf('{');
    const jsonEnd = responseText.lastIndexOf('}') + 1;

    if (jsonStart === -1 || jsonEnd <= jsonStart) {
      throw new Error('No valid JSON found in OpenAI response');
    }

    const parsed = JSON.parse(responseText.slice(jsonStart, jsonEnd));
    const responseWithId = { id: crypto.randomUUID(), ...parsed };

    // Cleanup
    cleanupTempFiles(imagePaths);

    return NextResponse.json(responseWithId);
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'PAGE_LIMIT_EXCEEDED') {
      return NextResponse.json(
        { error: 'PDF has more than 10 pages', code: 'PAGE_LIMIT_EXCEEDED' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: (err as Error).message || 'Unexpected server error' },
      { status: 500 }
    );
  }
}
