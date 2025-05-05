import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { getGuidelinesText } from '@/lib/instructions';
import { createSupabaseClient } from '@/lib/supabase';

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
    const uploadedFile = await openai.files.create({
      file, 
      purpose: 'assistants',
    });

    const assistant = await openai.beta.assistants.create({
      name: 'PDF Assistant',
      model: 'gpt-4o',
      instructions: 'You are an invoice reader chatbot.',
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
    while (true) {
      const runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);

      if (runStatus.status === 'completed') {
        result = await openai.beta.threads.messages.list(thread.id);
        break;
      } else if (runStatus.status === 'failed') {
        throw new Error('OpenAI processing failed');
      }

      await new Promise((res) => setTimeout(res, 1000));
    }

    const msgContent = result.data[0].content.find(
      (c) => c.type === 'text'
    ) as { type: 'text'; text: { value: string } };

    const content = msgContent?.text?.value || '';
    const jsonStart = content.indexOf('{');
    const jsonEnd = content.lastIndexOf('}') + 1;
    const parsedJson = JSON.parse(content.slice(jsonStart, jsonEnd));

    return NextResponse.json(parsedJson);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to process text PDF' }, { status: 500 });
  }
}
