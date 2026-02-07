// Performance Reports API functions
import { apiFetch } from './client';
import type { TrackPerformanceReport } from '$lib/types/performanceReport';

// Fetch all track performance reports for a label
export async function fetchPerformanceReportsByLabelId(
    labelId: string,
    params?: {
        fromDate?: string;
        toDate?: string;
    }
): Promise<TrackPerformanceReport[]> {
    const queryParams = new URLSearchParams();
    if (params?.fromDate) queryParams.append('fromDate', params.fromDate);
    if (params?.toDate) queryParams.append('toDate', params.toDate);

    const queryString = queryParams.toString();
    const url = `/api/v1/track-performance-reports/by-label/${labelId}${queryString ? `?${queryString}` : ''}`;

    return apiFetch<TrackPerformanceReport[]>(url);
}

// Fetch performance reports for a specific track
export async function fetchPerformanceReportsByTrackId(
    trackId: string,
    params?: {
        fromDate?: string;
        toDate?: string;
    }
): Promise<TrackPerformanceReport[]> {
    const queryParams = new URLSearchParams();
    if (params?.fromDate) queryParams.append('fromDate', params.fromDate);
    if (params?.toDate) queryParams.append('toDate', params.toDate);

    const queryString = queryParams.toString();
    const url = `/api/v1/track-performance-reports/by-track/${trackId}${queryString ? `?${queryString}` : ''}`;

    return apiFetch<TrackPerformanceReport[]>(url);
}

// Fetch a single performance report by ID
export async function fetchPerformanceReportById(reportId: string): Promise<TrackPerformanceReport> {
    return apiFetch<TrackPerformanceReport>(`/api/v1/track-performance-reports/${reportId}`);
}
