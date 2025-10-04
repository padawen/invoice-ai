import { useState, useCallback } from 'react';
import { getUserFriendlyError } from '@/lib/errors';

interface UseApiOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: string) => void;
  retries?: number;
}

interface UseApiReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  execute: (...args: unknown[]) => Promise<T | null>;
  reset: () => void;
}

export function useApi<T = unknown>(
  apiFn: (...args: unknown[]) => Promise<T>,
  options: UseApiOptions<T> = {}
): UseApiReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (...args: unknown[]): Promise<T | null> => {
      setLoading(true);
      setError(null);

      try {
        const result = await apiFn(...args);
        setData(result);
        options.onSuccess?.(result);
        return result;
      } catch (err) {
        const errorMessage = getUserFriendlyError(err);
        setError(errorMessage);
        options.onError?.(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [apiFn, options]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { data, loading, error, execute, reset };
}

export function useFetch<T = unknown>(
  url: string,
  options: RequestInit = {}
): UseApiReturn<T> {
  const fetchFn = useCallback(async () => {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  }, [url, options]);

  return useApi<T>(fetchFn);
}

export function useApiMutation<TData = unknown, TVariables = unknown>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: UseApiOptions<TData> = {}
): {
  mutate: (variables: TVariables) => Promise<TData | null>;
  loading: boolean;
  error: string | null;
  data: TData | null;
  reset: () => void;
} {
  const wrappedFn = useCallback((...args: unknown[]) => {
    return mutationFn(args[0] as TVariables);
  }, [mutationFn]);

  const { execute, ...rest } = useApi(wrappedFn, options);

  const mutate = useCallback(
    async (variables: TVariables) => {
      return execute(variables);
    },
    [execute]
  );

  return { mutate, ...rest };
}
