import { describe, it, expect } from '@jest/globals';
import {
  AppError,
  ValidationError,
  AuthenticationError,
  NotFoundError,
  ExternalServiceError,
  getUserFriendlyError,
} from '@/lib/errors';

describe('Error Classes', () => {
  it('should create AppError with correct properties', () => {
    const error = new AppError('Test error', 400, 'TEST_ERROR');
    expect(error.message).toBe('Test error');
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe('TEST_ERROR');
    expect(error.name).toBe('AppError');
  });

  it('should create ValidationError with 400 status', () => {
    const error = new ValidationError('Invalid input');
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe('VALIDATION_ERROR');
  });

  it('should create AuthenticationError with 401 status', () => {
    const error = new AuthenticationError();
    expect(error.statusCode).toBe(401);
    expect(error.message).toBe('Unauthorized');
  });

  it('should create NotFoundError with 404 status', () => {
    const error = new NotFoundError();
    expect(error.statusCode).toBe(404);
  });

  it('should create ExternalServiceError with service name', () => {
    const error = new ExternalServiceError('OpenAI', 'API timeout');
    expect(error.message).toBe('OpenAI: API timeout');
    expect(error.statusCode).toBe(503);
  });
});

describe('getUserFriendlyError', () => {
  it('should return AppError message', () => {
    const error = new ValidationError('Invalid email');
    expect(getUserFriendlyError(error)).toBe('Invalid email');
  });

  it('should handle AbortError', () => {
    const error = new Error('AbortError');
    error.name = 'AbortError';
    expect(getUserFriendlyError(error)).toBe('Request timed out. Please try again.');
  });

  it('should handle ECONNREFUSED', () => {
    const error = new Error('ECONNREFUSED - connection refused');
    expect(getUserFriendlyError(error)).toContain('Unable to connect');
  });

  it('should return generic message for unknown errors', () => {
    expect(getUserFriendlyError('unknown')).toBe('An unexpected error occurred. Please try again.');
  });
});
