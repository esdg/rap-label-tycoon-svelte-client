import { apiFetch } from './client';
import type { EventLog } from '$lib/types/eventLog';

export interface FetchEventLogsParams {
	labelId: string;
	limit?: number;
	includeRead?: boolean;
}

export async function fetchEventLogs({
	labelId,
	limit = 20,
	includeRead = false
}: FetchEventLogsParams): Promise<EventLog[]> {
	const searchParams = new URLSearchParams({
		labelId,
		limit: String(limit),
		includeRead: includeRead ? 'true' : 'false'
	});

	return apiFetch<EventLog[]>(`/api/v1/event-logs?${searchParams.toString()}`);
}
