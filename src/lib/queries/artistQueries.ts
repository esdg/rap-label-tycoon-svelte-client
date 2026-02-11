/**
 * Artist Query Hooks
 *
 * Provides TanStack Query hooks for fetching artist data and managing discovered artists.
 * Discovered artists are stored locally with bookmark status that persists across sessions.
 */

import { createQuery } from '@tanstack/svelte-query';
import { writable, derived, get } from 'svelte/store';
import { queryKeys } from './queryClient';
import { fetchArtistsByIds, fetchArtistById, type AnyArtist } from '$lib/api/artists';
import { nowISO } from '$lib/utils/timeUtils';

/**
 * Extended artist type that tracks discovery timestamp and bookmark status
 */
export interface DiscoveredArtist {
	artist: AnyArtist;
	isBookmarked: boolean;
	discoveredAt: string;
}

/**
 * Local store for discovered artists (client-side state that persists across queries)
 * This holds UI state like bookmarks which isn't stored on the backend
 */
export const discoveredArtistsStore = writable<Map<string, DiscoveredArtist>>(new Map());

/**
 * Create a query hook to fetch a single artist by ID
 *
 * @param id - The artist ID to fetch
 * @returns TanStack Query object with artist data
 *
 * @example
 * $: artistQuery = createArtistByIdQuery(artistId);
 * $: artist = $artistQuery.data;
 */
export function createArtistByIdQuery(id: string) {
	return createQuery<AnyArtist, Error>({
		queryKey: queryKeys.artists.byId(id),
		queryFn: () => fetchArtistById(id),
		enabled: !!id,
		// Artists don't change often
		staleTime: 5 * 60 * 1000
	});
}

/**
 * Create a query hook to fetch multiple artists by their IDs
 *
 * @param ids - Array of artist IDs to fetch
 * @returns TanStack Query object with array of artists
 *
 * @example
 * $: artistsQuery = createArtistsByIdsQuery(artistIds);
 * $: artists = $artistsQuery.data ?? [];
 */
export function createArtistsByIdsQuery(ids: string[]) {
	return createQuery<AnyArtist[], Error>({
		queryKey: ids.length > 0 ? queryKeys.artists.byIds(ids) : ['artists', 'none'],
		queryFn: () => fetchArtistsByIds(ids),
		enabled: ids.length > 0,
		// Artists don't change often
		staleTime: 5 * 60 * 1000
	});
}

/**
 * Add newly discovered artists to the local store
 *
 * This function stores artists that have been discovered through scouting tasks,
 * along with their bookmark status and discovery timestamp.
 *
 * @param artists - Array of artists to add to discovered artists
 * @param isBookmarked - Whether to mark these artists as bookmarked (default: false)
 *
 * @example
 * // Add scouted artists without bookmarking
 * addDiscoveredArtists(scoutedArtists, false);
 *
 * // Add and immediately bookmark
 * addDiscoveredArtists([artist], true);
 */
export function addDiscoveredArtists(artists: AnyArtist[], isBookmarked: boolean = false) {
	const discoveredAt = nowISO();

	discoveredArtistsStore.update((map) => {
		const newMap = new Map(map);
		for (const artist of artists) {
			if (!newMap.has(artist.id)) {
				newMap.set(artist.id, { artist, isBookmarked, discoveredAt });
			}
		}
		return newMap;
	});
}

/**
 * Toggle the bookmark status of a discovered artist
 *
 * @param artistId - The ID of the artist to toggle bookmark status
 *
 * @example
 * toggleArtistBookmark(artist.id);
 */
export function toggleArtistBookmark(artistId: string) {
	discoveredArtistsStore.update((map) => {
		const newMap = new Map(map);
		const existing = newMap.get(artistId);
		if (existing) {
			newMap.set(artistId, { ...existing, isBookmarked: !existing.isBookmarked });
		}
		return newMap;
	});
}

// Bookmark an artist
export function bookmarkArtist(artistId: string) {
	discoveredArtistsStore.update((map) => {
		const newMap = new Map(map);
		const existing = newMap.get(artistId);
		if (existing) {
			newMap.set(artistId, { ...existing, isBookmarked: true });
		}
		return newMap;
	});
}

// Unbookmark an artist
export function unbookmarkArtist(artistId: string) {
	discoveredArtistsStore.update((map) => {
		const newMap = new Map(map);
		const existing = newMap.get(artistId);
		if (existing) {
			newMap.set(artistId, { ...existing, isBookmarked: false });
		}
		return newMap;
	});
}

// Get artist by ID from the store
export function getDiscoveredArtist(artistId: string): DiscoveredArtist | undefined {
	return get(discoveredArtistsStore).get(artistId);
}

// Derived stores for filtered views
export const discoveredArtistsList = derived(discoveredArtistsStore, ($map) =>
	Array.from($map.values())
);

export const bookmarkedArtists = derived(discoveredArtistsStore, ($map) =>
	Array.from($map.values()).filter((a) => a.isBookmarked)
);

export const unbookmarkedArtists = derived(discoveredArtistsStore, ($map) =>
	Array.from($map.values()).filter((a) => !a.isBookmarked)
);

// Derived stores by artist type
export const discoveredRappers = derived(discoveredArtistsStore, ($map) =>
	Array.from($map.values()).filter((a) => 'songWritingSkills' in a.artist)
);

export const discoveredBeatmakers = derived(discoveredArtistsStore, ($map) =>
	Array.from($map.values()).filter((a) => 'beatmakingSkills' in a.artist)
);

// Clear all discovered artists (on logout/label switch)
export function clearDiscoveredArtists() {
	discoveredArtistsStore.set(new Map());
}
