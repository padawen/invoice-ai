/**
 * Array utility functions
 * Common array manipulation helpers
 */

/**
 * Remove duplicates from array
 */
export function unique<T>(array: T[]): T[] {
    return [...new Set(array)];
}

/**
 * Remove duplicates by key
 */
export function uniqueBy<T>(array: T[], key: keyof T): T[] {
    const seen = new Set();
    return array.filter((item) => {
        const value = item[key];
        if (seen.has(value)) return false;
        seen.add(value);
        return true;
    });
}

/**
 * Group array by key
 */
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
    return array.reduce((result, item) => {
        const groupKey = String(item[key]);
        if (!result[groupKey]) {
            result[groupKey] = [];
        }
        result[groupKey].push(item);
        return result;
    }, {} as Record<string, T[]>);
}

/**
 * Sort array by key
 */
export function sortBy<T>(array: T[], key: keyof T, order: 'asc' | 'desc' = 'asc'): T[] {
    return [...array].sort((a, b) => {
        const aVal = a[key];
        const bVal = b[key];

        if (aVal < bVal) return order === 'asc' ? -1 : 1;
        if (aVal > bVal) return order === 'asc' ? 1 : -1;
        return 0;
    });
}

/**
 * Chunk array into smaller arrays
 */
export function chunk<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}

/**
 * Shuffle array randomly
 */
export function shuffle<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/**
 * Get random item from array
 */
export function randomItem<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
}

/**
 * Get random items from array
 */
export function randomItems<T>(array: T[], count: number): T[] {
    return shuffle(array).slice(0, count);
}

/**
 * Move item in array
 */
export function moveItem<T>(array: T[], fromIndex: number, toIndex: number): T[] {
    const result = [...array];
    const [removed] = result.splice(fromIndex, 1);
    result.splice(toIndex, 0, removed);
    return result;
}

/**
 * Sum array of numbers
 */
export function sum(array: number[]): number {
    return array.reduce((acc, val) => acc + val, 0);
}

/**
 * Average of array of numbers
 */
export function average(array: number[]): number {
    if (array.length === 0) return 0;
    return sum(array) / array.length;
}

/**
 * Find min value in array
 */
export function min(array: number[]): number {
    return Math.min(...array);
}

/**
 * Find max value in array
 */
export function max(array: number[]): number {
    return Math.max(...array);
}

/**
 * Check if arrays are equal
 */
export function arraysEqual<T>(a: T[], b: T[]): boolean {
    if (a.length !== b.length) return false;
    return a.every((val, index) => val === b[index]);
}

/**
 * Intersection of two arrays
 */
export function intersection<T>(a: T[], b: T[]): T[] {
    const setB = new Set(b);
    return a.filter((item) => setB.has(item));
}

/**
 * Difference of two arrays (items in a but not in b)
 */
export function difference<T>(a: T[], b: T[]): T[] {
    const setB = new Set(b);
    return a.filter((item) => !setB.has(item));
}

/**
 * Union of two arrays
 */
export function union<T>(a: T[], b: T[]): T[] {
    return unique([...a, ...b]);
}

/**
 * Flatten nested array
 */
export function flatten<T>(array: any[]): T[] {
    return array.reduce((acc, val) => {
        return acc.concat(Array.isArray(val) ? flatten(val) : val);
    }, []);
}

/**
 * Compact array (remove falsy values)
 */
export function compact<T>(array: (T | null | undefined | false | 0 | '')[]): T[] {
    return array.filter(Boolean) as T[];
}

/**
 * Partition array into two arrays based on predicate
 */
export function partition<T>(array: T[], predicate: (item: T) => boolean): [T[], T[]] {
    const truthy: T[] = [];
    const falsy: T[] = [];

    array.forEach((item) => {
        if (predicate(item)) {
            truthy.push(item);
        } else {
            falsy.push(item);
        }
    });

    return [truthy, falsy];
}

/**
 * Count occurrences in array
 */
export function countOccurrences<T>(array: T[]): Map<T, number> {
    return array.reduce((map, item) => {
        map.set(item, (map.get(item) || 0) + 1);
        return map;
    }, new Map<T, number>());
}
