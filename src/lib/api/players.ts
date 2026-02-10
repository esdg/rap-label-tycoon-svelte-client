// Player API functions
import { apiFetch } from './client';
import type { Player, CreatePlayerRequest } from '$lib/types/player';

export async function fetchPlayerById(playerId: string): Promise<Player> {
	return apiFetch<Player>(`/api/v1/players/${playerId}`);
}

export async function fetchPlayerByFirebaseId(firebaseUserId: string): Promise<Player> {
	return apiFetch<Player>(`/api/v1/players/firebase/${firebaseUserId}`);
}

export async function createPlayer(data: CreatePlayerRequest): Promise<Player> {
	return apiFetch<Player>('/api/v1/players', {
		method: 'POST',
		body: JSON.stringify(data)
	});
}

export async function fetchPlayersByIds(playerIds: string[]): Promise<Player[]> {
	if (playerIds.length === 0) return [];
	// Fetch all players in parallel
	return Promise.all(playerIds.map((id) => fetchPlayerById(id)));
}
