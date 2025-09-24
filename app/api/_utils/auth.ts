import { NextRequest } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase-server';

export const authenticateRequest = async (req: NextRequest): Promise<boolean> => {
  const expectedApiKey = process.env.INTERNAL_API_KEY || process.env.OPENAI_API_KEY;
  const apiKeyHeader = req.headers.get('x-api-key');

  if (expectedApiKey && apiKeyHeader && apiKeyHeader === expectedApiKey) {
    return true;
  }

  const token = req.headers.get('authorization')?.replace('Bearer ', '');

  if (!token) {
    return false;
  }

  try {
    const supabase = createSupabaseClient(token);
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (user && !error) {
      return true;
    }
  } catch (error) {
    console.error('Supabase auth error:', error);
  }

  return false;
};
