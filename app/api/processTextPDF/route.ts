import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { getGuidelinesText } from '@/lib/instructions';
import { createSupabaseClient } from '@/lib/supabase-server';
import { formatDateForInput } from '@/app/utils/dateFormatter';

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

    const uploadedFile = await openai.files.create({
      file: fileFromBuffer(buffer, 'invoice.pdf'),
      purpose: 'assistants',
    });

    const assistant = await openai.beta.assistants.create({
      name: 'PDF Assistant',
      model: 'gpt-4o',
      instructions:
        'You are an invoice reader chatbot. Output a structured JSON object.',
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
      const status = await openai.beta.threads.runs.retrieve(
        thread.id,
        run.id
      );

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

    const msg = result.data[0]?.content.find(
      (c) => c.type === 'text'
    ) as { type: 'text'; text: { value: string } } | undefined;

    if (!msg?.text?.value) {
      console.error('No valid message returned from assistant');
      throw new Error('No valid message returned from assistant');
    }

    const raw = msg.text.value;

    const tryExtractJson = (text: string): unknown => {
      const match = text.match(/{[\s\S]*}/);
      if (!match) {
        console.error('No JSON object found in response:', text);
        throw new Error('No JSON object found in assistant response');
      }
      try {
        const parsed = JSON.parse(match[0]);
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

    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Parsed result is not a valid object');
    }

    const result_obj = parsed as {
      seller?: unknown;
      buyer?: unknown;
      invoice_data?: unknown;
      issue_date?: string;
      due_date?: string;
      fulfillment_date?: string;
    };
    if (!result_obj.seller || !result_obj.buyer || !Array.isArray(result_obj.invoice_data)) {
      console.warn('Missing required fields in parsed result:', {
        hasSeller: !!result_obj.seller,
        hasBuyer: !!result_obj.buyer,
        hasInvoiceData: Array.isArray(result_obj.invoice_data)
      });
    }

    // Clean up dates right when we get them from OpenAI
    if (result_obj.issue_date) {
      result_obj.issue_date = formatDateForInput(result_obj.issue_date);
    }
    if (result_obj.due_date) {
      result_obj.due_date = formatDateForInput(result_obj.due_date);
    }
    if (result_obj.fulfillment_date) {
      result_obj.fulfillment_date = formatDateForInput(result_obj.fulfillment_date);
    }

    return NextResponse.json(result_obj);
  } catch (err) {
    console.error('Processing error:', err);
    return NextResponse.json(
      { error: 'Failed to process PDF with OpenAI' },
      { status: 500 }
    );
  }
}
