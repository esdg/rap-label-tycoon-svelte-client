// Performance Reports Query Hooks
import { createQuery } from '@tanstack/svelte-query';
import { fetchPerformanceReportsByLabelId, fetchPerformanceReportsByTrackId } from '$lib/api/performanceReports';
import { queryKeys } from './queryClient';
import type { TrackPerformanceReport } from '$lib/types/performanceReport';

// Query for performance reports by label ID
export function createPerformanceReportsByLabelQuery(
    labelId: string,
    params?: {
        fromDate?: string;
        toDate?: string;
    }
) {
    return createQuery<TrackPerformanceReport[]>({
        queryKey: [...queryKeys.performanceReports, 'byLabel', labelId, params],
        queryFn: () => fetchPerformanceReportsByLabelId(labelId, params),
        enabled: !!labelId,
        staleTime: 5 * 60 * 1000, // 5 minutes - financial data updates daily
    });
}

// Query for performance reports by track ID
export function createPerformanceReportsByTrackQuery(
    trackId: string,
    params?: {
        fromDate?: string;
        toDate?: string;
    }
) {
    return createQuery<TrackPerformanceReport[]>({
        queryKey: [...queryKeys.performanceReports, 'byTrack', trackId, params],
        queryFn: () => fetchPerformanceReportsByTrackId(trackId, params),
        enabled: !!trackId,
        staleTime: 5 * 60 * 1000,
    });
}
