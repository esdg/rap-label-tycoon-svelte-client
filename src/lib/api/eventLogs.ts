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

export interface MarkEventLogsAsReadParams {
	labelId: string;
	eventLogIds: string[];
}

export interface MarkEventLogsAsReadResponse {
	updatedCount: number;
}

export async function markEventLogsAsRead({
	labelId,
	eventLogIds
}: MarkEventLogsAsReadParams): Promise<MarkEventLogsAsReadResponse> {
	return apiFetch<MarkEventLogsAsReadResponse>('/api/v1/event-logs/mark-read', {
		method: 'POST',
		body: JSON.stringify({
			labelId,
			eventLogIds
		})
	});
}
