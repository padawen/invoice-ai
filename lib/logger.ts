/**
 * Logging utilities for development and production
 * Centralized logging with different levels
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogOptions {
    context?: string;
    data?: any;
    timestamp?: boolean;
}

class Logger {
    private isDevelopment: boolean;

    constructor() {
        this.isDevelopment = process.env.NODE_ENV === 'development';
    }

    private formatMessage(level: LogLevel, message: string, options?: LogOptions): string {
        const parts: string[] = [];

        if (options?.timestamp !== false) {
            parts.push(`[${new Date().toISOString()}]`);
        }

        parts.push(`[${level.toUpperCase()}]`);

        if (options?.context) {
            parts.push(`[${options.context}]`);
        }

        parts.push(message);

        return parts.join(' ');
    }

    /**
     * Debug level logging (only in development)
     */
    debug(message: string, options?: LogOptions): void {
        if (!this.isDevelopment) return;

        const formatted = this.formatMessage('debug', message, options);
        console.debug(formatted, options?.data || '');
    }

    /**
     * Info level logging
     */
    info(message: string, options?: LogOptions): void {
        const formatted = this.formatMessage('info', message, options);
        console.info(formatted, options?.data || '');
    }

    /**
     * Warning level logging
     */
    warn(message: string, options?: LogOptions): void {
        const formatted = this.formatMessage('warn', message, options);
        console.warn(formatted, options?.data || '');
    }

    /**
     * Error level logging
     */
    error(message: string, error?: Error | unknown, options?: LogOptions): void {
        const formatted = this.formatMessage('error', message, options);
        console.error(formatted, error, options?.data || '');

        // In production, you might want to send errors to a service like Sentry
        if (!this.isDevelopment && error instanceof Error) {
            // Example: Sentry.captureException(error);
        }
    }

    /**
     * Log API request
     */
    apiRequest(method: string, endpoint: string, options?: LogOptions): void {
        this.debug(`API Request: ${method} ${endpoint}`, options);
    }

    /**
     * Log API response
     */
    apiResponse(method: string, endpoint: string, status: number, options?: LogOptions): void {
        const level = status >= 400 ? 'error' : status >= 300 ? 'warn' : 'debug';
        this[level](`API Response: ${method} ${endpoint} - ${status}`, options);
    }

    /**
     * Log performance metric
     */
    performance(operation: string, duration: number, options?: LogOptions): void {
        this.debug(`Performance: ${operation} took ${duration.toFixed(2)}ms`, options);
    }

    /**
     * Log user action
     */
    userAction(action: string, options?: LogOptions): void {
        this.info(`User Action: ${action}`, options);
    }

    /**
     * Create a child logger with context
     */
    withContext(context: string): Logger {
        const childLogger = new Logger();
        const originalMethods = {
            debug: childLogger.debug.bind(childLogger),
            info: childLogger.info.bind(childLogger),
            warn: childLogger.warn.bind(childLogger),
            error: childLogger.error.bind(childLogger),
        };

        childLogger.debug = (message: string, options?: LogOptions) =>
            originalMethods.debug(message, { ...options, context });
        childLogger.info = (message: string, options?: LogOptions) =>
            originalMethods.info(message, { ...options, context });
        childLogger.warn = (message: string, options?: LogOptions) =>
            originalMethods.warn(message, { ...options, context });
        childLogger.error = (message: string, error?: Error | unknown, options?: LogOptions) =>
            originalMethods.error(message, error, { ...options, context });

        return childLogger;
    }
}

// Export singleton instance
export const logger = new Logger();

/**
 * Create a logger with context
 */
export function createLogger(context: string): Logger {
    return logger.withContext(context);
}

/**
 * Log group for related logs
 */
export function logGroup(label: string, fn: () => void): void {
    if (process.env.NODE_ENV === 'development') {
        console.group(label);
        fn();
        console.groupEnd();
    }
}

/**
 * Log table for structured data
 */
export function logTable(data: any[]): void {
    if (process.env.NODE_ENV === 'development') {
        console.table(data);
    }
}
