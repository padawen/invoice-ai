import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { getGuidelinesText } from '@/lib/instructions';
import { createSupabaseClient } from '@/lib/supabase';

const fileFromBuffer = (
  buffer: Buffer,
  filename: string,
  contentType = 'application/pdf'
): File => {
  return new File([buffer], filename, { type: contentType });
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const API_KEY = process.env.INTERNAL_API_KEY || process.env.OPENAI_API_KEY;

export async function POST(req: NextRequest) {
  let isAuthenticated = false;

  const apiKey = req.headers.get('x-api-key');
  if (apiKey && apiKey === API_KEY) {
    isAuthenticated = true;
  }

  if (!isAuthenticated) {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (token) {
      try {
        const supabase = createSupabaseClient(token);
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();
        if (user && !error) isAuthenticated = true;
      } catch (err) {
        console.error('Supabase auth error:', err);
      }
    }
  }

  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await req.formData();
  const blob = formData.get('file') as Blob;

  if (!blob) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await blob.arrayBuffer());

    const uploadedFile = await openai.files.create({
      file: fileFromBuffer(buffer, 'invoice.pdf'),
      purpose: 'assistants',
    });

    const assistant = await openai.beta.assistants.create({
      name: 'PDF Assistant',
      model: 'gpt-4o',
      instructions: 'You are an invoice reader chatbot. Output a structured JSON object.',
      tools: [{ type: 'file_search' }],
    });

    const thread = await openai.beta.threads.create();

    await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: getGuidelinesText(),
      attachments: [
        {
          file_id: uploadedFile.id,
          tools: [{ type: 'file_search' }],
        },
      ],
    });

    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: assistant.id,
    });

    let result;
    let attempts = 0;
    const maxAttempts = 15;

    while (attempts < maxAttempts) {
      const status = await openai.beta.threads.runs.retrieve(thread.id, run.id);

      if (status.status === 'completed') {
        result = await openai.beta.threads.messages.list(thread.id);
        break;
      }

      if (status.status === 'failed') {
        throw new Error('OpenAI processing failed');
      }

      await new Promise((res) => setTimeout(res, 1000));
      attempts++;
    }

    if (!result) {
      throw new Error('Timed out waiting for OpenAI to respond');
    }

    const msg = result.data[0]?.content.find(
      (c) => c.type === 'text'
    ) as { type: 'text'; text: { value: string } };

    if (!msg || !msg.text?.value) {
      throw new Error('No valid message returned from assistant');
    }

    const raw = msg.text.value;

    const tryExtractJson = (text: string): unknown => {
      const match = text.match(/{[\s\S]*}/);
      if (!match) throw new Error('No JSON object found in assistant response');
      try {
        return JSON.parse(match[0]);
      } catch (err) {
        throw new Error(`Failed to parse JSON: ${(err as Error).message}`);
      }
    };

    const parsed = tryExtractJson(raw);

    return NextResponse.json(parsed);
  } catch (err) {
    console.error('Processing error:', err);
    return NextResponse.json(
      { error: 'Failed to process PDF with OpenAI' },
      { status: 500 }
    );
  }
}
