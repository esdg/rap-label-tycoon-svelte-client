// Query hooks for label event logs / notifications
import { createQuery } from '@tanstack/svelte-query';
import { queryKeys } from './queryClient';
import { fetchEventLogs } from '$lib/api/eventLogs';
import type { EventLog } from '$lib/types/eventLog';

export interface EventLogsQueryOptions {
	limit?: number;
	includeRead?: boolean;
	refetchInterval?: number;
}

export function createEventLogsQuery(labelId: string | null, options: EventLogsQueryOptions = {}) {
	const limit = options.limit ?? 20;
	const includeRead = options.includeRead ?? false;
	const refetchInterval = options.refetchInterval ?? 20000;

	return createQuery<EventLog[], Error>({
		queryKey: labelId
			? queryKeys.eventLogs.byLabel(labelId, includeRead, limit)
			: ['event-logs', 'none'],
		queryFn: () => fetchEventLogs({ labelId: labelId!, limit, includeRead }),
		enabled: !!labelId,
		staleTime: 10 * 1000,
		refetchInterval
	});
}
