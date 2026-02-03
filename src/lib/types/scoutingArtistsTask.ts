import { RapMusicStyle } from './musicStyles';
import type { TaskResults, TaskStatus } from './task';

// Enum for scouting types
export enum ScoutingType {
    Rappers = 0,
    Beatmakers = 1
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

export interface ScoutingArtistsResults extends TaskResults {
    $type: ScoutingType;
    discoveredArtistsId: string[];
}