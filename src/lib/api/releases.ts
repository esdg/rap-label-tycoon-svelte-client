// Releases and Tracks API functions
import { apiFetch } from './client';
import type { Release, Track } from '$lib/types/release';

// Fetch releases by label ID
export async function fetchReleasesByLabelId(labelId: string): Promise<Release[]> {
    return apiFetch<Release[]>(`/api/v1/rap-labels/${labelId}/releases`);
}

// Fetch a single release by ID
export async function fetchReleaseById(releaseId: string): Promise<Release> {
    return apiFetch<Release>(`/api/v1/releases/${releaseId}`);
}

// Fetch releases by IDs
export async function fetchReleasesByIds(releaseIds: string[]): Promise<Release[]> {
    if (releaseIds.length === 0) return [];

    const params = new URLSearchParams();
    releaseIds.forEach(id => params.append('ids', id));

    return apiFetch<Release[]>(`/api/v1/releases?${params.toString()}`);
}

// Fetch tracks by label ID
export async function fetchTracksByLabelId(labelId: string): Promise<Track[]> {
    return apiFetch<Track[]>(`/api/v1/rap-labels/${labelId}/tracks`);
}

// Fetch a single track by ID
export async function fetchTrackById(trackId: string): Promise<Track> {
    return apiFetch<Track>(`/api/v1/tracks/${trackId}`);
}

// Fetch tracks by IDs
export async function fetchTracksByIds(trackIds: string[]): Promise<Track[]> {
    if (trackIds.length === 0) return [];

    const params = new URLSearchParams();
    trackIds.forEach(id => params.append('ids', id));

    return apiFetch<Track[]>(`/api/v1/tracks?${params.toString()}`);
}

// Fetch tracks by release ID
export async function fetchTracksByReleaseId(releaseId: string): Promise<Track[]> {
    return apiFetch<Track[]>(`/api/v1/releases/${releaseId}/tracks`);
}
