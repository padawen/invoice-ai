import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import type { ChatCompletionContentPart } from 'openai/resources/chat/completions';
import { getGuidelinesImage } from '@/lib/instructions';
import { createSupabaseClient } from '@/lib/supabase';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { Poppler } from 'node-poppler';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

async function getPageCount(pdfPath: string): Promise<number> {
  const poppler = new Poppler();
  const pdfInfo = await poppler.pdfInfo(pdfPath);
  return typeof pdfInfo === 'object' && pdfInfo !== null ? (pdfInfo as Record<string, number>).pages : 0;
}

async function extractImagesFromPdf(pdfBuffer: Buffer): Promise<string[]> {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-'));
  const imagePaths: string[] = [];
  
  try {
    const pdfPath = path.join(tempDir, 'input.pdf');
    fs.writeFileSync(pdfPath, pdfBuffer);
    
    // Check page count before processing
    const pageCount = await getPageCount(pdfPath);
    if (pageCount > 10) {
      throw new Error('PAGE_LIMIT_EXCEEDED');
    }
    
    const poppler = new Poppler();
    
    const outputFile = path.join(tempDir, 'page');
    
    await poppler.pdfToCairo(pdfPath, outputFile, {
      pngFile: true,
      singleFile: false,
      jpegFile: false,
      resolutionXYAxis: 300,
      firstPageToConvert: 1,
      lastPageToConvert: Math.min(pageCount, 10), 
    });
    
    const files = fs.readdirSync(tempDir);
    
    for (const file of files) {
      if (file.endsWith('.png')) {
        imagePaths.push(path.join(tempDir, file));
      }
    }
    
    return imagePaths;
  } catch (error) {
    throw error;
  }
}

function encodeImage(imagePath: string): string {
  const imageData = fs.readFileSync(imagePath);
  return imageData.toString('base64');
}

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
  const file = formData.get('file') as File;

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    
    const imagePaths = await extractImagesFromPdf(buffer);
    
    if (imagePaths.length === 0) {
      throw new Error('Failed to extract any images from PDF');
    }
    
    const base64Images = imagePaths.map(path => encodeImage(path));
    
    const content: ChatCompletionContentPart[] = [
      {
        type: 'text',
        text: getGuidelinesImage()
      }
    ];
    
    for (const base64Image of base64Images) {
      content.push({
        type: 'image_url',
        image_url: {
          url: `data:image/jpeg;base64,${base64Image}`
        }
      });
    }
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{
        role: 'user',
        content: content
      }]
    });
    
    const responseContent = response.choices[0].message?.content || '';
    
    const jsonStart = responseContent.indexOf('{');
    const jsonEnd = responseContent.lastIndexOf('}') + 1;
    
    if (jsonStart === -1 || jsonEnd <= jsonStart) {
      throw new Error('No valid JSON found in OpenAI response');
    }
    
    const parsedJson = JSON.parse(responseContent.slice(jsonStart, jsonEnd));
    
    const responseWithId = {
      id: crypto.randomUUID(),
      ...parsedJson
    };
    
    for (const imagePath of imagePaths) {
      try {
        fs.unlinkSync(imagePath);
      } catch (_) {}
    }
    
    try {
      fs.unlinkSync(path.join(path.dirname(imagePaths[0]), 'input.pdf'));
      fs.rmdirSync(path.dirname(imagePaths[0]));
    } catch (_) {}
    
    return NextResponse.json(responseWithId);
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'PAGE_LIMIT_EXCEEDED') {
      return NextResponse.json({ 
        error: 'PAGE_LIMIT_EXCEEDED',
        message: 'PDF has more than 10 pages'
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to process PDF' 
    }, { status: 500 });
  }
}