import type { ScoutingScope, ScoutingTaskRequest, ScoutingTaskResponse, TaskCreationErrorResponse, ScoutingCostPrediction } from './types/scouting';

const API_BASE_URL = 'http://localhost:5122';

// Custom error class for task creation errors
export class TaskCreationError extends Error {
    constructor(public errorResponse: TaskCreationErrorResponse) {
        super(errorResponse.message);
        this.name = 'TaskCreationError';
    }
}

export async function api<T>(url: string, options?: RequestInit): Promise<T> {
    const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
    const response = await fetch(fullUrl, options);
    if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
    }
    return response.json();
}

// Scouting API functions
export async function fetchScoutingScopes(): Promise<ScoutingScope[]> {
    return api<ScoutingScope[]>('/api/v1/scouting-scopes');
}

export async function createScoutingTask(data: ScoutingTaskRequest): Promise<ScoutingTaskResponse> {
    const fullUrl = `${API_BASE_URL}/api/v1/tasks/scouting`;
    const response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });

    const result = await response.json();

    // Check if the response indicates an error (has 'code' and 'message' properties)
    if (!response.ok || ('code' in result && 'message' in result)) {
        throw new TaskCreationError(result as TaskCreationErrorResponse);
    }

    return result as ScoutingTaskResponse;
}

export async function predictScoutingCost(data: ScoutingTaskRequest): Promise<ScoutingCostPrediction> {
    const fullUrl = `${API_BASE_URL}/api/v1/tasks/scouting/predict-cost`;
    const response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        throw new Error(`Failed to predict scouting cost: ${response.statusText}`);
    }

    return response.json();
}
