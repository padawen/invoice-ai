// app/api/detectType/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pdf from 'pdf-parse';
import { createSupabaseClient } from '@/lib/supabase';

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
