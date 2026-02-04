import { QueryClient } from '@tanstack/svelte-query';

// Create a singleton QueryClient with sensible defaults for a game app
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Data is considered fresh for 30 seconds
            staleTime: 30 * 1000,
            // Cache data for 5 minutes
            gcTime: 5 * 60 * 1000,
            // Retry failed requests up to 2 times
            retry: 2,
            // Don't refetch on window focus for game data (user controls refresh)
            refetchOnWindowFocus: false,
            // Refetch on reconnect
            refetchOnReconnect: true,
        },
        mutations: {
            // Retry mutations once
            retry: 1,
        },
    },
});

// Query key factory for consistent key management
export const queryKeys = {
    // Auth & Player
    player: {
        all: ['player'] as const,
        byId: (id: string) => ['player', id] as const,
        byFirebaseId: (firebaseId: string) => ['player', 'firebase', firebaseId] as const,
    },

    // Labels
    labels: {
        all: ['labels'] as const,
        byId: (id: string) => ['labels', id] as const,
        byPlayer: (playerId: string) => ['labels', 'player', playerId] as const,
    },

    // Tasks (scoped to label)
    tasks: {
        all: ['tasks'] as const,
        byLabel: (labelId: string) => ['tasks', 'label', labelId] as const,
        scouting: (labelId: string) => ['tasks', 'label', labelId, 'scouting'] as const,
        contracts: (labelId: string) => ['tasks', 'label', labelId, 'contracts'] as const,
    },

    // Artists
    artists: {
        all: ['artists'] as const,
        byIds: (ids: string[]) => ['artists', 'byIds', ids.sort().join(',')] as const,
        discovered: ['artists', 'discovered'] as const,
    },

    // Contracts
    contracts: {
        all: ['contracts'] as const,
        byIds: (ids: string[]) => ['contracts', 'byIds', ids.sort().join(',')] as const,
        byLabel: (labelId: string) => ['contracts', 'label', labelId] as const,
    },

    // Scouting scopes (static reference data)
    scoutingScopes: ['scouting-scopes'] as const,
} as const;

// Helper to invalidate all label-related data when switching labels
export function invalidateLabelData(labelId?: string) {
    if (labelId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.tasks.byLabel(labelId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.contracts.byLabel(labelId) });
    } else {
        queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.contracts.all });
    }
}

// Helper to clear all data on logout
export function clearAllQueries() {
    queryClient.clear();
}
