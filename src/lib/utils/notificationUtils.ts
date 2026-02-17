/**
 * Utility functions for notification system
 * Consolidates artist/worker resolution logic
 */

import { queryClient, queryKeys } from '$lib/queries/queryClient';
import type { AnyArtist } from '$lib/api/artists';
import { getDiscoveredArtist, addDiscoveredArtists } from '$lib/queries/artistQueries';
import type { TimedTask, ScoutingTaskResponse, ScoutingTaskResults } from '$lib/types/task';
import { fetchTaskById } from '$lib/api/tasks';
import { fetchArtistsByIds } from '$lib/api/artists';
import { fetchBeatsByLabelId } from '$lib/api/beats';

export type DescriptionPart =
	| { kind: 'text'; value: string; color?: string }
	| { kind: 'link'; label: string; href: string; color?: string }
	| { kind: 'action'; label: string; onClick: () => void | Promise<void>; color?: string };

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
 * Find a task in any of the query caches
 * Checks: task list caches by label
 */
export function findTaskInCache(taskId: string): TimedTask | undefined {
	// Search through all task query caches
	const queries = queryClient.getQueriesData<TimedTask[]>({ queryKey: ['tasks'] });
	for (const [, data] of queries) {
		if (Array.isArray(data)) {
			const found = data.find((task: TimedTask) => task?.id === taskId);
			if (found) return found;
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
				href: `/artists/${encodeURIComponent(workerId)}`,
				color: workerId === currentPlayerId ? 'text-category-1-500' : 'text-category-2-400'
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
	scouting: 'Scouting',
	daily_income_report: 'Daily Income',
	publishing_release: 'Release Published',
	resting: 'Rest',
	recording_release: 'Recording',
	artist_rank_up: 'Artist Rank Up',
	label_rank_up: 'Label Rank Up'
};

export function formatPayloadLabel(type?: string): string {
	return PayloadLabels[type ?? ''] || type || 'Event';
}

/**
 * Fetch a task by ID and cache it
 * First checks cache, then fetches from API if not found
 */
export async function getTaskWithCache(taskId: string): Promise<TimedTask | undefined> {
	// Try cache first
	let task = findTaskInCache(taskId);
	if (task) return task;

	// Fetch from API
	try {
		task = await fetchTaskById(taskId);
		// Cache the fetched task
		if (task?.labelId) {
			queryClient.setQueryData<TimedTask[]>(queryKeys.tasks.byLabel(task.labelId), (oldData) => {
				if (Array.isArray(oldData)) {
					return [...oldData, task!];
				}
				return [task!];
			});
		}
		return task;
	} catch (error) {
		console.error('Failed to fetch task:', error);
		return undefined;
	}
}

/**
 * Fetch and cache discovered artists from a scouting task
 */
export async function fetchScoutedArtists(scoutingTask: ScoutingTaskResponse): Promise<void> {
	if (!scoutingTask.results || !('discoveredArtistsIds' in scoutingTask.results)) {
		return;
	}

	const scoutingResults = scoutingTask.results as ScoutingTaskResults;
	if (!scoutingResults.discoveredArtistsIds?.length) {
		return;
	}

	try {
		const artists = await fetchArtistsByIds(scoutingResults.discoveredArtistsIds);
		addDiscoveredArtists(artists, false);
	} catch (error) {
		console.error('Failed to fetch discovered artists:', error);
	}
}

/**
 * Prefetch and cache beats for a label
 */
export async function prefetchLabelBeats(labelId: string | null | undefined): Promise<void> {
	if (!labelId) return;

	// Check if beats are already cached
	const cached = queryClient.getQueryData(queryKeys.beats.byLabel(labelId));
	if (cached) return;

	// Fetch and cache beats
	try {
		const beats = await fetchBeatsByLabelId(labelId);
		queryClient.setQueryData(queryKeys.beats.byLabel(labelId), beats);
	} catch (error) {
		console.error('Failed to prefetch beats:', error);
	}
}
