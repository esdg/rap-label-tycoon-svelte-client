/**
 * Centralized error handling utilities for the application
 */

import { ApiError, TaskCreationError } from '$lib/api/client';

/**
 * Base application error class
 */
export class AppError extends Error {
	public readonly title: string;
	public readonly userMessage: string;
	public readonly originalError?: Error;

	constructor(title: string, userMessage: string, originalError?: Error) {
		super(userMessage);
		this.name = 'AppError';
		this.title = title;
		this.userMessage = userMessage;
		this.originalError = originalError;
	}
}

/**
 * Convert any error into a user-friendly message with title
 */
export function getUserFriendlyError(error: unknown): { title: string; message: string } {
	// TaskCreationError (API task validation errors)
	if (error instanceof TaskCreationError) {
		return {
			title: 'Task Creation Failed',
			message: error.message
		};
	}

	// ApiError (HTTP errors)
	if (error instanceof ApiError) {
		const statusMessages: Record<number, string> = {
			400: 'Invalid request. Please check your input.',
			401: 'Authentication required. Please log in.',
			403: 'You do not have permission to perform this action.',
			404: 'Resource not found.',
			409: 'This action conflicts with existing data.',
			500: 'Server error. Please try again later.',
			502: 'Service temporarily unavailable.',
			503: 'Service temporarily unavailable.'
		};

		return {
			title: 'Request Failed',
			message: error.message || statusMessages[error.status] || 'An unexpected error occurred.'
		};
	}

	// AppError (application-specific errors)
	if (error instanceof AppError) {
		return {
			title: error.title,
			message: error.userMessage
		};
	}

	// Standard Error
	if (error instanceof Error) {
		return {
			title: 'Error',
			message: error.message || 'An unexpected error occurred.'
		};
	}

	// Unknown error type
	return {
		title: 'Error',
		message: 'An unexpected error occurred. Please try again.'
	};
}

/**
 * Log error to console in development mode only
 */
export function logError(context: string, error: unknown): void {
	if (import.meta.env.DEV) {
		console.error(`[${context}]`, error);
	}
}

/**
 * Handle error by logging it and returning a user-friendly message
 */
export function handleError(context: string, error: unknown): { title: string; message: string } {
	logError(context, error);
	return getUserFriendlyError(error);
}
