import { NextRequest, NextResponse } from 'next/server';
import { fromBuffer } from 'pdf2pic';
import { OpenAI } from 'openai';
import { getGuidelinesImage } from '@/lib/instructions';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());

    const convert = fromBuffer(buffer, {
      density: 100,
      format: 'png',
      saveFilename: 'preview',
      savePath: '/tmp',
      ...( { save: false } as any ) // ✅ TS workaround
    });

    const pages = await convert.bulk(-1);

    // 🧼 TS workaround a base64-re is
    const base64Images = pages.map((page) => {
      const casted = page as unknown as { base64: string };
      const base64 = casted.base64;
      return base64.split(',')[1];
    });

    // 🧠 GPT-4 Vision üzenet összeállítása
    const messages: any = [
      {
        role: 'system',
        content: 'You are an intelligent assistant that extracts invoice data from scanned images.',
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: getGuidelinesImage(),
          },
          ...base64Images.map((img) => ({
            type: 'image_url',
            image_url: {
              url: `data:image/png;base64,${img}`,
            },
          })),
        ],
      },
    ];

    // 🤖 OpenAI lekérdezés
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-vision-preview',
      messages,
      max_tokens: 1500,
    });

    const content = completion.choices[0].message?.content || '';

    // 🧾 JSON adat kinyerése
    const jsonStart = content.indexOf('{');
    const jsonEnd = content.lastIndexOf('}') + 1;
    const parsedJson = JSON.parse(content.slice(jsonStart, jsonEnd));

    return NextResponse.json(parsedJson);
  } catch (error) {
    console.error('Image PDF processing error:', error);
    return NextResponse.json({ error: 'Failed to process image PDF' }, { status: 500 });
  }
}
