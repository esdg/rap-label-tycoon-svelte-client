// Labels API functions
import { apiFetch } from './client';
import type { Label } from '$lib/types/label';

export interface CreateLabelRequest {
	ownerPlayerId: string;
	name: string;
	description: string;
	productionStyles: number[];
}

export async function fetchLabelById(labelId: string): Promise<Label> {
	return apiFetch<Label>(`/api/v1/rap-labels/${labelId}`);
}

export async function fetchLabelsByIds(labelIds: string[]): Promise<Label[]> {
	if (labelIds.length === 0) return [];
	// Fetch all labels in parallel
	return Promise.all(labelIds.map((id) => fetchLabelById(id)));
}

export async function createLabel(data: CreateLabelRequest): Promise<Label> {
	return apiFetch<Label>('/api/v1/rap-labels', {
		method: 'POST',
		body: JSON.stringify(data)
	});
}

export async function addArtistToWatchlist(labelId: string, artistId: string): Promise<void> {
	return apiFetch<void>(`/api/v1/rap-labels/${labelId}/watchlist/artists/${artistId}`, {
		method: 'POST'
	});
}

export async function removeArtistFromWatchlist(labelId: string, artistId: string): Promise<void> {
	return apiFetch<void>(`/api/v1/rap-labels/${labelId}/watchlist/artists/${artistId}`, {
		method: 'DELETE'
	});
}

export async function fetchAllLabels(): Promise<Label[]> {
	return apiFetch<Label[]>('/api/v1/rap-labels');
}
