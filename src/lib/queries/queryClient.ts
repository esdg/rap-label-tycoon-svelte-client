import { QueryClient } from '@tanstack/svelte-query';

// Create a singleton QueryClient with sensible defaults for a game app
export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			// Data is considered fresh for 30 seconds
			staleTime: 30 * 1000,
			// Cache data for 5 minutes
			gcTime: 5 * 60 * 1000,
			// Retry failed requests up to 3 times with exponential backoff
			retry: 3,
			retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
			// Refetch on window focus for data consistency
			refetchOnWindowFocus: true,
			// Refetch on reconnect
			refetchOnReconnect: true
		},
		mutations: {
			// Retry mutations once
			retry: 1
		}
	}
});

/**
 * Query configuration for task-related queries
 * Tasks need more frequent updates due to time-sensitive nature
 */
export const taskQueryConfig = {
	staleTime: 5 * 1000, // 5 seconds - tasks change frequently
	gcTime: 2 * 60 * 1000, // 2 minutes cache
	refetchInterval: 30 * 1000 // Auto-refetch every 30 seconds for task updates
};

// Query key factory for consistent key management
export const queryKeys = {
	// Client configuration
	clientConfig: ['client-config'] as const,

	// Auth & Player
	player: {
		all: ['player'] as const,
		byId: (id: string) => ['player', id] as const,
		byFirebaseId: (firebaseId: string) => ['player', 'firebase', firebaseId] as const
	},

	// Labels
	labels: {
		all: ['labels'] as const,
		byId: (id: string) => ['labels', id] as const,
		byPlayer: (playerId: string) => ['labels', 'player', playerId] as const
	},

	// Event logs / notifications
	eventLogs: {
		byLabel: (labelId: string, includeRead: boolean = false, limit: number = 20) =>
			['event-logs', 'label', labelId, includeRead ? 'all' : 'unread', limit] as const
	},

	// Tasks (scoped to label)
	tasks: {
		all: ['tasks'] as const,
		byLabel: (labelId: string) => ['tasks', 'label', labelId] as const,
		scouting: (labelId: string) => ['tasks', 'label', labelId, 'scouting'] as const,
		contracts: (labelId: string) => ['tasks', 'label', labelId, 'contracts'] as const
	},

	// Artists
	artists: {
		all: ['artists'] as const,
		byId: (id: string) => ['artists', 'byId', id] as const,
		byIds: (ids: string[]) => ['artists', 'byIds', ids.sort().join(',')] as const,
		discovered: ['artists', 'discovered'] as const
	},

	// Contracts
	contracts: {
		all: ['contracts'] as const,
		byIds: (ids: string[]) => ['contracts', 'byIds', ids.sort().join(',')] as const,
		byLabel: (labelId: string) => ['contracts', 'label', labelId] as const
	},

	// Beats
	beats: {
		all: ['beats'] as const,
		byId: (id: string) => ['beats', 'byId', id] as const,
		byIds: (ids: string[]) => ['beats', 'byIds', ids.sort().join(',')] as const,
		byLabel: (labelId: string) => ['beats', 'label', labelId] as const
	},

	// Releases
	releases: {
		all: ['releases'] as const,
		byId: (id: string) => ['releases', 'byId', id] as const,
		byIds: (ids: string[]) => ['releases', 'byIds', ids.sort().join(',')] as const,
		byLabel: (labelId: string) => ['releases', 'label', labelId] as const
	},

	// Tracks
	tracks: {
		all: ['tracks'] as const,
		byId: (id: string) => ['tracks', 'byId', id] as const,
		byIds: (ids: string[]) => ['tracks', 'byIds', ids.sort().join(',')] as const,
		byLabel: (labelId: string) => ['tracks', 'label', labelId] as const,
		byRelease: (releaseId: string) => ['tracks', 'release', releaseId] as const
	},

	// Performance Reports
	performanceReports: ['performance-reports'] as const,

	// Scouting scopes (static reference data)
	scoutingScopes: ['scouting-scopes'] as const,
	// Resting types (static reference data)
	restingTypes: ['resting-types'] as const
} as const;

// Helper to invalidate all label-related data when switching labels
export function invalidateLabelData(labelId?: string) {
	if (labelId) {
		queryClient.invalidateQueries({ queryKey: queryKeys.tasks.byLabel(labelId) });
		queryClient.invalidateQueries({ queryKey: queryKeys.contracts.byLabel(labelId) });
		queryClient.invalidateQueries({ queryKey: queryKeys.beats.byLabel(labelId) });
	} else {
		queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
		queryClient.invalidateQueries({ queryKey: queryKeys.contracts.all });
		queryClient.invalidateQueries({ queryKey: queryKeys.beats.all });
	}
}

// Helper to clear all data on logout
export function clearAllQueries() {
	queryClient.clear();
}
