function getEnvVar(key: string, fallback?: string): string {
  const value = process.env[key];
  if (!value && !fallback) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value || fallback || '';
}

function getOptionalEnvVar(key: string, fallback: string = ''): string {
  return process.env[key] || fallback;
}

export const config = {
  openai: {
    apiKey: getEnvVar('OPENAI_API_KEY'),
    internalApiKey: getOptionalEnvVar('INTERNAL_API_KEY'),
  },
  supabase: {
    url: getEnvVar('SUPABASE_URL'),
    anonKey: getEnvVar('SUPABASE_ANON_KEY'),
    serviceRoleKey: getOptionalEnvVar('SUPABASE_SERVICE_ROLE_KEY'),
  },
  privacy: {
    apiUrl: getOptionalEnvVar('PRIVACY_API_URL', 'http://localhost:5000'),
    apiKey: getOptionalEnvVar('PRIVACY_API_KEY'),
  },
  app: {
    siteUrl: getOptionalEnvVar('NEXT_PUBLIC_SITE_URL'),
    nodeEnv: getOptionalEnvVar('NODE_ENV', 'development'),
    isDevelopment: process.env.NODE_ENV !== 'production',
    isProduction: process.env.NODE_ENV === 'production',
  },
} as const;

export function validateConfig(): void {
  try {
    const apiKey = config.openai.apiKey;
    const supabaseUrl = config.supabase.url;
    const anonKey = config.supabase.anonKey;

    if (!apiKey || !supabaseUrl || !anonKey) {
      throw new Error('Required configuration missing');
    }
  } catch (error) {
    console.error('Configuration validation failed:', error);
    throw error;
  }
}
