/**
 * Performance monitoring utilities for Next.js 16
 * Track and log performance metrics
 */

import { logger } from './logger';

export interface PerformanceMetric {
    name: string;
    duration: number;
    timestamp: number;
}

class PerformanceMonitor {
    private metrics: Map<string, number> = new Map();
    private enabled: boolean;

    constructor() {
        this.enabled = process.env.NODE_ENV === 'development';
    }

    /**
     * Start timing an operation
     */
    start(name: string): void {
        if (!this.enabled) return;
        this.metrics.set(name, performance.now());
    }

    /**
     * End timing an operation and log the result
     */
    end(name: string): number | null {
        if (!this.enabled) return null;

        const startTime = this.metrics.get(name);
        if (!startTime) {
            logger.warn('Performance metric was never started', { data: { name } });
            return null;
        }

        const duration = performance.now() - startTime;
        this.metrics.delete(name);

        logger.debug(`⚡ ${name}: ${duration.toFixed(2)}ms`);
        return duration;
    }

    /**
     * Measure an async function
     */
    async measure<T>(name: string, fn: () => Promise<T>): Promise<T> {
        if (!this.enabled) return fn();

        this.start(name);
        try {
            const result = await fn();
            this.end(name);
            return result;
        } catch (error) {
            this.end(name);
            throw error;
        }
    }

    /**
     * Measure a synchronous function
     */
    measureSync<T>(name: string, fn: () => T): T {
        if (!this.enabled) return fn();

        this.start(name);
        try {
            const result = fn();
            this.end(name);
            return result;
        } catch (error) {
            this.end(name);
            throw error;
        }
    }

    /**
     * Clear all metrics
     */
    clear(): void {
        this.metrics.clear();
    }
}

// Export singleton instance
export const perf = new PerformanceMonitor();

/**
 * Web Vitals tracking
 */
export function reportWebVitals(metric: {
    id: string;
    name: string;
    value: number;
    label: 'web-vital' | 'custom';
}): void {
    if (process.env.NODE_ENV === 'development') {
        logger.debug(`📊 ${metric.name}:`, { data: { value: metric.value } });
    }

    // Send to analytics service in production
    if (process.env.NODE_ENV === 'production') {
        // Example: Send to Google Analytics, Vercel Analytics, etc.
        // window.gtag?.('event', metric.name, {
        //   value: Math.round(metric.value),
        //   metric_id: metric.id,
        //   metric_label: metric.label,
        // });
    }
}

/**
 * Measure component render time
 */
export function useRenderTime(componentName: string): void {
    if (process.env.NODE_ENV === 'development') {
        const startTime = performance.now();

        // This will run after render
        setTimeout(() => {
            const duration = performance.now() - startTime;
            logger.debug(`🎨 ${componentName} render: ${duration.toFixed(2)}ms`);
        }, 0);
    }
}

/**
 * Debounce function for performance
 */
export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null;

    return function executedFunction(...args: Parameters<T>) {
        const later = () => {
            timeout = null;
            func(...args);
        };

        if (timeout) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle function for performance
 */
export function throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
): (...args: Parameters<T>) => void {
    let inThrottle: boolean;

    return function executedFunction(...args: Parameters<T>) {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => (inThrottle = false), limit);
        }
    };
}

/**
 * Lazy load images with intersection observer
 */
export function lazyLoadImage(
    img: HTMLImageElement,
    src: string,
    options?: IntersectionObserverInit
): () => void {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                img.src = src;
                observer.disconnect();
            }
        });
    }, options);

    observer.observe(img);

    // Return cleanup function
    return () => observer.disconnect();
}

/**
 * Preload critical resources
 */
export function preloadResource(href: string, as: string): void {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    document.head.appendChild(link);
}

/**
 * Prefetch next page for faster navigation
 */
export function prefetchPage(href: string): void {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = href;
    document.head.appendChild(link);
}
