/**
 * Utility functions for notification system
 * Consolidates artist/worker resolution logic
 */

import { queryClient, queryKeys } from '$lib/queries/queryClient';
import type { AnyArtist } from '$lib/api/artists';
import { getDiscoveredArtist } from '$lib/queries/artistQueries';

export type DescriptionPart =
	| { kind: 'text'; value: string }
	| { kind: 'link'; label: string; href: string };

/**
 * Generate a short ID suffix for display
 */
export function shortId(value?: string): string {
	return value ? `#${value.slice(-4)}` : 'unknown';
}

/**
 * Pluralize a word based on count
 */
export function pluralize(count: number, word: string): string {
	return `${count} ${word}${count === 1 ? '' : 's'}`;
}

/**
 * Find an artist in any of the query caches
 * Checks: direct cache, list caches, and discovered artists
 */
export function findArtistInCache(artistId: string): AnyArtist | undefined {
	// Check direct query cache
	const direct = queryClient.getQueryData<AnyArtist>(queryKeys.artists.byId(artistId));
	if (direct) return direct;

	// Check discovered artists (client-side bookmarks)
	const discovered = getDiscoveredArtist(artistId)?.artist;
	if (discovered) return discovered;

	// Search through list query caches
	const queries = queryClient.getQueriesData<any>({ queryKey: ['artists'] });
	for (const [, data] of queries) {
		if (Array.isArray(data)) {
			const found = data.find((a: any) => a?.id === artistId);
			if (found) return found;
		}
		if (data && typeof data === 'object' && 'id' in data && data.id === artistId) {
			return data as AnyArtist;
		}
	}

	return undefined;
}

/**
 * Resolve worker display parts from cache
 * Returns description parts for rendering worker names/links
 */
export function resolveWorkerParts(
	workerId: string | null | undefined,
	currentPlayerId: string | null | undefined
): DescriptionPart[] {
	if (!workerId) return [{ kind: 'text', value: 'Team' }];

	// Check if worker is the current player
	if (currentPlayerId && workerId === currentPlayerId) {
		return [{ kind: 'text', value: 'You' }];
	}

	// Try to find artist in cache
	const artist = findArtistInCache(workerId);
	if (artist?.stageName) {
		return [
			{
				kind: 'link',
				label: artist.stageName,
				href: `/artists/${encodeURIComponent(workerId)}`
			}
		];
	}

	// Fallback to short ID
	return [{ kind: 'text', value: `Worker ${shortId(workerId)}` }];
}

/**
 * Resolve artist display name or link
 */
export function resolveArtistLabel(artistId?: string): string {
	if (!artistId) return 'artist';

	const cached = findArtistInCache(artistId);
	if (cached?.stageName) return cached.stageName;

	return `artist ${shortId(artistId)}`;
}

/**
 * Format contract display label
 */
export function formatContractLabel(contractId?: string): string {
	return contractId ? `contract ${shortId(contractId)}` : 'contract';
}

/**
 * Map payload types to readable labels
 */
export const PayloadLabels: Record<string, string> = {
	producing_beats: 'Beat Production',
	signing_contract: 'Contract',
	scouting: 'Scouting'
};

export function formatPayloadLabel(type?: string): string {
	return PayloadLabels[type ?? ''] || type || 'Event';
}
