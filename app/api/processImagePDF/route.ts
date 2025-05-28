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

  const poppler = new Poppler();
  const imagePaths: string[] = [];

  // Convert each page to a separate PNG image (like the Python version)
  for (let pageNum = 1; pageNum <= Math.min(pageCount, 10); pageNum++) {
    const outputPath = path.join(tempDir, `page_${pageNum}`);
    
    try {
      console.log(`Converting page ${pageNum} to image...`);
      
      // Convert single page to PNG
      await poppler.pdfToCairo(inputPdfPath, outputPath, {
        pngFile: true,
        resolutionXYAxis: 200, // Match Python DPI
        singleFile: true,
        firstPageToConvert: pageNum,
        lastPageToConvert: pageNum,
      });

      // Check for the generated file with different possible naming patterns
      const possiblePaths = [
        `${outputPath}.png`,
        `${outputPath}-1.png`,
        `${outputPath}-${pageNum}.png`,
        path.join(tempDir, `page_${pageNum}.png`),
      ];

      let foundPath = null;
      for (const possiblePath of possiblePaths) {
        if (fs.existsSync(possiblePath)) {
          foundPath = possiblePath;
          break;
        }
      }

      if (foundPath) {
        console.log(`Successfully converted page ${pageNum} to: ${path.basename(foundPath)}`);
        imagePaths.push(foundPath);
      } else {
        console.warn(`Failed to find generated image for page ${pageNum}`);
        // List all files in temp directory for debugging
        const allFiles = fs.readdirSync(tempDir);
        console.log(`Files in temp directory:`, allFiles);
      }
    } catch (error) {
      console.warn(`Failed to convert page ${pageNum}:`, error);
    }
  }

  console.log(`Successfully extracted ${imagePaths.length} page images from PDF`);
  return imagePaths;
};

const encodeImageToBase64 = (imagePath: string): { base64: string; mimeType: string } => {
  const imageBuffer = fs.readFileSync(imagePath);
  const base64 = imageBuffer.toString('base64');
  
  // Determine MIME type based on file extension
  const ext = path.extname(imagePath).toLowerCase();
  let mimeType = 'image/png'; // default
  
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
          const { base64, mimeType } = encodeImageToBase64(p);
          return {
            type: 'image_url',
            image_url: { url: `data:${mimeType};base64,${base64}` },
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
    console.log('Raw OpenAI response:', responseText);
    
    // Clean up the response like the Python version
    let cleanedResponse = responseText;
    
    // Remove markdown code blocks if present
    if (cleanedResponse.startsWith('```json') && cleanedResponse.endsWith('```')) {
      cleanedResponse = cleanedResponse.slice(7, -3).trim();
    } else if (cleanedResponse.startsWith('```') && cleanedResponse.endsWith('```')) {
      cleanedResponse = cleanedResponse.slice(3, -3).trim();
    }
    
    // Extract the first JSON object with regex (like Python version)
    const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No valid JSON found in OpenAI response:', responseText);
      throw new Error('No valid JSON found in OpenAI response');
    }

    try {
      const jsonStr = jsonMatch[0];
      const parsed = JSON.parse(jsonStr);
      
      if (!parsed.seller || !parsed.buyer || !Array.isArray(parsed.invoice_data)) {
        throw new Error('OpenAI response missing required fields (seller, buyer, or invoice_data)');
      }
      
      const output = { id: crypto.randomUUID(), ...parsed };

      cleanupTempFiles(imagePaths);
      return NextResponse.json(output);
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      console.error('Attempted to parse:', jsonMatch[0]);
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
