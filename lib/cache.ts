/**
 * Caching utilities for Next.js 16
 * Helpers for implementing caching strategies
 */

/**
 * Simple in-memory cache with TTL
 */
export class MemoryCache<T> {
    private cache: Map<string, { value: T; expires: number }> = new Map();

    /**
     * Set a value in cache with TTL
     * @param key Cache key
     * @param value Value to cache
     * @param ttl Time to live in milliseconds
     */
    set(key: string, value: T, ttl: number = 60000): void {
        const expires = Date.now() + ttl;
        this.cache.set(key, { value, expires });
    }

    /**
     * Get a value from cache
     * Returns null if not found or expired
     */
    get(key: string): T | null {
        const item = this.cache.get(key);

        if (!item) return null;

        if (Date.now() > item.expires) {
            this.cache.delete(key);
            return null;
        }

        return item.value;
    }

    /**
     * Check if key exists and is not expired
     */
    has(key: string): boolean {
        return this.get(key) !== null;
    }

    /**
     * Delete a key from cache
     */
    delete(key: string): boolean {
        return this.cache.delete(key);
    }

    /**
     * Clear all cache
     */
    clear(): void {
        this.cache.clear();
    }

    /**
     * Get or set pattern
     * If key exists, return cached value
     * Otherwise, execute fn, cache result, and return
     */
    async getOrSet(
        key: string,
        fn: () => Promise<T>,
        ttl: number = 60000
    ): Promise<T> {
        const cached = this.get(key);
        if (cached !== null) return cached;

        const value = await fn();
        this.set(key, value, ttl);
        return value;
    }

    /**
     * Clean up expired entries
     */
    cleanup(): void {
        const now = Date.now();
        for (const [key, item] of this.cache.entries()) {
            if (now > item.expires) {
                this.cache.delete(key);
            }
        }
    }

    /**
     * Get cache size
     */
    get size(): number {
        return this.cache.size;
    }
}

/**
 * Browser storage cache (localStorage/sessionStorage)
 */
export class StorageCache<T> {
    private storage: Storage;
    private prefix: string;

    constructor(type: 'local' | 'session' = 'local', prefix: string = 'cache_') {
        this.storage = type === 'local' ? localStorage : sessionStorage;
        this.prefix = prefix;
    }

    private getKey(key: string): string {
        return `${this.prefix}${key}`;
    }

    /**
     * Set a value in storage with TTL
     */
    set(key: string, value: T, ttl: number = 3600000): void {
        const item = {
            value,
            expires: Date.now() + ttl,
        };
        this.storage.setItem(this.getKey(key), JSON.stringify(item));
    }

    /**
     * Get a value from storage
     */
    get(key: string): T | null {
        const itemStr = this.storage.getItem(this.getKey(key));
        if (!itemStr) return null;

        try {
            const item = JSON.parse(itemStr);

            if (Date.now() > item.expires) {
                this.delete(key);
                return null;
            }

            return item.value;
        } catch {
            return null;
        }
    }

    /**
     * Delete a key from storage
     */
    delete(key: string): void {
        this.storage.removeItem(this.getKey(key));
    }

    /**
     * Clear all cache with this prefix
     */
    clear(): void {
        const keys: string[] = [];
        for (let i = 0; i < this.storage.length; i++) {
            const key = this.storage.key(i);
            if (key?.startsWith(this.prefix)) {
                keys.push(key);
            }
        }
        keys.forEach(key => this.storage.removeItem(key));
    }
}

/**
 * Cache tags for invalidation
 */
export class TaggedCache<T> extends MemoryCache<T> {
    private tags: Map<string, Set<string>> = new Map();

    /**
     * Set a value with tags
     */
    setWithTags(key: string, value: T, tags: string[], ttl: number = 60000): void {
        this.set(key, value, ttl);

        tags.forEach(tag => {
            if (!this.tags.has(tag)) {
                this.tags.set(tag, new Set());
            }
            this.tags.get(tag)!.add(key);
        });
    }

    /**
     * Invalidate all entries with a specific tag
     */
    invalidateTag(tag: string): void {
        const keys = this.tags.get(tag);
        if (!keys) return;

        keys.forEach(key => this.delete(key));
        this.tags.delete(tag);
    }

    /**
     * Invalidate multiple tags
     */
    invalidateTags(tags: string[]): void {
        tags.forEach(tag => this.invalidateTag(tag));
    }

    /**
     * Clear all cache and tags
     */
    override clear(): void {
        super.clear();
        this.tags.clear();
    }
}

/**
 * Request deduplication
 * Prevents multiple identical requests from being made simultaneously
 */
export class RequestDeduplicator<T> {
    private pending: Map<string, Promise<T>> = new Map();

    /**
     * Execute a request with deduplication
     * If the same key is already pending, return the existing promise
     */
    async execute(key: string, fn: () => Promise<T>): Promise<T> {
        const existing = this.pending.get(key);
        if (existing) return existing;

        const promise = fn().finally(() => {
            this.pending.delete(key);
        });

        this.pending.set(key, promise);
        return promise;
    }

    /**
     * Clear all pending requests
     */
    clear(): void {
        this.pending.clear();
    }
}

// Export singleton instances for common use cases
export const memoryCache = new MemoryCache();
export const projectCache = new TaggedCache();
export const requestDeduplicator = new RequestDeduplicator();

/**
 * Cache key generators
 */
export const cacheKeys = {
    project: (id: string) => `project:${id}`,
    projects: (userId: string) => `projects:${userId}`,
    processedData: (projectId: string) => `processed:${projectId}`,
    stats: (projectId: string) => `stats:${projectId}`,
    user: (userId: string) => `user:${userId}`,
};

/**
 * Cache tags
 */
export const cacheTags = {
    projects: 'projects',
    processedData: 'processed-data',
    stats: 'stats',
    user: 'user',
};
