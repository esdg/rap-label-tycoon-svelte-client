import { writable, derived } from 'svelte/store';
import type { Beat } from '$lib/types/beat';

// Main store for all beats
const beatsStore = writable<Beat[]>([]);

// Derived store: Get beats by label ID
export const beatsByLabelId = (labelId: string | null) =>
    derived(beatsStore, ($beats) => {
        if (!labelId) return [];
        return $beats.filter((beat) => beat.labelId === labelId);
    });

// Derived store: Get beats by beatmaker ID
export const beatsByBeatmakerId = (beatmakerId: string | null) =>
    derived(beatsStore, ($beats) => {
        if (!beatmakerId) return [];
        return $beats.filter((beat) => beat.beatmakerId === beatmakerId);
    });

// Derived store: Get available (unsold) beats
export const availableBeats = derived(beatsStore, ($beats) => {
    return $beats.filter((beat) => !beat.isSold);
});

// Derived store: Get beats by IDs
export const beatsByIds = (beatIds: string[]) =>
    derived(beatsStore, ($beats) => {
        if (!beatIds || beatIds.length === 0) return [];
        return $beats.filter((beat) => beatIds.includes(beat.id));
    });

// Actions
export function setBeats(beats: Beat[]) {
    beatsStore.set(beats);
}

export function addBeats(beats: Beat[]) {
    beatsStore.update((current) => [...current, ...beats]);
}

export function updateBeat(beatId: string, updates: Partial<Beat>) {
    beatsStore.update((current) =>
        current.map((beat) => (beat.id === beatId ? { ...beat, ...updates } : beat))
    );
}

export function removeBeat(beatId: string) {
    beatsStore.update((current) => current.filter((beat) => beat.id !== beatId));
}

export function clearBeats() {
    beatsStore.set([]);
}

// Export the main store for direct subscriptions if needed
export const beats = { subscribe: beatsStore.subscribe };
