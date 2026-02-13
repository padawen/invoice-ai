/**
 * Constants used throughout the application
 * Centralized configuration values
 */

/**
 * Application metadata
 */
export const APP_NAME = 'Invoice AI';
export const APP_DESCRIPTION = 'AI-powered invoice processing that automates your workflow';
export const APP_VERSION = '1.0.0';

/**
 * API Configuration
 */
export const API_CONFIG = {
    timeout: 30000, // 30 seconds
    retryAttempts: 3,
    retryDelay: 1000, // 1 second
} as const;

/**
 * Cache Configuration
 */
export const CACHE_CONFIG = {
    defaultTTL: 60000, // 1 minute
    projectsTTL: 300000, // 5 minutes
    statsTTL: 60000, // 1 minute
    userTTL: 600000, // 10 minutes
} as const;

/**
 * Image Configuration
 */
export const IMAGE_CONFIG = {
    maxSize: 10 * 1024 * 1024, // 10MB
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 0.8,
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    maxImagesPerUpload: 10,
} as const;

/**
 * Validation Rules
 */
export const VALIDATION = {
    projectName: {
        minLength: 1,
        maxLength: 100,
    },
    sellerName: {
        minLength: 1,
        maxLength: 200,
    },
    email: {
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
} as const;

/**
 * UI Configuration
 */
export const UI_CONFIG = {
    debounceDelay: 300,
    throttleDelay: 100,
    toastDuration: 3000,
    animationDuration: 150,
} as const;

/**
 * Route paths
 */
export const ROUTES = {
    home: '/',
    dashboard: '/dashboard',
    upload: '/upload',
    login: '/auth/login',
    signup: '/auth/signup',
    project: (slug: string) => `/projects/${slug}`,
    editInvoice: (projectSlug: string, itemId: string) =>
        `/projects/${projectSlug}/processed/${itemId}/edit`,
} as const;

/**
 * API endpoints
 */
export const API_ENDPOINTS = {
    processImages: '/api/processImages',
    saveProcessedData: '/api/saveProcessedData',
    processed: '/api/processed',
    updateProject: '/api/processed/updateProject',
    project: '/api/project',
} as const;

/**
 * Storage keys
 */
export const STORAGE_KEYS = {
    theme: 'invoice-ai-theme',
    recentProjects: 'invoice-ai-recent-projects',
    userPreferences: 'invoice-ai-preferences',
} as const;

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
    generic: 'Something went wrong. Please try again.',
    network: 'Network error. Please check your connection.',
    unauthorized: 'You must be logged in to perform this action.',
    notFound: 'The requested resource was not found.',
    validation: 'Please check your input and try again.',
    serverError: 'Server error. Please try again later.',
} as const;

/**
 * Success messages
 */
export const SUCCESS_MESSAGES = {
    projectCreated: 'Project created successfully!',
    projectDeleted: 'Project deleted successfully!',
    invoiceSaved: 'Invoice saved successfully!',
    invoiceDeleted: 'Invoice deleted successfully!',
    dataCopied: 'Data copied to clipboard!',
} as const;

/**
 * Feature flags (default values)
 */
export const DEFAULT_FEATURES = {
    enableAnalytics: false,
    enableDebugMode: false,
    enablePrivacyMode: true,
} as const;

/**
 * Regex patterns
 */
export const PATTERNS = {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    phone: /^\+?[\d\s\-()]+$/,
    uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    url: /^https?:\/\/.+/,
} as const;
