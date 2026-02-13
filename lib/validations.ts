import { z } from 'zod';

/**
 * Validation schemas for API routes
 * Using Zod for runtime type checking and validation
 */

// Invoice data item schema
export const invoiceDataItemSchema = z.object({
    name: z.string().min(1, 'Item name is required'),
    quantity: z.union([z.string(), z.number()]).transform(val => String(val)),
    unit_price: z.union([z.string(), z.number()]).transform(val => String(val)),
    net: z.union([z.string(), z.number()]).transform(val => String(val)),
    gross: z.union([z.string(), z.number()]).transform(val => String(val)),
    currency: z.string().optional(),
    vat_rate: z.union([z.string(), z.number()]).optional().transform(val => val ? String(val) : undefined),
});

export type InvoiceDataItem = z.infer<typeof invoiceDataItemSchema>;

// Seller schema
export const sellerSchema = z.object({
    name: z.string().min(1, 'Seller name is required'),
    address: z.string().optional(),
    tax_id: z.string().optional(),
    email: z.string().email('Invalid email').optional().or(z.literal('')),
    phone: z.string().optional(),
});

// Buyer schema
export const buyerSchema = z.object({
    name: z.string().min(1, 'Buyer name is required'),
    address: z.string().optional(),
    tax_id: z.string().optional(),
});

// Process images request schema
export const processImagesRequestSchema = z.object({
    images: z.array(z.string().url('Invalid image URL'))
        .min(1, 'At least one image is required')
        .max(10, 'Maximum 10 images allowed'),
});

export type ProcessImagesRequest = z.infer<typeof processImagesRequestSchema>;

// Process images response schema
export const processImagesResponseSchema = z.object({
    id: z.string().uuid(),
    seller: sellerSchema,
    buyer: buyerSchema,
    invoice_number: z.string(),
    issue_date: z.string(),
    fulfillment_date: z.string().optional(),
    due_date: z.string().optional(),
    payment_method: z.string().optional(),
    currency: z.string().default('HUF'),
    invoice_data: z.array(invoiceDataItemSchema),
});

export type ProcessImagesResponse = z.infer<typeof processImagesResponseSchema>;

// Save processed data request schema
export const saveProcessedDataRequestSchema = z.object({
    projectId: z.string().uuid('Invalid project ID'),
    fields: z.object({
        seller: sellerSchema,
        buyer: buyerSchema,
        invoice_number: z.string().min(1, 'Invoice number is required'),
        issue_date: z.string().min(1, 'Issue date is required'),
        fulfillment_date: z.string().optional(),
        due_date: z.string().optional(),
        payment_method: z.string().optional(),
        currency: z.string().default('HUF'),
        invoice_data: z.array(invoiceDataItemSchema).min(1, 'At least one invoice item is required'),
    }),
    extractionMethod: z.enum(['openai', 'privacy']).optional(),
    extractionTime: z.number().optional(),
});

export type SaveProcessedDataRequest = z.infer<typeof saveProcessedDataRequestSchema>;

// Delete processed item request schema
export const deleteProcessedItemRequestSchema = z.object({
    id: z.string().uuid('Invalid item ID'),
});

export type DeleteProcessedItemRequest = z.infer<typeof deleteProcessedItemRequestSchema>;

// Update project request schema
export const updateProjectRequestSchema = z.object({
    itemId: z.string().uuid('Invalid item ID'),
    projectId: z.string().uuid('Invalid project ID'),
});

export type UpdateProjectRequest = z.infer<typeof updateProjectRequestSchema>;

// Project request schemas
export const createProjectRequestSchema = z.object({
    name: z.string().min(1, 'Project name is required').max(100, 'Project name too long'),
});

export const deleteProjectRequestSchema = z.object({
    id: z.string().uuid('Invalid project ID'),
});

// Privacy API schemas
export const privacyProcessRequestSchema = z.object({
    images: z.array(z.string()).min(1, 'At least one image is required'),
});

export const privacyJobIdSchema = z.object({
    jobId: z.string().min(1, 'Job ID is required'),
});

// Rate limit configuration
export const rateLimitConfigSchema = z.object({
    limit: z.number().int().positive(),
    interval: z.number().int().positive(),
});

/**
 * Helper function to validate request body
 * Returns validated data or throws ZodError
 */
export function validateRequestBody<T>(
    schema: z.ZodSchema<T>,
    data: unknown
): T {
    return schema.parse(data);
}

/**
 * Helper function to safely validate request body
 * Returns { success: true, data } or { success: false, error }
 */
export function safeValidateRequestBody<T>(
    schema: z.ZodSchema<T>,
    data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
    const result = schema.safeParse(data);
    if (result.success) {
        return { success: true, data: result.data };
    }
    return { success: false, error: result.error };
}

/**
 * Format Zod errors for API responses
 */
export function formatZodError(error: z.ZodError): {
    message: string;
    errors: Array<{ path: string; message: string }>;
} {
    return {
        message: 'Validation failed',
        errors: error.issues.map((err: z.ZodIssue) => ({
            path: err.path.join('.'),
            message: err.message,
        })),
    };
}

// Job ID param schema for proxy routes
export const jobIdParamSchema = z.object({
    jobId: z.string().min(1, 'Job ID is required'),
});

export type JobIdParam = z.infer<typeof jobIdParamSchema>;

