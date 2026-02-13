/**
 * Image optimization utilities for Next.js
 * Helpers for optimizing images and handling image-related operations
 */

/**
 * Generate optimized image URL for next/image
 */
export function getOptimizedImageUrl(
    src: string,
    width: number,
    quality: number = 75
): string {
    // If using next/image, it handles optimization automatically
    // This is a helper for manual optimization if needed
    return src;
}

/**
 * Calculate responsive image sizes
 */
export function getResponsiveSizes(breakpoints: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
}): string {
    const sizes: string[] = [];

    if (breakpoints.mobile) {
        sizes.push(`(max-width: 640px) ${breakpoints.mobile}px`);
    }
    if (breakpoints.tablet) {
        sizes.push(`(max-width: 1024px) ${breakpoints.tablet}px`);
    }
    if (breakpoints.desktop) {
        sizes.push(`${breakpoints.desktop}px`);
    }

    return sizes.join(', ');
}

/**
 * Convert image to WebP format (client-side)
 */
export async function convertToWebP(
    file: File,
    quality: number = 0.8
): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx?.drawImage(img, 0, 0);

            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Failed to convert image'));
                    }
                },
                'image/webp',
                quality
            );
        };

        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = URL.createObjectURL(file);
    });
}

/**
 * Compress image (client-side)
 */
export async function compressImage(
    file: File,
    maxWidth: number = 1920,
    maxHeight: number = 1080,
    quality: number = 0.8
): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        img.onload = () => {
            let { width, height } = img;

            // Calculate new dimensions
            if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
            }
            if (height > maxHeight) {
                width = (width * maxHeight) / height;
                height = maxHeight;
            }

            canvas.width = width;
            canvas.height = height;
            ctx?.drawImage(img, 0, 0, width, height);

            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Failed to compress image'));
                    }
                },
                file.type,
                quality
            );
        };

        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = URL.createObjectURL(file);
    });
}

/**
 * Get image dimensions
 */
export async function getImageDimensions(
    file: File
): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
        const img = new Image();

        img.onload = () => {
            resolve({
                width: img.width,
                height: img.height,
            });
            URL.revokeObjectURL(img.src);
        };

        img.onerror = () => {
            URL.revokeObjectURL(img.src);
            reject(new Error('Failed to load image'));
        };

        img.src = URL.createObjectURL(file);
    });
}

/**
 * Validate image file
 */
export function validateImage(file: File, options?: {
    maxSize?: number; // in bytes
    allowedTypes?: string[];
    maxWidth?: number;
    maxHeight?: number;
}): { valid: boolean; error?: string } {
    const {
        maxSize = 10 * 1024 * 1024, // 10MB default
        allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    } = options || {};

    // Check file type
    if (!allowedTypes.includes(file.type)) {
        return {
            valid: false,
            error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
        };
    }

    // Check file size
    if (file.size > maxSize) {
        const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(2);
        return {
            valid: false,
            error: `File too large. Maximum size: ${maxSizeMB}MB`,
        };
    }

    return { valid: true };
}

/**
 * Generate blur placeholder data URL
 */
export async function generateBlurDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        img.onload = () => {
            // Create tiny version for blur placeholder
            canvas.width = 10;
            canvas.height = 10;
            ctx?.drawImage(img, 0, 0, 10, 10);

            const dataURL = canvas.toDataURL('image/jpeg', 0.1);
            resolve(dataURL);
            URL.revokeObjectURL(img.src);
        };

        img.onerror = () => {
            URL.revokeObjectURL(img.src);
            reject(new Error('Failed to generate blur placeholder'));
        };

        img.src = URL.createObjectURL(file);
    });
}

/**
 * Lazy load image with placeholder
 */
export function createLazyImage(options: {
    src: string;
    placeholder?: string;
    onLoad?: () => void;
    onError?: (error: Error) => void;
}): HTMLImageElement {
    const img = new Image();

    if (options.placeholder) {
        img.src = options.placeholder;
    }

    img.dataset.src = options.src;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                const lazyImage = entry.target as HTMLImageElement;
                const src = lazyImage.dataset.src;

                if (src) {
                    lazyImage.src = src;
                    lazyImage.onload = () => options.onLoad?.();
                    lazyImage.onerror = () => options.onError?.(new Error('Failed to load image'));
                }

                observer.unobserve(lazyImage);
            }
        });
    });

    observer.observe(img);
    return img;
}

/**
 * Preload critical images
 */
export function preloadImages(urls: string[]): Promise<void[]> {
    return Promise.all(
        urls.map(
            (url) =>
                new Promise<void>((resolve, reject) => {
                    const img = new Image();
                    img.onload = () => resolve();
                    img.onerror = () => reject(new Error(`Failed to preload ${url}`));
                    img.src = url;
                })
        )
    );
}

/**
 * Image format support detection
 */
export const imageFormatSupport = {
    webp: (() => {
        if (typeof window === 'undefined') return false;
        const canvas = document.createElement('canvas');
        return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    })(),

    avif: (() => {
        if (typeof window === 'undefined') return false;
        const canvas = document.createElement('canvas');
        return canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0;
    })(),
};

/**
 * Get best image format for browser
 */
export function getBestImageFormat(): 'avif' | 'webp' | 'jpeg' {
    if (imageFormatSupport.avif) return 'avif';
    if (imageFormatSupport.webp) return 'webp';
    return 'jpeg';
}
