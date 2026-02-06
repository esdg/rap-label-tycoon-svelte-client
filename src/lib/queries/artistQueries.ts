// Artists query hooks
import { createQuery, useQueryClient } from '@tanstack/svelte-query';
import { writable, derived, get } from 'svelte/store';
import { queryKeys } from './queryClient';
import { fetchArtistsByIds, fetchArtistById, type AnyArtist } from '$lib/api/artists';
import { nowISO } from '$lib/utils/timeUtils';
// Import legacy store for backward compatibility sync
import { addMultipleDiscoveredArtists as legacyAddArtists } from '$lib/stores/artists';

// Extended type to track discovery and bookmark status
export interface DiscoveredArtist {
    artist: AnyArtist;
    isBookmarked: boolean;
    discoveredAt: string;
}

// Local store for discovered artists (client-side state that persists across queries)
// This holds the UI state like bookmarks which isn't stored on backend
export const discoveredArtistsStore = writable<Map<string, DiscoveredArtist>>(new Map());

// Query: Fetch a single artist by ID
export function createArtistByIdQuery(id: string) {
    return createQuery<AnyArtist, Error>({
        queryKey: queryKeys.artists.byId(id),
        queryFn: () => fetchArtistById(id),
        enabled: !!id,
        // Artists don't change often
        staleTime: 5 * 60 * 1000,
    });
}

// Query: Fetch artists by IDs
export function createArtistsByIdsQuery(ids: string[]) {
    return createQuery<AnyArtist[], Error>({
        queryKey: ids.length > 0 ? queryKeys.artists.byIds(ids) : ['artists', 'none'],
        queryFn: () => fetchArtistsByIds(ids),
        enabled: ids.length > 0,
        // Artists don't change often
        staleTime: 5 * 60 * 1000,
    });
}

// Add discovered artists to the local store
export function addDiscoveredArtists(artists: AnyArtist[], isBookmarked: boolean = false) {
    const discoveredAt = nowISO();

    discoveredArtistsStore.update(map => {
        const newMap = new Map(map);
        for (const artist of artists) {
            if (!newMap.has(artist.id)) {
                newMap.set(artist.id, { artist, isBookmarked, discoveredAt });
            }
        }
        return newMap;
    });

    // Sync to legacy store for backward compatibility
    legacyAddArtists(artists, isBookmarked);
}

// Toggle bookmark status
export function toggleArtistBookmark(artistId: string) {
    discoveredArtistsStore.update(map => {
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
    discoveredArtistsStore.update(map => {
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
    discoveredArtistsStore.update(map => {
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
export const discoveredArtistsList = derived(
    discoveredArtistsStore,
    $map => Array.from($map.values())
);

export const bookmarkedArtists = derived(
    discoveredArtistsStore,
    $map => Array.from($map.values()).filter(a => a.isBookmarked)
);

export const unbookmarkedArtists = derived(
    discoveredArtistsStore,
    $map => Array.from($map.values()).filter(a => !a.isBookmarked)
);

// Derived stores by artist type
export const discoveredRappers = derived(
    discoveredArtistsStore,
    $map => Array.from($map.values()).filter(a => 'songWritingSkills' in a.artist)
);

export const discoveredBeatmakers = derived(
    discoveredArtistsStore,
    $map => Array.from($map.values()).filter(a => 'beatmakingSkills' in a.artist)
);

// Clear all discovered artists (on logout/label switch)
export function clearDiscoveredArtists() {
    discoveredArtistsStore.set(new Map());
}
