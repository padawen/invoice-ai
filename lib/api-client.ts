/**
 * Type-safe API client for Invoice AI
 * Centralized API calls with error handling and type safety
 */

import { useState } from 'react';
import { processImagesRequestSchema, type ProcessImagesResponse } from './validations';

/**
 * API Error class
 */
export class APIError extends Error {
    constructor(
        message: string,
        public status: number,
        public details?: any
    ) {
        super(message);
        this.name = 'APIError';
    }
}

/**
 * Base API client configuration
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

/**
 * Generic fetch wrapper with error handling
 */
async function apiFetch<T>(
    endpoint: string,
    options?: RequestInit
): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options?.headers,
            },
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new APIError(
                error.error || error.message || 'Request failed',
                response.status,
                error
            );
        }

        return response.json();
    } catch (error) {
        if (error instanceof APIError) {
            throw error;
        }
        throw new APIError(
            error instanceof Error ? error.message : 'Network error',
            0
        );
    }
}

/**
 * Get authorization header
 */
function getAuthHeader(token?: string): Record<string, string> {
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
}

/**
 * API Client
 */
export const api = {
    /**
     * Process images with AI
     */
    processImages: async (
        images: string[],
        token?: string
    ): Promise<ProcessImagesResponse> => {
        return apiFetch<ProcessImagesResponse>('/api/processImages', {
            method: 'POST',
            headers: getAuthHeader(token),
            body: JSON.stringify({ images }),
        });
    },

    /**
     * Save processed data
     */
    saveProcessedData: async (
        data: {
            fields: any;
            project: string;
        },
        token?: string
    ): Promise<{ success: boolean; id: string; projectId: string; projectName: string }> => {
        return apiFetch('/api/saveProcessedData', {
            method: 'POST',
            headers: getAuthHeader(token),
            body: JSON.stringify(data),
        });
    },

    /**
     * Delete processed item
     */
    deleteProcessedItem: async (
        id: string,
        token?: string
    ): Promise<{ success: boolean }> => {
        return apiFetch('/api/processed', {
            method: 'DELETE',
            headers: getAuthHeader(token),
            body: JSON.stringify({ id }),
        });
    },

    /**
     * Update item project
     */
    updateItemProject: async (
        itemId: string,
        projectId: string,
        token?: string
    ): Promise<{ success: boolean }> => {
        return apiFetch('/api/processed/updateProject', {
            method: 'PUT',
            headers: getAuthHeader(token),
            body: JSON.stringify({ itemId, projectId }),
        });
    },

    /**
     * Get projects
     */
    getProjects: async (
        token?: string
    ): Promise<{ projects: string[] }> => {
        return apiFetch('/api/project', {
            method: 'GET',
            headers: getAuthHeader(token),
        });
    },

    /**
     * Create project
     */
    createProject: async (
        name: string,
        token?: string
    ): Promise<{ success: boolean }> => {
        return apiFetch('/api/project', {
            method: 'POST',
            headers: getAuthHeader(token),
            body: JSON.stringify({ name }),
        });
    },

    /**
     * Delete project
     */
    deleteProject: async (
        id: string,
        token?: string
    ): Promise<{ success: boolean }> => {
        return apiFetch('/api/project', {
            method: 'DELETE',
            headers: getAuthHeader(token),
            body: JSON.stringify({ id }),
        });
    },
};

/**
 * React hook for API calls with loading state
 */
export function useAPI() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<APIError | null>(null);

    const call = async <T,>(
        apiCall: () => Promise<T>
    ): Promise<T | null> => {
        try {
            setLoading(true);
            setError(null);
            const result = await apiCall();
            return result;
        } catch (err) {
            const apiError = err instanceof APIError
                ? err
                : new APIError('Unknown error', 0);
            setError(apiError);
            return null;
        } finally {
            setLoading(false);
        }
    };

    return { call, loading, error };
}

/**
 * Retry failed requests with exponential backoff
 */
export async function retryRequest<T>(
    fn: () => Promise<T>,
    options?: {
        maxRetries?: number;
        initialDelay?: number;
        maxDelay?: number;
        backoffFactor?: number;
    }
): Promise<T> {
    const {
        maxRetries = 3,
        initialDelay = 1000,
        maxDelay = 10000,
        backoffFactor = 2,
    } = options || {};

    let lastError: Error;
    let delay = initialDelay;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error instanceof Error ? error : new Error('Unknown error');

            if (attempt < maxRetries) {
                await new Promise((resolve) => setTimeout(resolve, delay));
                delay = Math.min(delay * backoffFactor, maxDelay);
            }
        }
    }

    throw lastError!;
}
