/**
 * Custom React hooks for common operations
 * Improves developer experience and code reusability
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { logger } from './logger';
import type React from 'react';
import { memoryCache } from './cache';

/**
 * Hook for async data fetching with caching
 */
export function useAsyncData<T>(
    key: string,
    fetcher: () => Promise<T>,
    options?: {
        cache?: boolean;
        cacheTTL?: number;
        enabled?: boolean;
    }
) {
    const { cache = true, cacheTTL = 60000, enabled = true } = options || {};

    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchData = useCallback(async () => {
        if (!enabled) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            let result: T;

            if (cache) {
                result = await memoryCache.getOrSet(key, fetcher, cacheTTL) as T;
            } else {
                result = await fetcher();
            }

            setData(result);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Unknown error'));
        } finally {
            setLoading(false);
        }
    }, [key, fetcher, cache, cacheTTL, enabled]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const refetch = useCallback(() => {
        if (cache) {
            memoryCache.delete(key);
        }
        return fetchData();
    }, [key, cache, fetchData]);

    return { data, loading, error, refetch };
}

/**
 * Hook for debounced value
 */
export function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

/**
 * Hook for local storage with sync
 */
export function useLocalStorage<T>(
    key: string,
    initialValue: T
): [T, (value: T | ((val: T) => T)) => void, () => void] {
    const [storedValue, setStoredValue] = useState<T>(() => {
        if (typeof window === 'undefined') return initialValue;

        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            logger.error('Error reading localStorage', undefined, { data: { key, error } });
            return initialValue;
        }
    });

    const setValue = useCallback(
        (value: T | ((val: T) => T)) => {
            try {
                const valueToStore = value instanceof Function ? value(storedValue) : value;
                setStoredValue(valueToStore);

                if (typeof window !== 'undefined') {
                    window.localStorage.setItem(key, JSON.stringify(valueToStore));
                }
            } catch (error) {
                logger.error('Error setting localStorage', undefined, { data: { key, error } });
            }
        },
        [key, storedValue]
    );

    const removeValue = useCallback(() => {
        try {
            if (typeof window !== 'undefined') {
                window.localStorage.removeItem(key);
            }
            setStoredValue(initialValue);
        } catch (error) {
            logger.error('Error removing localStorage', undefined, { data: { key, error } });
        }
    }, [key, initialValue]);

    return [storedValue, setValue, removeValue];
}

/**
 * Hook for intersection observer (lazy loading, infinite scroll)
 */
export function useIntersectionObserver(
    ref: React.RefObject<Element>,
    options?: IntersectionObserverInit
): boolean {
    const [isIntersecting, setIsIntersecting] = useState(false);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        const observer = new IntersectionObserver(([entry]) => {
            setIsIntersecting(entry.isIntersecting);
        }, options);

        observer.observe(element);

        return () => {
            observer.disconnect();
        };
    }, [ref, options]);

    return isIntersecting;
}

/**
 * Hook for media query
 */
export function useMediaQuery(query: string): boolean {
    const [matches, setMatches] = useState(false);

    useEffect(() => {
        const media = window.matchMedia(query);

        if (media.matches !== matches) {
            setMatches(media.matches);
        }

        const listener = () => setMatches(media.matches);
        media.addEventListener('change', listener);

        return () => media.removeEventListener('change', listener);
    }, [matches, query]);

    return matches;
}

/**
 * Hook for previous value
 */
export function usePrevious<T>(value: T): T | undefined {
    const ref = useRef<T | undefined>(undefined);

    useEffect(() => {
        ref.current = value;
    }, [value]);

    return ref.current;
}

/**
 * Hook for window size
 */
export function useWindowSize() {
    const [windowSize, setWindowSize] = useState({
        width: typeof window !== 'undefined' ? window.innerWidth : 0,
        height: typeof window !== 'undefined' ? window.innerHeight : 0,
    });

    useEffect(() => {
        let timeoutId: NodeJS.Timeout;

        const handleResize = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                setWindowSize({
                    width: window.innerWidth,
                    height: window.innerHeight,
                });
            }, 150);
        };

        window.addEventListener('resize', handleResize);
        return () => {
            clearTimeout(timeoutId);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return windowSize;
}

/**
 * Hook for online/offline status
 */
export function useOnlineStatus(): boolean {
    const [isOnline, setIsOnline] = useState(
        typeof navigator !== 'undefined' ? navigator.onLine : true
    );

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return isOnline;
}

/**
 * Hook for copy to clipboard
 */
export function useCopyToClipboard(): [
    boolean,
    (text: string) => Promise<void>
] {
    const [copied, setCopied] = useState(false);

    const copy = useCallback(async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            logger.error('Failed to copy', error);
            setCopied(false);
        }
    }, []);

    return [copied, copy];
}

/**
 * Hook for async operation with loading state
 */
export function useAsync<T extends (...args: any[]) => Promise<any>>(
    asyncFunction: T
) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const execute = useCallback(
        async (...args: Parameters<T>): Promise<ReturnType<T> | null> => {
            try {
                setLoading(true);
                setError(null);
                const result = await asyncFunction(...args);
                return result;
            } catch (err) {
                setError(err instanceof Error ? err : new Error('Unknown error'));
                return null;
            } finally {
                setLoading(false);
            }
        },
        [asyncFunction]
    );

    return { execute, loading, error };
}

/**
 * Hook for form validation
 */
export function useFormValidation<T extends Record<string, any>>(
    initialValues: T,
    validate: (values: T) => Partial<Record<keyof T, string>>
) {
    const [values, setValues] = useState<T>(initialValues);
    const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
    const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});

    const handleChange = useCallback((name: keyof T, value: any) => {
        setValues((prev) => ({ ...prev, [name]: value }));
    }, []);

    const handleBlur = useCallback((name: keyof T) => {
        setTouched((prev) => ({ ...prev, [name]: true }));
        const validationErrors = validate(values);
        setErrors(validationErrors);
    }, [values, validate]);

    const handleSubmit = useCallback(
        (onSubmit: (values: T) => void) => (e: React.FormEvent) => {
            e.preventDefault();
            const validationErrors = validate(values);
            setErrors(validationErrors);

            if (Object.keys(validationErrors).length === 0) {
                onSubmit(values);
            }
        },
        [values, validate]
    );

    const reset = useCallback(() => {
        setValues(initialValues);
        setErrors({});
        setTouched({});
    }, [initialValues]);

    return {
        values,
        errors,
        touched,
        handleChange,
        handleBlur,
        handleSubmit,
        reset,
    };
}
