// Label query hooks
import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
import { queryKeys } from './queryClient';
import {
	fetchLabelById,
	fetchLabelsByIds,
	createLabel,
	addArtistToWatchlist,
	removeArtistFromWatchlist,
	type CreateLabelRequest
} from '$lib/api/labels';
import type { Label } from '$lib/types/label';
import { appState } from '$lib/stores/appState';

// Query: Get a single label by ID
export function createLabelByIdQuery(labelId: string | null) {
	return createQuery<Label, Error>({
		queryKey: labelId ? queryKeys.labels.byId(labelId) : ['labels', 'none'],
		queryFn: () => fetchLabelById(labelId!),
		enabled: !!labelId
	});
}

// Query: Get all labels for a player
export function createPlayerLabelsQuery(labelIds: string[] | null) {
	return createQuery<Label[], Error>({
		queryKey:
			labelIds && labelIds.length > 0
				? queryKeys.labels.byPlayer(labelIds.join(','))
				: ['labels', 'none'],
		queryFn: () => fetchLabelsByIds(labelIds!),
		enabled: !!labelIds && labelIds.length > 0
	});
}

// Mutation: Create a new label
export function createLabelMutation() {
	const queryClient = useQueryClient();

	return createMutation<Label, Error, CreateLabelRequest>({
		mutationFn: createLabel,
		onSuccess: (label) => {
			// Cache the new label
			queryClient.setQueryData(queryKeys.labels.byId(label.id), label);
			// Invalidate player labels list
			queryClient.invalidateQueries({ queryKey: queryKeys.labels.all });
		}
	});
}

// Helper: Update label in cache (for optimistic updates like bankroll changes)
export function updateLabelInCache(labelId: string, updates: Partial<Label>) {
	const queryClient = useQueryClient();

	queryClient.setQueryData<Label>(queryKeys.labels.byId(labelId), (old) =>
		old ? { ...old, ...updates } : old
	);
}

// Mutation: Add artist to watchlist
export function createAddToWatchlistMutation() {
	const queryClient = useQueryClient();

	return createMutation<
		void,
		Error,
		{ labelId: string; artistId: string },
		{ previousLabel?: Label }
	>({
		mutationFn: ({ labelId, artistId }) => addArtistToWatchlist(labelId, artistId),
		onMutate: async ({ labelId, artistId }) => {
			// Cancel any outgoing refetches
			await queryClient.cancelQueries({ queryKey: queryKeys.labels.byId(labelId) });

			// Snapshot the previous value
			const previousLabel = queryClient.getQueryData<Label>(queryKeys.labels.byId(labelId));

			// Optimistically update to the new value
			if (previousLabel) {
				const updatedLabel = {
					...previousLabel,
					artistsWatchlistIds: [...previousLabel.artistsWatchlistIds, artistId]
				};
				queryClient.setQueryData<Label>(queryKeys.labels.byId(labelId), updatedLabel);
				// Also update appState if this is the current label
				appState.setCurrentLabel(updatedLabel);
			}

			// Return context with previous value
			return { previousLabel };
		},
		onError: (err, { labelId }, context) => {
			// Rollback to previous value on error
			if (context?.previousLabel) {
				queryClient.setQueryData(queryKeys.labels.byId(labelId), context.previousLabel);
				appState.setCurrentLabel(context.previousLabel);
			}
		},
		onSettled: (data, error, { labelId }) => {
			// Always refetch after error or success
			queryClient.invalidateQueries({ queryKey: queryKeys.labels.byId(labelId) });
		}
	});
}

// Mutation: Remove artist from watchlist
export function createRemoveFromWatchlistMutation() {
	const queryClient = useQueryClient();

	return createMutation<
		void,
		Error,
		{ labelId: string; artistId: string },
		{ previousLabel?: Label }
	>({
		mutationFn: ({ labelId, artistId }) => removeArtistFromWatchlist(labelId, artistId),
		onMutate: async ({ labelId, artistId }) => {
			// Cancel any outgoing refetches
			await queryClient.cancelQueries({ queryKey: queryKeys.labels.byId(labelId) });

			// Snapshot the previous value
			const previousLabel = queryClient.getQueryData<Label>(queryKeys.labels.byId(labelId));

			// Optimistically update to the new value
			if (previousLabel) {
				const updatedLabel = {
					...previousLabel,
					artistsWatchlistIds: previousLabel.artistsWatchlistIds.filter((id) => id !== artistId)
				};
				queryClient.setQueryData<Label>(queryKeys.labels.byId(labelId), updatedLabel);
				// Also update appState if this is the current label
				appState.setCurrentLabel(updatedLabel);
			}

			// Return context with previous value
			return { previousLabel };
		},
		onError: (err, { labelId }, context) => {
			// Rollback to previous value on error
			if (context?.previousLabel) {
				queryClient.setQueryData(queryKeys.labels.byId(labelId), context.previousLabel);
				appState.setCurrentLabel(context.previousLabel);
			}
		},
		onSettled: (data, error, { labelId }) => {
			// Always refetch after error or success
			queryClient.invalidateQueries({ queryKey: queryKeys.labels.byId(labelId) });
		}
	});
}
