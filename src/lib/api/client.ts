// Centralized API configuration and base fetch utility
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5122';

// Custom error class for API errors with proper typing
export class ApiError extends Error {
    constructor(
        message: string,
        public status: number,
        public code?: string
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

// Task creation error response type (for backward compatibility)
export interface TaskCreationErrorResponse {
    code: number;
    message: string;
}

// Task creation specific error
export class TaskCreationError extends ApiError {
    public errorResponse: TaskCreationErrorResponse;

    constructor(
        message: string,
        public errorCode: number,
        status: number = 400
    ) {
        super(message, status, String(errorCode));
        this.name = 'TaskCreationError';
        // Provide errorResponse for backward compatibility
        this.errorResponse = { code: errorCode, message };
    }
}

// Response type for endpoints that include server time
export interface TimestampedResponse<T> {
    data: T;
    serverTime: Date;
}

// Base fetch utility with error handling
export async function apiFetch<T>(
    endpoint: string,
    options?: RequestInit
): Promise<T> {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
        },
    });

    if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new ApiError(
            errorBody?.message || response.statusText || 'API request failed',
            response.status,
            errorBody?.code
        );
    }

    return response.json();
}

// Fetch with server time extraction (for time-sensitive operations)
export async function apiFetchWithTime<T>(
    endpoint: string,
    options?: RequestInit
): Promise<TimestampedResponse<T>> {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
        },
    });

    if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new ApiError(
            errorBody?.message || response.statusText || 'API request failed',
            response.status,
            errorBody?.code
        );
    }

    const data = await response.json();
    const serverTimeHeader = response.headers.get('x-server-time');
    const serverTime = serverTimeHeader ? new Date(serverTimeHeader) : new Date();

    return { data, serverTime };
}

/**
 * Specialized POST request for task creation endpoints
 * Handles the special error response format used by task endpoints
 * (returns { code, message } on error instead of standard error format)
 */
export async function apiPostTask<T, R>(
    endpoint: string,
    data: T
): Promise<R> {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });

    const result = await response.json();

    // Task endpoints return { code, message } on error
    if (!response.ok || ('code' in result && 'message' in result)) {
        throw new TaskCreationError(result.message, result.code, response.status);
    }

    return result as R;
}

// Re-export API_BASE_URL for backward compatibility
export { API_BASE_URL };
