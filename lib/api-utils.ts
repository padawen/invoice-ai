import { NextRequest } from 'next/server';
import { config } from './config';
import { AuthenticationError, ExternalServiceError } from './errors';

export interface FetchWithTimeoutOptions extends RequestInit {
  timeout?: number;
}

export async function fetchWithTimeout(
  url: string,
  options: FetchWithTimeoutOptions = {}
): Promise<Response> {
  const { timeout = 10000, ...fetchOptions } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

export function getAuthHeader(request: NextRequest): string {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    throw new AuthenticationError();
  }
  return authHeader;
}

export interface ProxyConfig {
  baseUrl: string;
  apiKey?: string;
  timeout?: number;
}

export async function proxyToPrivacyApi(
  endpoint: string,
  options: RequestInit = {},
  timeout: number = 10000
): Promise<Response> {
  const baseUrl = config.privacy.apiUrl;
  const apiKey = config.privacy.apiKey;

  if (!baseUrl) {
    throw new ExternalServiceError('Privacy API', 'URL not configured');
  }

  const url = `${baseUrl}${endpoint}`;
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };

  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  return fetchWithTimeout(url, {
    ...options,
    headers,
    timeout,
  });
}

export function createApiHeaders(includeAuth: boolean = false): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (includeAuth && config.privacy.apiKey) {
    headers['Authorization'] = `Bearer ${config.privacy.apiKey}`;
  }

  return headers;
}

export async function parseJsonResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorText = await response.text();
    throw new ExternalServiceError(
      'External API',
      `HTTP ${response.status}: ${errorText}`
    );
  }

  return response.json();
}

export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '')
    .slice(0, 10000);
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateNumeric(value: string): boolean {
  return /^-?\d*\.?\d+$/.test(value);
}
