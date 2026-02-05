/**
 * Error handling utilities
 * Centralized error parsing and user-friendly message generation
 */

import { TaskCreationErrorType } from "$lib/types/task";

/**
 * Extracts the Firebase error code from an error object
 *
 * @param error - The error object (typically from Firebase SDK)
 * @returns The Firebase error code or undefined if not a Firebase error
 */
export function getFirebaseErrorCode(error: unknown): string | undefined {
    if (error && typeof error === 'object' && 'code' in error) {
        return (error as { code: string }).code;
    }
    return undefined;
}

/**
 * Converts a Firebase error to a user-friendly message
 *
 * @param error - The error object
 * @param defaultMessage - Fallback message if error type is unknown
 * @returns A user-friendly error message
 */
export function getFirebaseErrorMessage(error: unknown, defaultMessage: string): string {
    const code = getFirebaseErrorCode(error);
    if (!code) {
        return error instanceof Error ? error.message : defaultMessage;
    }

    switch (code) {
        // Authentication errors
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
            return 'Invalid email or password';
        case 'auth/invalid-email':
            return 'Invalid email address';
        case 'auth/too-many-requests':
            return 'Too many failed attempts. Please try again later.';
        case 'auth/email-already-in-use':
            return 'An account with this email already exists';
        case 'auth/weak-password':
            return 'Password is too weak';
        case 'auth/popup-closed-by-user':
            return 'Sign-in cancelled';
        case 'auth/network-request-failed':
            return 'Network error. Please check your connection.';
        case 'auth/user-disabled':
            return 'This account has been disabled';
        case 'auth/requires-recent-login':
            return 'Please sign in again to complete this action';
        default:
            return error instanceof Error ? error.message : defaultMessage;
    }
}

/**
 * Checks if an error is a specific Firebase error code
 *
 * @param error - The error object
 * @param code - The Firebase error code to check for
 * @returns True if the error matches the code
 */
export function isFirebaseError(error: unknown, code: string): boolean {
    return getFirebaseErrorCode(error) === code;
}

/**
 * Extracts a message from any error type
 *
 * @param error - The error (Error, string, or unknown)
 * @param defaultMessage - Fallback message
 * @returns The error message
 */
export function getErrorMessage(error: unknown, defaultMessage: string = 'An error occurred'): string {
    if (error instanceof Error) {
        return error.message;
    }
    if (typeof error === 'string') {
        return error;
    }
    if (error && typeof error === 'object' && 'message' in error) {
        return String((error as { message: unknown }).message);
    }
    return defaultMessage;
}


export function getTaskErrorMessage(errorCode: number, defaultMessage: string): string {
    const errorMessages: Record<number, string> = {
        [TaskCreationErrorType.NotFound]: 'Resource not found. Please try again.',
        [TaskCreationErrorType.ValidationError]: 'Invalid request. Please check your selections.',
        [TaskCreationErrorType.InsufficientBudget]:
            'Insufficient budget. You need more funds to start this scouting task.',
        [TaskCreationErrorType.WorkerBusy]:
            'You are already assigned to another active task. Complete it first.',
        [TaskCreationErrorType.TaskLimitReached]:
            'Your label has reached the maximum number of active tasks.',
        [TaskCreationErrorType.ActiveContractExists]: 'This artist already has an active contract.',
        [TaskCreationErrorType.WorkerExhausted]:
            'You are exhausted and need to rest before taking on new tasks.'
    };
    return errorMessages[errorCode] || defaultMessage;
}