import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

const API_KEY = process.env.INTERNAL_API_KEY || process.env.OPENAI_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const createSupabaseClient = (token: string) =>
  createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

const isMostlyBinary = (buffer: Buffer): boolean => {
  const sample = buffer.subarray(0, 1000).toString('utf-8');
  const nonPrintable = sample.replace(/[\x20-\x7E]/g, '').length;
  return sample.length > 0 && (nonPrintable / sample.length) > 0.5;
};

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get('x-api-key');
  const token = req.headers.get('authorization')?.replace('Bearer ', '');

  const isApiKeyValid = apiKey && API_KEY && apiKey === API_KEY;
  let isSupabaseTokenValid = false;

  if (token) {
    try {
      const supabase = createSupabaseClient(token);
      const { data: { user }, error } = await supabase.auth.getUser();
      isSupabaseTokenValid = !!user && !error;
    } catch {
      isSupabaseTokenValid = false;
    }
  }

  if (!isApiKeyValid && !isSupabaseTokenValid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get('file');

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No valid file provided' }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = file.name.toLowerCase();
    const fileSize = buffer.length;

    // Feltételezett oldalankénti méret (ha nincs oldalszámunk)
    const estimatedPages = Math.max(Math.round(fileSize / 500_000), 1);
    const averageSizePerPage = fileSize / estimatedPages;

    const isLikelyImage =
      fileName.includes('scan') ||
      fileName.includes('image') ||
      averageSizePerPage > 1024 * 1024 || // >1MB per page
      isMostlyBinary(buffer);

    return NextResponse.json({
      type: isLikelyImage ? 'image' : 'text',
      textPreview: `Estimated ${estimatedPages} pages (${isLikelyImage ? 'image-based' : 'text-based'})`,
    });
  } catch (err) {
    console.error('PDF analysis error:', err);
    return NextResponse.json({ error: 'Failed to analyze PDF' }, { status: 500 });
  }
}
