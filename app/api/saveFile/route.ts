import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const timestamp = Date.now();
  const tempDir = path.join(process.cwd(), 'temp');

  await fs.mkdir(tempDir, { recursive: true });

  const filePath = path.join(tempDir, `${timestamp}-${file.name}`);
  await fs.writeFile(filePath, buffer);

  return NextResponse.json({ filePath });
}
