// Artists API functions
import { apiFetch } from './client';
import type { Artist, Rapper, Beatmaker } from '$lib/types/nonPlayingCharacter';

export type AnyArtist = Artist | Rapper | Beatmaker;

export async function fetchArtistsByIds(ids: string[]): Promise<AnyArtist[]> {
    if (ids.length === 0) return [];
    const idsParam = ids.join(',');
    return apiFetch<AnyArtist[]>(`/api/v1/artists/by-ids?ids=${idsParam}`);
}

export async function fetchArtistById(id: string): Promise<AnyArtist> {
    return apiFetch<AnyArtist>(`/api/v1/artists/${id}`);
}
