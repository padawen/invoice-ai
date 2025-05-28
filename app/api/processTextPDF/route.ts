import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { getGuidelinesText } from '@/lib/instructions';
import { createSupabaseClient } from '@/lib/supabase-server';

const fileFromBuffer = (
  buffer: Buffer,
  filename: string,
  contentType = 'application/pdf'
): File => new File([buffer], filename, { type: contentType });

export async function POST(req: NextRequest) {

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
  });

  const API_KEY =
    process.env.INTERNAL_API_KEY || process.env.OPENAI_API_KEY;

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
  const blob = formData.get('file') as Blob | null;

  if (!blob) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await blob.arrayBuffer());
    console.log('Processing PDF with size:', buffer.length, 'bytes');

    const uploadedFile = await openai.files.create({
      file: fileFromBuffer(buffer, 'invoice.pdf'),
      purpose: 'assistants',
    });

    console.log('File uploaded to OpenAI with ID:', uploadedFile.id);

    const assistant = await openai.beta.assistants.create({
      name: 'PDF Assistant',
      model: 'gpt-4o',
      instructions:
        'You are an invoice reader chatbot. Output a structured JSON object.',
      tools: [{ type: 'file_search' }],
    });

    console.log('Assistant created with ID:', assistant.id);

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

    console.log('Message created in thread:', thread.id);

    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: assistant.id,
    });

    console.log('Run started with ID:', run.id);

    let result;
    let attempts = 0;
    const maxAttempts = 15;

    while (attempts < maxAttempts) {
      const status = await openai.beta.threads.runs.retrieve(
        thread.id,
        run.id
      );

      console.log(`Attempt ${attempts + 1}: Run status is ${status.status}`);

      if (status.status === 'completed') {
        result = await openai.beta.threads.messages.list(thread.id);
        break;
      }

      if (status.status === 'failed') {
        console.error('OpenAI run failed:', status.last_error);
        throw new Error(`OpenAI processing failed: ${status.last_error?.message || 'Unknown error'}`);
      }

      await new Promise((res) => setTimeout(res, 1000));
      attempts++;
    }

    if (!result) {
      throw new Error('Timed out waiting for OpenAI to respond');
    }

    console.log('OpenAI response received, messages count:', result.data.length);

    const msg = result.data[0]?.content.find(
      (c) => c.type === 'text'
    ) as { type: 'text'; text: { value: string } } | undefined;

    if (!msg?.text?.value) {
      console.error('No valid message returned from assistant');
      console.log('Full response:', JSON.stringify(result.data, null, 2));
      throw new Error('No valid message returned from assistant');
    }

    const raw = msg.text.value;
    console.log('Raw OpenAI response:', raw);

    const tryExtractJson = (text: string): unknown => {
      const match = text.match(/{[\s\S]*}/);
      if (!match) {
        console.error('No JSON object found in response:', text);
        throw new Error('No JSON object found in assistant response');
      }
      try {
        const parsed = JSON.parse(match[0]);
        console.log('Successfully parsed JSON:', JSON.stringify(parsed, null, 2));
        return parsed;
      } catch (err) {
        console.error('JSON parsing failed:', err);
        console.error('Attempted to parse:', match[0]);
        throw new Error(
          `Failed to parse JSON: ${(err as Error).message}`
        );
      }
    };

    const parsed = tryExtractJson(raw);

    // Validate the parsed result has required structure
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Parsed result is not a valid object');
    }

    const result_obj = parsed as any;
    if (!result_obj.seller || !result_obj.buyer || !Array.isArray(result_obj.invoice_data)) {
      console.warn('Missing required fields in parsed result:', {
        hasSeller: !!result_obj.seller,
        hasBuyer: !!result_obj.buyer,
        hasInvoiceData: Array.isArray(result_obj.invoice_data)
      });
    }

    return NextResponse.json(parsed);
  } catch (err) {
    console.error('Processing error:', err);
    return NextResponse.json(
      { error: 'Failed to process PDF with OpenAI' },
      { status: 500 }
    );
  }
}
