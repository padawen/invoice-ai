import { logger } from './logger';

function getEnvVar(key: string, fallback?: string): string {
  const value = process.env[key];
  if (!value && !fallback) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Missing required environment variable: ${key}`);
    }
    return fallback || '';
  }
  return value || fallback || '';
}

function getOptionalEnvVar(key: string, fallback: string = ''): string {
  return process.env[key] || fallback;
}

export const config = {
  openai: {
    get apiKey() { return getEnvVar('OPENAI_API_KEY'); },
    get internalApiKey() { return getOptionalEnvVar('INTERNAL_API_KEY'); },
  },
  supabase: {
    get url() { return getEnvVar('SUPABASE_URL'); },
    get anonKey() { return getEnvVar('SUPABASE_ANON_KEY'); },
    get serviceRoleKey() { return getOptionalEnvVar('SUPABASE_SERVICE_ROLE_KEY'); },
  },
  privacy: {
    get apiUrl() { return getOptionalEnvVar('PRIVACY_API_URL', 'http://localhost:5000'); },
    get apiKey() { return getOptionalEnvVar('PRIVACY_API_KEY'); },
  },
  app: {
    get siteUrl() { return getOptionalEnvVar('NEXT_PUBLIC_SITE_URL'); },
    get nodeEnv() { return getOptionalEnvVar('NODE_ENV', 'development'); },
    get isDevelopment() { return process.env.NODE_ENV !== 'production'; },
    get isProduction() { return process.env.NODE_ENV === 'production'; },
  },
};

export function validateConfig(): void {
  try {
    const apiKey = config.openai.apiKey;
    const supabaseUrl = config.supabase.url;
    const anonKey = config.supabase.anonKey;

    if (!apiKey || !supabaseUrl || !anonKey) {
      throw new Error('Required configuration missing');
    }
  } catch (error) {
    logger.error('Configuration validation failed', error);
    throw error;
  }
}
