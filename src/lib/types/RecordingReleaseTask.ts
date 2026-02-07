import type { RapMusicStyle } from './musicStyles';

export interface RecordingReleaseRequest {
    labelId: string;
    releaseTypeId: string;
    productionStyle: RapMusicStyle;
    rapperId: string;
    beatIds: string[];
}

export interface RecordingReleaseCostPrediction {
    budgetRequired: number;
    duration: string;
    staminaCost: number;
}
