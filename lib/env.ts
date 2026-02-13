/**
 * Environment variables configuration and validation
 * Centralized environment variable access with type safety
 */

/**
 * Client-side environment variables (NEXT_PUBLIC_*)
 */
export const clientEnv = {
    appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    apiUrl: process.env.NEXT_PUBLIC_API_URL || '',
} as const;

/**
 * Server-side environment variables
 * Only accessible in server components and API routes
 */
export const serverEnv = {
    nodeEnv: process.env.NODE_ENV || 'development',
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    privacyApiUrl: process.env.PRIVACY_API_URL || '',
} as const;

/**
 * Validate required environment variables
 * Call this in server components or API routes to ensure all required vars are set
 */
export function validateEnv() {
    const required = {
        client: ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'],
        server: ['OPENAI_API_KEY'],
    };

    const missing: string[] = [];

    // Check client vars
    required.client.forEach((key) => {
        if (!process.env[key]) {
            missing.push(key);
        }
    });

    // Check server vars (only in server context)
    if (typeof window === 'undefined') {
        required.server.forEach((key) => {
            if (!process.env[key]) {
                missing.push(key);
            }
        });
    }

    if (missing.length > 0) {
        throw new Error(
            `Missing required environment variables: ${missing.join(', ')}\n` +
            'Please check your .env.local file.'
        );
    }
}

/**
 * Check if running in production
 */
export const isProduction = serverEnv.nodeEnv === 'production';

/**
 * Check if running in development
 */
export const isDevelopment = serverEnv.nodeEnv === 'development';

/**
 * Check if running in test
 */
export const isTest = serverEnv.nodeEnv === 'test';

/**
 * Get base URL for the application
 */
export function getBaseUrl(): string {
    if (typeof window !== 'undefined') {
        // Browser
        return window.location.origin;
    }

    // Server
    if (process.env.NEXT_PUBLIC_APP_URL) {
        return process.env.NEXT_PUBLIC_APP_URL;
    }

    if (process.env.VERCEL_URL) {
        return `https://${process.env.VERCEL_URL}`;
    }

    return 'http://localhost:3000';
}

/**
 * Feature flags
 */
export const features = {
    enableAnalytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
    enableDebugMode: process.env.NEXT_PUBLIC_DEBUG_MODE === 'true',
    enablePrivacyMode: process.env.NEXT_PUBLIC_ENABLE_PRIVACY === 'true',
} as const;
