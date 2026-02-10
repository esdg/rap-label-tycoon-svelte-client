/**
 * Task Query Hooks
 *
 * Provides TanStack Query hooks for managing label tasks including:
 * - Fetching active tasks
 * - Creating new tasks (scouting, contracts, releases)
 * - Claiming completed tasks
 * - Cost predictions for tasks
 * - Server time synchronization for accurate progress tracking
 */

import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
import { derived, writable, type Readable } from 'svelte/store';
import { queryKeys } from './queryClient';
import {
	fetchLabelTasks,
	claimTask,
	createScoutingTask,
	predictScoutingCost,
	createSignArtistContractTask,
	predictSignArtistContractCost,
	createPublishingReleaseTask,
	type PublishingReleaseRequest
} from '$lib/api/tasks';
import { loadClientConfig } from '$lib/services/config';
import { getServerAdjustedTime } from '$lib/utils/timeUtils';
import type {
	TimedTask,
	TaskCostPrediction,
	ScoutingTaskResponse,
	SigningContractTaskResponse,
	ProducingBeatsTaskResponse,
	RecordingReleaseTaskResponse,
	AnyTaskResponse
} from '$lib/types/task';
import { TaskType } from '$lib/types/task';
import type { ScoutingTaskRequest, ScoutingScope } from '$lib/types/scoutingArtistsTask';
import type { RestingType } from '$lib/types/resting';
import type { SignArtistContractRequest } from '$lib/types/SigningContractTask';

/**
 * Store for server time offset in milliseconds
 *
 * This offset is calculated when fetching tasks and is used to synchronize
 * client-side time displays with server time for accurate progress bars.
 */
export const serverTimeOffset = writable<number>(0);

/**
 * Create a query hook to fetch all tasks for a specific label
 *
 * Automatically updates the serverTimeOffset when tasks are fetched.
 *
 * @param labelId - The label ID to fetch tasks for (null disables query)
 * @returns TanStack Query object with array of tasks
 *
 * @example
 * $: tasksQuery = createLabelTasksQuery($currentLabel?.id);
 * $: tasks = $tasksQuery.data ?? [];
 */
export function createLabelTasksQuery(labelId: string | null) {
	return createQuery({
		queryKey: labelId ? queryKeys.tasks.byLabel(labelId) : ['tasks', 'none'],
		queryFn: async () => {
			const result = await fetchLabelTasks(labelId!);
			// Update server time offset
			const clientTime = Date.now();
			const serverTime = result.serverTime.getTime();
			serverTimeOffset.set(serverTime - clientTime);
			return result.data;
		},
		enabled: !!labelId,
		// Tasks should refresh more frequently
		staleTime: 10 * 1000
	});
}

// Derived: Split tasks by type with proper typing
export function createTasksByType(tasks: AnyTaskResponse[]) {
	return {
		scoutingTasks: tasks.filter((t): t is ScoutingTaskResponse => t.taskType === TaskType.Scouting),
		contractTasks: tasks.filter(
			(t): t is SigningContractTaskResponse => t.taskType === TaskType.SigningContract
		),
		beatProductionTasks: tasks.filter(
			(t): t is ProducingBeatsTaskResponse => t.taskType === TaskType.ProducingBeats
		),
		recordingReleaseTasks: tasks.filter(
			(t): t is RecordingReleaseTaskResponse => t.taskType === TaskType.RecordingRelease
		)
	};
}

// Query: Get scouting scopes (static reference data)
export function createScoutingScopesQuery() {
	return createQuery<ScoutingScope[], Error>({
		queryKey: queryKeys.scoutingScopes,
		queryFn: async () => {
			const config = await loadClientConfig();
			return config.scoutingScopes;
		},
		// Reference data - cache for a long time
		staleTime: 10 * 60 * 1000,
		gcTime: 30 * 60 * 1000
	});
}

// Query: Get resting types (static reference data)
export function createRestingTypesQuery() {
	return createQuery<RestingType[], Error>({
		queryKey: queryKeys.restingTypes,
		queryFn: async () => {
			const config = await loadClientConfig();
			return config.restingTypes;
		},
		staleTime: 10 * 60 * 1000,
		gcTime: 30 * 60 * 1000
	});
}

// Mutation: Claim a task
export function createClaimTaskMutation(labelId: string) {
	const queryClient = useQueryClient();

	return createMutation<TimedTask, Error, string>({
		mutationFn: claimTask,
		onSuccess: (claimedTask) => {
			// Update the task in the cache
			queryClient.setQueryData<TimedTask[]>(queryKeys.tasks.byLabel(labelId), (old) =>
				old?.map((t) => (t.id === claimedTask.id ? claimedTask : t))
			);
		}
	});
}

// Mutation: Create scouting task
export function createScoutingTaskMutation(labelId: string) {
	const queryClient = useQueryClient();

	return createMutation<TimedTask, Error, ScoutingTaskRequest>({
		mutationFn: createScoutingTask,
		onSuccess: (newTask) => {
			// Add the new task to the cache
			queryClient.setQueryData<TimedTask[]>(queryKeys.tasks.byLabel(labelId), (old) =>
				old ? [...old, newTask] : [newTask]
			);
			// Invalidate to get fresh data
			queryClient.invalidateQueries({ queryKey: queryKeys.tasks.byLabel(labelId) });
			// Also invalidate label to get updated bankroll
			queryClient.invalidateQueries({ queryKey: queryKeys.labels.byId(labelId) });
		}
	});
}

// Mutation: Create sign artist contract task
export function createSignArtistContractTaskMutation(labelId: string) {
	const queryClient = useQueryClient();

	return createMutation<TimedTask, Error, SignArtistContractRequest>({
		mutationFn: createSignArtistContractTask,
		onSuccess: (newTask) => {
			queryClient.setQueryData<TimedTask[]>(queryKeys.tasks.byLabel(labelId), (old) =>
				old ? [...old, newTask] : [newTask]
			);
			queryClient.invalidateQueries({ queryKey: queryKeys.tasks.byLabel(labelId) });
			queryClient.invalidateQueries({ queryKey: queryKeys.labels.byId(labelId) });
		}
	});
}

// Mutation: Create publishing release task
export function createPublishingReleaseTaskMutation(labelId: string) {
	const queryClient = useQueryClient();

	return createMutation<TimedTask, Error, PublishingReleaseRequest>({
		mutationFn: createPublishingReleaseTask,
		onSuccess: (newTask) => {
			queryClient.setQueryData<TimedTask[]>(queryKeys.tasks.byLabel(labelId), (old) =>
				old ? [...old, newTask] : [newTask]
			);
			queryClient.invalidateQueries({ queryKey: queryKeys.tasks.byLabel(labelId) });
			queryClient.invalidateQueries({ queryKey: queryKeys.labels.byId(labelId) });
			queryClient.invalidateQueries({ queryKey: queryKeys.releases.byLabel(labelId) });
		}
	});
}

// Non-reactive helpers for cost prediction (used in forms)
export { predictScoutingCost, predictSignArtistContractCost };
