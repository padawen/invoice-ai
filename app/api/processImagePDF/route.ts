import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import type { ChatCompletionContentPart } from 'openai/resources/chat/completions';
import { getGuidelinesImage } from '@/lib/instructions';
import { createSupabaseClient } from '@/lib/supabase-server';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { Poppler } from 'node-poppler';

const getPageCount = async (pdfPath: string): Promise<number> => {
  const info = await new Poppler().pdfInfo(pdfPath);
  return typeof info === 'object' && info !== null
    ? (info as Record<string, number>).pages || 0
    : 0;
};

const extractImagesFromPdf = async (pdfBuffer: Buffer): Promise<string[]> => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-'));
  const inputPdfPath = path.join(tempDir, 'input.pdf');
  fs.writeFileSync(inputPdfPath, pdfBuffer);

  const pageCount = await getPageCount(inputPdfPath);
  console.log(`PDF has ${pageCount} pages`);
  if (pageCount > 10) throw new Error('PAGE_LIMIT_EXCEEDED');

  // Convert each page to a separate PNG image
  const poppler = new Poppler();
  const outputBaseName = path.join(tempDir, 'page');
  
  console.log(`Converting PDF pages to images in: ${tempDir}`);
  await poppler.pdfToCairo(inputPdfPath, outputBaseName, {
    pngFile: true,
    resolutionXYAxis: 300,
    singleFile: false,
    firstPageToConvert: 1,
    lastPageToConvert: Math.min(pageCount, 10),
  });

  // Get all generated PNG files and sort them by page number
  const allFiles = fs.readdirSync(tempDir);
  console.log(`Files in temp directory after conversion:`, allFiles);
  
  const pngFiles = allFiles
    .filter((f) => f.endsWith('.png'))
    .sort((a, b) => {
      // Extract page numbers from filenames like 'page-1.png', 'page-2.png', etc.
      const pageNumA = parseInt(a.match(/page-(\d+)\.png$/)?.[1] || '0');
      const pageNumB = parseInt(b.match(/page-(\d+)\.png$/)?.[1] || '0');
      return pageNumA - pageNumB;
    })
    .map((f) => path.join(tempDir, f));

  console.log(`Found ${pngFiles.length} PNG files:`, pngFiles.map(p => path.basename(p)));

  // If no PNG files were generated, try alternative approach
  if (pngFiles.length === 0) {
    console.log('No PNG files found, trying page-by-page conversion...');
    // Try converting pages one by one
    const imagePaths: string[] = [];
    for (let i = 1; i <= Math.min(pageCount, 10); i++) {
      const pageOutputPath = path.join(tempDir, `page-${i}.png`);
      try {
        await poppler.pdfToCairo(inputPdfPath, pageOutputPath.replace('.png', ''), {
          pngFile: true,
          resolutionXYAxis: 300,
          singleFile: true,
          firstPageToConvert: i,
          lastPageToConvert: i,
        });
        
        // Check if the file was created (might have different naming)
        const possibleNames = [
          pageOutputPath,
          path.join(tempDir, `page-${i}-1.png`),
          path.join(tempDir, `page-${i}.png`),
        ];
        
        for (const possiblePath of possibleNames) {
          if (fs.existsSync(possiblePath)) {
            console.log(`Successfully converted page ${i} to: ${path.basename(possiblePath)}`);
            imagePaths.push(possiblePath);
            break;
          }
        }
      } catch (error) {
        console.warn(`Failed to convert page ${i}:`, error);
      }
    }
    return imagePaths;
  }

  return pngFiles;
};

const encodeImageToBase64 = (p: string): string =>
  fs.readFileSync(p).toString('base64');

const cleanupTempFiles = (paths: string[]) => {
  const dir = path.dirname(paths[0] ?? '');
  paths.forEach((p) => fs.existsSync(p) && fs.unlinkSync(p));
  const pdf = path.join(dir, 'input.pdf');
  if (fs.existsSync(pdf)) fs.unlinkSync(pdf);
  if (dir && fs.existsSync(dir)) fs.rmdirSync(dir);
};

export async function POST(req: NextRequest) {
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
    imagePaths = await extractImagesFromPdf(buffer);
    
    console.log(`Successfully extracted ${imagePaths.length} images from PDF`);
    if (!imagePaths.length)
      throw new Error('No images extracted from PDF');

    const content: ChatCompletionContentPart[] = [
      { type: 'text', text: getGuidelinesImage() },
      ...imagePaths.map(
        (p, index): ChatCompletionContentPart => {
          console.log(`Processing page ${index + 1}: ${path.basename(p)}`);
          return {
            type: 'image_url',
            image_url: { url: `data:image/png;base64,${encodeImageToBase64(p)}` },
          };
        }
      ),
    ];

    console.log(`Sending ${imagePaths.length} page images to OpenAI API`);
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
    const { choices } = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content }],
    });

    const responseText = choices[0].message?.content ?? '';
    const jsonStart = responseText.indexOf('{');
    const jsonEnd = responseText.lastIndexOf('}') + 1;
    if (jsonStart === -1 || jsonEnd <= jsonStart) {
      console.error('Invalid JSON format in OpenAI response:', responseText);
      throw new Error('No valid JSON found in OpenAI response');
    }

    try {
      const jsonStr = responseText.slice(jsonStart, jsonEnd);
      const parsed = JSON.parse(jsonStr);
      
      if (!parsed.seller || !parsed.buyer || !Array.isArray(parsed.invoice_data)) {
        throw new Error('OpenAI response missing required fields (seller, buyer, or invoice_data)');
      }
      
      const output = { id: crypto.randomUUID(), ...parsed };

      cleanupTempFiles(imagePaths);
      return NextResponse.json(output);
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      throw new Error(`Failed to parse JSON from OpenAI response: ${(parseError as Error).message}`);
    }
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'PAGE_LIMIT_EXCEEDED') {
      return NextResponse.json(
        { error: 'PDF has more than 10 pages', code: 'PAGE_LIMIT_EXCEEDED' },
        { status: 400 }
      );
    }
    
    cleanupTempFiles(imagePaths || []);
    
    return NextResponse.json(
      { 
        error: (err as Error).message || 'Unexpected server error',
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
