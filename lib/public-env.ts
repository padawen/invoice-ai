import { z } from 'next/dist/compiled/zod';
import type { ZodIssue } from 'next/dist/compiled/zod';

const publicEnvSchema = z.object({
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

const formatZodIssues = (issues: ZodIssue[]): string =>
  issues
    .map((issue) => {
      const path = issue.path.join('.') || 'environment';
      return `${path}: ${issue.message}`;
    })
    .join('\n');

const publicEnvResult = publicEnvSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
});

if (!publicEnvResult.success) {
  throw new Error(
    `Invalid public environment variables:\n${formatZodIssues(publicEnvResult.error.issues)}`
  );
}

export const publicEnv = publicEnvResult.data;

export const {
  NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SITE_URL,
} = publicEnv;
