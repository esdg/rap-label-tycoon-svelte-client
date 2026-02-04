// Tasks API functions
import { apiFetch, apiFetchWithTime, TaskCreationError, type TimestampedResponse } from './client';
import type { TaskResponse, TaskCostPrediction } from '$lib/types/task';
import type { ScoutingTaskRequest, ScoutingScope } from '$lib/types/scoutingArtistsTask';
import type { SignArtistContractRequest } from '$lib/types/SigningContractTask';

// Re-export TaskCreationError for convenience
export { TaskCreationError } from './client';

// Fetch all tasks for a label (with server time for sync)
export async function fetchLabelTasks(labelId: string): Promise<TimestampedResponse<TaskResponse[]>> {
    return apiFetchWithTime<TaskResponse[]>(`/api/v1/rap-labels/${labelId}/tasks`);
}

// Claim a completed task
export async function claimTask(taskId: string): Promise<TaskResponse> {
    return apiFetch<TaskResponse>(`/api/v1/tasks/${taskId}/claim`, {
        method: 'PUT',
    });
}

// Scouting tasks
export async function fetchScoutingScopes(): Promise<ScoutingScope[]> {
    return apiFetch<ScoutingScope[]>('/api/v1/scouting-scopes');
}

export async function predictScoutingCost(data: ScoutingTaskRequest): Promise<TaskCostPrediction> {
    return apiFetch<TaskCostPrediction>('/api/v1/tasks/scouting/predict-cost', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function createScoutingTask(data: ScoutingTaskRequest): Promise<TaskResponse> {
    const response = await fetch('http://localhost:5122/api/v1/tasks/scouting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });

    const result = await response.json();

    // Check for task creation error response
    if (!response.ok || ('code' in result && 'message' in result)) {
        throw new TaskCreationError(result.message, result.code, response.status);
    }

    return result as TaskResponse;
}

// Contract tasks
export async function predictSignArtistContractCost(data: SignArtistContractRequest): Promise<TaskCostPrediction> {
    return apiFetch<TaskCostPrediction>('/api/v1/tasks/sign-artist-contract/predict-cost', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function createSignArtistContractTask(data: SignArtistContractRequest): Promise<TaskResponse> {
    const response = await fetch('http://localhost:5122/api/v1/tasks/sign-artist-contract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok || ('code' in result && 'message' in result)) {
        throw new TaskCreationError(result.message, result.code, response.status);
    }

    return result as TaskResponse;
}
