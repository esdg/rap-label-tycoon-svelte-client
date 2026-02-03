import type { ScoutingScope, ScoutingTaskRequest } from './types/scoutingArtistsTask';
import type { Player, CreatePlayerRequest } from './types/player';
import type { Label } from './types/label';
import type { TaskResponse, TaskCostPrediction, TaskCreationErrorResponse } from './types/task';
import type { SignArtistContractRequest } from './types/SigningContractTask';

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

// Player API functions
export async function createPlayer(data: CreatePlayerRequest): Promise<Player> {
    return api<Player>('/api/v1/players', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });
}

export async function getPlayerById(playerId: string): Promise<Player> {
    return api<Player>(`/api/v1/players/${playerId}`);
}

export async function getPlayerByFirebaseUserId(firebaseUserId: string): Promise<Player> {
    return api<Player>(`/api/v1/players/firebase/${firebaseUserId}`);
}

// Label API functions
export async function getLabelById(labelId: string): Promise<Label> {
    return api<Label>(`/api/v1/rap-labels/${labelId}`);
}

export async function createLabel(data: {
    ownerPlayerId: string;
    name: string;
    description: string;
    productionStyles: number[];
}): Promise<Label> {
    return api<Label>('/api/v1/rap-labels', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });
}

// Fetch all labels for a player
export async function getPlayerLabels(labelIds: string[]): Promise<Label[]> {
    if (labelIds.length === 0) return [];
    const labels = await Promise.all(labelIds.map(id => getLabelById(id)));
    return labels;
}

// Scouting API functions
export async function fetchScoutingScopes(): Promise<ScoutingScope[]> {
    return api<ScoutingScope[]>('/api/v1/scouting-scopes');
}

export async function createScoutingTask(data: ScoutingTaskRequest): Promise<TaskResponse> {
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

    return result as TaskResponse;
}

export async function predictScoutingCost(data: ScoutingTaskRequest): Promise<TaskCostPrediction> {
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

export async function predictSignArtistContractCost(
    data: SignArtistContractRequest
): Promise<TaskCostPrediction> {
    const fullUrl = `${API_BASE_URL}/api/v1/tasks/sign-artist-contract/predict-cost`;
    const response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        throw new Error(`Failed to predict sign-artist contract cost: ${response.statusText}`);
    }

    return response.json();
}

export async function createSignArtistContractTask(
    data: SignArtistContractRequest
): Promise<TaskResponse> {
    const fullUrl = `${API_BASE_URL}/api/v1/tasks/sign-artist-contract`;
    const response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(`Failed to create sign-artist contract task: ${response.statusText}`);
    }

    return result as TaskResponse;
}

// Task API functions
export async function fetchLabelTasks(labelId: string): Promise<{ tasks: TaskResponse[], serverTime: string }> {
    const fullUrl = `${API_BASE_URL}/api/v1/rap-labels/${labelId}/tasks`;
    const response = await fetch(fullUrl);

    if (!response.ok) {
        throw new Error(`Failed to fetch label tasks: ${response.statusText}`);
    }

    const tasks = await response.json();
    const serverTime = response.headers.get('x-server-time') || new Date().toISOString();

    return { tasks, serverTime };
}

export async function claimTask(taskId: string): Promise<TaskResponse> {
    return api<TaskResponse>(`/api/v1/tasks/${taskId}/claim`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        }
    });
}
