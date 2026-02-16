// Player query hooks
import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
import { queryKeys } from './queryClient';
import {
	fetchPlayerById,
	fetchPlayerByFirebaseId,
	fetchPlayersByIds,
	createPlayer,
	updatePlayer
} from '$lib/api/players';
import type { Player, CreatePlayerRequest } from '$lib/types/player';
import type { UpdatePlayerRequest } from '$lib/api/players';

// Query: Get player by Firebase UID
export function createPlayerByFirebaseIdQuery(firebaseId: string | null) {
	return createQuery<Player, Error>({
		queryKey: firebaseId ? queryKeys.player.byFirebaseId(firebaseId) : ['player', 'none'],
		queryFn: () => fetchPlayerByFirebaseId(firebaseId!),
		enabled: !!firebaseId
	});
}

// Query: Get player by ID
export function createPlayerByIdQuery(playerId: string | null) {
	return createQuery<Player, Error>({
		queryKey: playerId ? queryKeys.player.byId(playerId) : ['player', 'none'],
		queryFn: () => fetchPlayerById(playerId!),
		enabled: !!playerId
	});
}

// Query: Get multiple players by IDs
export function createPlayersByIdsQuery(playerIds: string[] | null) {
	return createQuery<Player[], Error>({
		queryKey: playerIds && playerIds.length > 0 ? ['players', ...playerIds] : ['players', 'none'],
		queryFn: () => fetchPlayersByIds(playerIds!),
		enabled: !!playerIds && playerIds.length > 0
	});
}

// Mutation: Create a new player
export function createPlayerMutation() {
	const queryClient = useQueryClient();

	return createMutation<Player, Error, CreatePlayerRequest>({
		mutationFn: createPlayer,
		onSuccess: (player) => {
			// Cache the new player data
			queryClient.setQueryData(queryKeys.player.byId(player.id), player);
			queryClient.setQueryData(queryKeys.player.byFirebaseId(player.firebaseUserId), player);
		}
	});
}

// Mutation: Update player
export function createUpdatePlayerMutation() {
	const queryClient = useQueryClient();

	return createMutation<Player, Error, { playerId: string; data: UpdatePlayerRequest }>({
		mutationFn: ({ playerId, data }) => updatePlayer(playerId, data),
		onSuccess: (player) => {
			// Update cache
			queryClient.setQueryData(queryKeys.player.byId(player.id), player);
			queryClient.setQueryData(queryKeys.player.byFirebaseId(player.firebaseUserId), player);
			// Invalidate related queries
			queryClient.invalidateQueries({ queryKey: queryKeys.player.all });
		}
	});
}
