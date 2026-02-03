import { writable, derived } from 'svelte/store';
import type { Artist, Rapper, Beatmaker } from '$lib/types/nonPlayingCharacter';

// Extended types to track discovery and bookmark status
export interface DiscoveredArtist {
    artist: Artist | Rapper | Beatmaker;
    isBookmarked: boolean;
    discoveredAt: string;
}

// Main store holding all known artists (discovered through scouting, contracts, etc.)
export const discoveredArtists = writable<DiscoveredArtist[]>([]);

// Derived store for bookmarked artists only
export const bookmarkedArtists = derived(discoveredArtists, ($artists) =>
    $artists.filter((item) => item.isBookmarked)
);

// Derived store for non-bookmarked (just discovered) artists
export const unbookmarkedArtists = derived(discoveredArtists, ($artists) =>
    $artists.filter((item) => !item.isBookmarked)
);

// Derived store for rappers only
export const rappers = derived(discoveredArtists, ($artists) =>
    $artists.filter((item) => 'songWritingSkills' in item.artist)
);

// Derived store for beatmakers only
export const beatmakers = derived(discoveredArtists, ($artists) =>
    $artists.filter((item) => 'beatmakingSkills' in item.artist)
);

// Derived store for bookmarked rappers
export const bookmarkedRappers = derived(discoveredArtists, ($artists) =>
    $artists.filter((item) => item.isBookmarked && 'songWritingSkills' in item.artist)
);

// Derived store for bookmarked beatmakers
export const bookmarkedBeatmakers = derived(discoveredArtists, ($artists) =>
    $artists.filter((item) => item.isBookmarked && 'beatmakingSkills' in item.artist)
);

// Helper function to add a discovered artist
export function addDiscoveredArtist(
    artist: Artist | Rapper | Beatmaker,
    isBookmarked: boolean = false
) {
    discoveredArtists.update((artists) => [
        ...artists,
        {
            artist,
            isBookmarked,
            discoveredAt: new Date().toISOString()
        }
    ]);
}

// Helper function to remove an artist by ID
export function removeDiscoveredArtist(artistId: string) {
    discoveredArtists.update((artists) =>
        artists.filter((item) => item.artist.id !== artistId)
    );
}

// Helper function to update an artist
export function updateDiscoveredArtist(
    artistId: string,
    updatedArtist: Partial<Artist | Rapper | Beatmaker>
) {
    discoveredArtists.update((artists) =>
        artists.map((item) =>
            item.artist.id === artistId
                ? { ...item, artist: { ...item.artist, ...updatedArtist } }
                : item
        )
    );
}

// Helper function to toggle bookmark status
export function toggleArtistBookmark(artistId: string) {
    discoveredArtists.update((artists) =>
        artists.map((item) =>
            item.artist.id === artistId ? { ...item, isBookmarked: !item.isBookmarked } : item
        )
    );
}

// Helper function to bookmark an artist
export function bookmarkArtist(artistId: string) {
    discoveredArtists.update((artists) =>
        artists.map((item) =>
            item.artist.id === artistId ? { ...item, isBookmarked: true } : item
        )
    );
}

// Helper function to unbookmark an artist
export function unbookmarkArtist(artistId: string) {
    discoveredArtists.update((artists) =>
        artists.map((item) =>
            item.artist.id === artistId ? { ...item, isBookmarked: false } : item
        )
    );
}

// Helper function to get artist by ID
export function getArtistById(artistId: string, artistsList: DiscoveredArtist[]): DiscoveredArtist | undefined {
    return artistsList.find((item) => item.artist.id === artistId);
}

// Helper function to set all discovered artists (useful for initial load from API)
export function setDiscoveredArtists(artists: DiscoveredArtist[]) {
    discoveredArtists.set(artists);
}

// Helper function to add multiple artists at once
export function addMultipleDiscoveredArtists(
    artists: (Artist | Rapper | Beatmaker)[],
    isBookmarked: boolean = false
) {
    const discoveredAt = new Date().toISOString();
    discoveredArtists.update((currentArtists) => [
        ...currentArtists,
        ...artists.map((artist) => ({
            artist,
            isBookmarked,
            discoveredAt
        }))
    ]);
}

// Helper function to clear all discovered artists
export function clearDiscoveredArtists() {
    discoveredArtists.set([]);
}

// Derived store factory - get artists by IDs
export function getArtistsByIdsStore(artistIds: string[]) {
    return derived(discoveredArtists, ($artists) =>
        $artists.filter((item) => artistIds.includes(item.artist.id))
    );
}
