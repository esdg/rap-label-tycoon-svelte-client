// Releases and Tracks query hooks
import { createQuery } from '@tanstack/svelte-query';
import { queryKeys } from './queryClient';
import {
	fetchReleasesByLabelId,
	fetchReleasesByIds,
	fetchReleaseById,
	fetchTracksByLabelId,
	fetchTracksByIds,
	fetchTrackById,
	fetchTracksByReleaseId
} from '$lib/api/releases';

// Query: Get releases by label ID
export function createLabelReleasesQuery(labelId: string | null) {
	return createQuery({
		queryKey: labelId ? queryKeys.releases.byLabel(labelId) : ['releases', 'none'],
		queryFn: () => fetchReleasesByLabelId(labelId!),
		enabled: !!labelId,
		staleTime: 30 * 1000 // 30 seconds
	});
}

// Query: Get releases by IDs
export function createReleasesByIdsQuery(releaseIds: string[]) {
	return createQuery({
		queryKey: queryKeys.releases.byIds(releaseIds),
		queryFn: () => fetchReleasesByIds(releaseIds),
		enabled: releaseIds.length > 0,
		staleTime: 60 * 1000 // 1 minute
	});
}

// Query: Get single release by ID
export function createReleaseByIdQuery(releaseId: string | null) {
	return createQuery({
		queryKey: releaseId ? queryKeys.releases.byId(releaseId) : ['release', 'none'],
		queryFn: () => fetchReleaseById(releaseId!),
		enabled: !!releaseId,
		staleTime: 60 * 1000 // 1 minute
	});
}

// Query: Get tracks by label ID
export function createLabelTracksQuery(labelId: string | null) {
	return createQuery({
		queryKey: labelId ? queryKeys.tracks.byLabel(labelId) : ['tracks', 'none'],
		queryFn: () => fetchTracksByLabelId(labelId!),
		enabled: !!labelId,
		staleTime: 30 * 1000 // 30 seconds
	});
}

// Query: Get tracks by IDs
export function createTracksByIdsQuery(trackIds: string[]) {
	return createQuery({
		queryKey: queryKeys.tracks.byIds(trackIds),
		queryFn: () => fetchTracksByIds(trackIds),
		enabled: trackIds.length > 0,
		staleTime: 60 * 1000 // 1 minute
	});
}

// Query: Get single track by ID
export function createTrackByIdQuery(trackId: string | null) {
	return createQuery({
		queryKey: trackId ? queryKeys.tracks.byId(trackId) : ['track', 'none'],
		queryFn: () => fetchTrackById(trackId!),
		enabled: !!trackId,
		staleTime: 60 * 1000 // 1 minute
	});
}

// Query: Get tracks by release ID
export function createTracksByReleaseIdQuery(releaseId: string | null) {
	return createQuery({
		queryKey: releaseId ? queryKeys.tracks.byRelease(releaseId) : ['tracks', 'release', 'none'],
		queryFn: () => fetchTracksByReleaseId(releaseId!),
		enabled: !!releaseId,
		staleTime: 60 * 1000 // 1 minute
	});
}
