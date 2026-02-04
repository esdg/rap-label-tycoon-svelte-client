// Label query hooks
import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
import { queryKeys } from './queryClient';
import { fetchLabelById, fetchLabelsByIds, createLabel, type CreateLabelRequest } from '$lib/api/labels';
import type { Label } from '$lib/types/label';

// Query: Get a single label by ID
export function createLabelByIdQuery(labelId: string | null) {
    return createQuery<Label, Error>({
        queryKey: labelId ? queryKeys.labels.byId(labelId) : ['labels', 'none'],
        queryFn: () => fetchLabelById(labelId!),
        enabled: !!labelId,
    });
}

// Query: Get all labels for a player
export function createPlayerLabelsQuery(labelIds: string[] | null) {
    return createQuery<Label[], Error>({
        queryKey: labelIds && labelIds.length > 0
            ? queryKeys.labels.byPlayer(labelIds.join(','))
            : ['labels', 'none'],
        queryFn: () => fetchLabelsByIds(labelIds!),
        enabled: !!labelIds && labelIds.length > 0,
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
        },
    });
}

// Helper: Update label in cache (for optimistic updates like bankroll changes)
export function updateLabelInCache(labelId: string, updates: Partial<Label>) {
    const queryClient = useQueryClient();

    queryClient.setQueryData<Label>(
        queryKeys.labels.byId(labelId),
        (old) => old ? { ...old, ...updates } : old
    );
}
