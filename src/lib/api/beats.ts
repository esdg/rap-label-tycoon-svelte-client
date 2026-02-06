// Beats API functions
import { apiFetch } from './client';
import type { Beat } from '$lib/types/beat';

// Fetch beats by label ID
export async function fetchBeatsByLabelId(labelId: string): Promise<Beat[]> {
    return apiFetch<Beat[]>(`/api/v1/rap-labels/${labelId}/beats`);
}

// Fetch beats by IDs
export async function fetchBeatsByIds(beatIds: string[]): Promise<Beat[]> {
    if (beatIds.length === 0) return [];

    const params = new URLSearchParams();
    beatIds.forEach(id => params.append('ids', id));

    return apiFetch<Beat[]>(`/api/v1/beats?${params.toString()}`);
}

// Fetch a single beat by ID
export async function fetchBeatById(beatId: string): Promise<Beat> {
    return apiFetch<Beat>(`/api/v1/beats/${beatId}`);
}
