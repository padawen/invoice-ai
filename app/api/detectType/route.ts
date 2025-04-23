// app/api/detectType/route.ts
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import pdf from 'pdf-parse';

export async function POST(req: NextRequest) {
  const { filePath } = await req.json();

  if (!filePath || !filePath.includes('temp')) {
    return NextResponse.json({ error: 'Invalid or missing filePath' }, { status: 400 });
  }

  try {
    const buffer = await fs.readFile(filePath);
    const data = await pdf(buffer);
    const isTextBased = data.text.trim().length > 30;

    return NextResponse.json({
      type: isTextBased ? 'text' : 'image',
      textPreview: isTextBased ? data.text.slice(0, 200) : '',
    });
  } catch (err) {
    console.error('PDF parse error:', err);
    return NextResponse.json({ error: 'Failed to parse PDF' }, { status: 500 });
  }
}
