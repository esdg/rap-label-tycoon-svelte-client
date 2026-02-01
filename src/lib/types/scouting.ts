import { RapMusicStyle } from './musicStyles';
import type { Artist } from './nonPlayingCharacter';

// Enum for scouting types
export enum ScoutingType {
    Rappers = 0,
    Beatmakers = 1
}

// Enum for task status
export enum TaskStatus {
    Pending = 0,
    InProgress = 1,
    Completed = 2,
    Failed = 3,
    Claimed = 4
}

// Enum for task creation errors (matches backend enum order)
export enum TaskCreationErrorType {
    NotFound = 0,
    ValidationError = 1,
    InsufficientBudget = 2,
    WorkerBusy = 3,
    TaskLimitReached = 4,
    ActiveContractExists = 5,
    WorkerExhausted = 6
}

// Error response structure from API
export interface TaskCreationErrorResponse {
    code: number;
    message: string;
}

export const ScoutingTypeNames: Record<ScoutingType, string> = {
    [ScoutingType.Rappers]: 'Rappers',
    [ScoutingType.Beatmakers]: 'Beatmakers'
};

// API Types
export interface ScoutingScope {
    id: string;
    displayName: string;
    description: string;
    artistMultiplier: number;
    budgetMultiplier: number;
    durationMultiplier: number;
    sortOrder: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface ScoutingTaskRequest {
    labelId: string;
    workerId: string;
    scoutingType: ScoutingType;
    productionStyles: RapMusicStyle[];
    scopeId: string;
}

export interface ScoutingCostPrediction {
    budgetRequired: number;
    duration: string;
    staminaCost: number;
}

export interface ScoutingTaskResponse {
    id: string;
    labelId: string;
    scopeId: string;
    workerId: string;
    name: string;
    description: string;
    budgetRequired: number;
    staminaCost: number;
    startTime: string;
    endTime: string;
    claimedAt: string | null;
    createdAt: string;
    updatedAt: string;
    status: TaskStatus;
    results: ScoutingResults | null;
}


export interface ScoutingResults {
    success: boolean;
    details: string;
}

export interface ScoutingArtistsResults extends ScoutingResults {
    discoveredArtists: Artist[];
}