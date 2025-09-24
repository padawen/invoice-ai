'use server';

import { z } from 'next/dist/compiled/zod';
import type { ZodIssue } from 'next/dist/compiled/zod';

import { publicEnv } from '@/lib/public-env';

const serverEnvSchema = z.object({
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
});

const formatZodIssues = (issues: ZodIssue[]): string =>
  issues
    .map((issue) => {
      const path = issue.path.join('.') || 'environment';
      return `${path}: ${issue.message}`;
    })
    .join('\n');

const serverEnvResult = serverEnvSchema.safeParse({
  NODE_ENV: process.env.NODE_ENV,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  INTERNAL_API_KEY: process.env.INTERNAL_API_KEY,
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
});

if (!serverEnvResult.success) {
  throw new Error(
    `Invalid server environment variables:\n${formatZodIssues(serverEnvResult.error.issues)}`
  );
}

const env = {
  ...publicEnv,
  ...serverEnvResult.data,
};

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

export { env, publicEnv };
