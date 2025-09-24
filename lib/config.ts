import { z } from 'next/dist/compiled/zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).optional(),
  OPENAI_API_KEY: z
    .string({ required_error: 'OPENAI_API_KEY is required.' })
    .min(1, 'OPENAI_API_KEY cannot be empty.'),
  INTERNAL_API_KEY: z
    .string({ required_error: 'INTERNAL_API_KEY cannot be empty.' })
    .min(1, 'INTERNAL_API_KEY cannot be empty.')
    .optional(),
  SUPABASE_URL: z
    .string({ required_error: 'SUPABASE_URL is required.' })
    .url('SUPABASE_URL must be a valid URL.'),
  SUPABASE_ANON_KEY: z
    .string({ required_error: 'SUPABASE_ANON_KEY is required.' })
    .min(1, 'SUPABASE_ANON_KEY cannot be empty.'),
  NEXT_PUBLIC_SUPABASE_URL: z
    .string({ required_error: 'NEXT_PUBLIC_SUPABASE_URL is required.' })
    .url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL.'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string({ required_error: 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required.' })
    .min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY cannot be empty.'),
  NEXT_PUBLIC_SITE_URL: z
    .string()
    .url('NEXT_PUBLIC_SITE_URL must be a valid URL.')
    .optional(),
});

const envResult = envSchema.safeParse(process.env);

if (!envResult.success) {
  const message = envResult.error.issues
    .map((issue: { path: (string | number)[]; message: string }) => {
      const path = issue.path.join('.') || 'environment';
      return `${path}: ${issue.message}`;
    })
    .join('\n');

  throw new Error(`Invalid environment variables:\n${message}`);
}

const env = envResult.data;

export const {
  OPENAI_API_KEY,
  INTERNAL_API_KEY,
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SITE_URL,
} = env;

export const INTERNAL_OR_OPENAI_API_KEY = INTERNAL_API_KEY ?? OPENAI_API_KEY;

export { env };
