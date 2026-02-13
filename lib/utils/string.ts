/**
 * String utility functions
 * Common string manipulation helpers
 */

/**
 * Capitalize first letter of a string
 */
export function capitalize(str: string): string {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Capitalize first letter of each word
 */
export function capitalizeWords(str: string): string {
    if (!str) return '';
    return str
        .split(' ')
        .map((word) => capitalize(word))
        .join(' ');
}

/**
 * Truncate string to specified length
 */
export function truncate(str: string, length: number, suffix: string = '...'): string {
    if (!str || str.length <= length) return str;
    return str.slice(0, length - suffix.length) + suffix;
}

/**
 * Generate slug from string
 */
export function slugify(str: string): string {
    return str
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Format number with thousand separators
 */
export function formatNumber(num: number, locale: string = 'en-US'): string {
    return new Intl.NumberFormat(locale).format(num);
}

/**
 * Format currency
 */
export function formatCurrency(
    amount: number,
    currency: string = 'USD',
    locale: string = 'en-US'
): string {
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
    }).format(amount);
}

/**
 * Format date
 */
export function formatDate(
    date: Date | string,
    options?: Intl.DateTimeFormatOptions,
    locale: string = 'en-US'
): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat(locale, options).format(d);
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`;
    return `${Math.floor(diffInSeconds / 31536000)} years ago`;
}

/**
 * Pluralize word based on count
 */
export function pluralize(count: number, singular: string, plural?: string): string {
    if (count === 1) return singular;
    return plural || `${singular}s`;
}

/**
 * Remove HTML tags from string
 */
export function stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '');
}

/**
 * Escape HTML special characters
 */
export function escapeHtml(str: string): string {
    const map: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
    };
    return str.replace(/[&<>"']/g, (char) => map[char]);
}

/**
 * Generate random string
 */
export function randomString(length: number = 10): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

/**
 * Check if string is valid email
 */
export function isValidEmail(email: string): boolean {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(email);
}

/**
 * Check if string is valid URL
 */
export function isValidUrl(url: string): boolean {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

/**
 * Extract initials from name
 */
export function getInitials(name: string, maxLength: number = 2): string {
    return name
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase())
        .slice(0, maxLength)
        .join('');
}

/**
 * Mask sensitive data (e.g., credit card, email)
 */
export function maskString(str: string, visibleChars: number = 4, maskChar: string = '*'): string {
    if (str.length <= visibleChars) return str;
    const visible = str.slice(-visibleChars);
    const masked = maskChar.repeat(str.length - visibleChars);
    return masked + visible;
}

/**
 * Convert camelCase to Title Case
 */
export function camelToTitle(str: string): string {
    return str
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (char) => char.toUpperCase())
        .trim();
}

/**
 * Convert snake_case to Title Case
 */
export function snakeToTitle(str: string): string {
    return str
        .split('_')
        .map((word) => capitalize(word))
        .join(' ');
}
