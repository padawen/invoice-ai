import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { getGuidelinesImage } from '@/lib/instructions';
import { createSupabaseClient } from '@/lib/supabase';
import pdfParse from 'pdf-parse';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

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
    const pdfData = await pdfParse(buffer);
    const text = pdfData.text;

    const messages: ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: 'You are an intelligent assistant that extracts invoice data from scanned images.',
      },
      {
        role: 'user',
        content: `${getGuidelinesImage()}\n\n${text}`,
      },
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-vision-preview',
      messages,
      max_tokens: 1500,
    });

    const content = completion.choices[0].message?.content || '';
    const jsonStart = content.indexOf('{');
    const jsonEnd = content.lastIndexOf('}') + 1;
    const parsedJson = JSON.parse(content.slice(jsonStart, jsonEnd));

    return NextResponse.json(parsedJson);
  } catch (error: unknown) {
    console.error('Error processing PDF:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to process PDF' }, { status: 500 });
  }
}
