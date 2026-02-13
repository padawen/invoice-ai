import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import type { ChatCompletionContentPart } from 'openai/resources/chat/completions';
import { getGuidelines } from '@/lib/instructions';
import { createSupabaseClient } from '@/lib/supabase-server';
import { formatDateForInput } from '@/app/utils/dateFormatter';
import { rateLimit } from '@/lib/rate-limit';
import { processImagesRequestSchema, formatZodError } from '@/lib/validations';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
    const rateLimitResult = rateLimit(req, { limit: 5, interval: 60000 });
    if (!rateLimitResult.success && rateLimitResult.response) {
        return rateLimitResult.response;
    }

    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    const supabase = createSupabaseClient(token);
    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();

        // Validate request body with Zod
        const validationResult = processImagesRequestSchema.safeParse(body);
        if (!validationResult.success) {
            return NextResponse.json(
                formatZodError(validationResult.error),
                { status: 400 }
            );
        }

        const { images } = validationResult.data;

        const content: ChatCompletionContentPart[] = [
            { type: 'text', text: getGuidelines() },
            ...images.map((dataUrl): ChatCompletionContentPart => ({
                type: 'image_url',
                image_url: { url: dataUrl },
            })),
        ];

        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

        if (!process.env.OPENAI_API_KEY) {
            throw new Error('OpenAI API key is not configured');
        }

        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [{ role: 'user', content }],
        });

        if (!response.choices || response.choices.length === 0) {
            throw new Error('No response choices returned from OpenAI API');
        }

        const responseText = response.choices[0].message?.content ?? '';

        if (!responseText || responseText.trim().length === 0) {
            throw new Error('Empty response received from OpenAI API');
        }

        let cleanedResponse = responseText;

        if (cleanedResponse.startsWith('```json') && cleanedResponse.endsWith('```')) {
            cleanedResponse = cleanedResponse.slice(7, -3).trim();
        } else if (cleanedResponse.startsWith('```') && cleanedResponse.endsWith('```')) {
            cleanedResponse = cleanedResponse.slice(3, -3).trim();
        }

        const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('No valid JSON found in OpenAI response');
        }

        const jsonStr = jsonMatch[0];
        const parsed = JSON.parse(jsonStr);

        if (!parsed.seller || !parsed.buyer || !Array.isArray(parsed.invoice_data)) {
            throw new Error('OpenAI response missing required fields (seller, buyer, or invoice_data)');
        }

        if (parsed.issue_date) {
            parsed.issue_date = formatDateForInput(parsed.issue_date);
        }
        if (parsed.due_date) {
            parsed.due_date = formatDateForInput(parsed.due_date);
        }
        if (parsed.fulfillment_date) {
            parsed.fulfillment_date = formatDateForInput(parsed.fulfillment_date);
        }

        const output = { id: crypto.randomUUID(), ...parsed };
        return NextResponse.json(output);

    } catch (error) {
        const errorMessage = (error as Error).message || 'Unexpected server error';
        logger.error('ProcessImages Error', undefined, {
            data: {
                message: errorMessage,
                stack: (error as Error).stack,
                name: (error as Error).name,
                timestamp: new Date().toISOString()
            }
        });

        return NextResponse.json(
            {
                error: errorMessage,
                fallbackData: {
                    id: crypto.randomUUID(),
                    seller: { name: '', address: '', tax_id: '', email: '', phone: '' },
                    buyer: { name: '', address: '', tax_id: '' },
                    invoice_number: '',
                    issue_date: '',
                    fulfillment_date: '',
                    due_date: '',
                    payment_method: '',
                    currency: 'HUF',
                    invoice_data: []
                }
            },
            { status: 500 }
        );
    }
}
