// Beats query hooks
import { createQuery } from '@tanstack/svelte-query';
import { queryKeys } from './queryClient';
import { fetchBeatsByLabelId, fetchBeatsByIds } from '$lib/api/beats';

// Query: Get beats by label ID
export function createLabelBeatsQuery(labelId: string | null) {
	return createQuery({
		queryKey: labelId ? queryKeys.beats.byLabel(labelId) : ['beats', 'none'],
		queryFn: () => fetchBeatsByLabelId(labelId!),
		enabled: !!labelId,
		staleTime: 30 * 1000 // 30 seconds
	});
}

// Query: Get beats by IDs
export function createBeatsByIdsQuery(beatIds: string[]) {
	return createQuery({
		queryKey: queryKeys.beats.byIds(beatIds),
		queryFn: () => fetchBeatsByIds(beatIds),
		enabled: beatIds.length > 0,
		staleTime: 60 * 1000 // 1 minute
	});
}
