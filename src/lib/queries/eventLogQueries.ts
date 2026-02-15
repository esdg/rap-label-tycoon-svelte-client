// Query hooks for label event logs / notifications
import { createQuery, createMutation } from '@tanstack/svelte-query';
import { queryKeys, queryClient } from './queryClient';
import { fetchEventLogs, markEventLogsAsRead } from '$lib/api/eventLogs';
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

export function createMarkEventLogsAsReadMutation() {
	return createMutation({
		mutationFn: markEventLogsAsRead,
		onSuccess: (_, variables) => {
			// Update all event log queries for this label
			queryClient.setQueriesData<EventLog[]>(
				{ queryKey: ['event-logs', 'label', variables.labelId], exact: false },
				(oldData) => {
					if (!oldData) return oldData;
					return oldData.map((event) =>
						variables.eventLogIds.includes(event.id)
							? { ...event, isRead: true, readAt: new Date().toISOString() }
							: event
					);
				}
			);
		}
	});
}
