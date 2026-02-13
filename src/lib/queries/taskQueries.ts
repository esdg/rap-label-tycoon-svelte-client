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
import { writable } from 'svelte/store';
import { queryKeys, taskQueryConfig } from './queryClient';
import {
	fetchLabelTasks,
	claimTask,
	createScoutingTask,
	predictScoutingCost,
	createSignArtistContractTask,
	predictSignArtistContractCost,
	createRecordingReleaseTask,
	type RecordingReleaseRequest,
	createProducingBeatsTask,
	type ProducingBeatsRequest,
	createRestingTask,
	type RestingTaskRequest,
	createPublishingReleaseTask,
	type PublishingReleaseRequest
} from '$lib/api/tasks';
import { loadClientConfig } from '$lib/services/config';
import type {
	TimedTask,
	TaskCostPrediction,
	ScoutingTaskResponse,
	SigningContractTaskResponse,
	ProducingBeatsTaskResponse,
	RecordingReleaseTaskResponse,
	RestingTaskResponse,
	AnyTaskResponse
} from '$lib/types/task';
import { TaskType, TaskStatus } from '$lib/types/task';
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
			return normalizeTasksForUI(result.data);
		},
		enabled: !!labelId,
		// Apply task-specific query configuration for frequent updates
		...taskQueryConfig
	});
}

// Derived: Split tasks by type with proper typing
export function createTasksByType(tasks: AnyTaskResponse[]) {
	const normalized = normalizeTasksForUI(tasks);
	return {
		scoutingTasks: normalized.filter(
			(t): t is ScoutingTaskResponse => t.taskType === TaskType.Scouting
		),
		contractTasks: normalized.filter(
			(t): t is SigningContractTaskResponse => t.taskType === TaskType.SigningContract
		),
		beatProductionTasks: normalized.filter(
			(t): t is ProducingBeatsTaskResponse => t.taskType === TaskType.ProducingBeats
		),
		recordingReleaseTasks: normalized.filter(
			(t): t is RecordingReleaseTaskResponse => t.taskType === TaskType.RecordingRelease
		),
		restingTasks: normalized.filter(
			(t): t is RestingTaskResponse =>
				t.taskType === TaskType.Resting || 'restingTypeId' in (t as RestingTaskResponse)
		)
	};
}

function normalizeTasksForUI(tasks: AnyTaskResponse[]): AnyTaskResponse[] {
	return tasks.map((task) => {
		// Ensure workerId is present for UI components that match on workerId
		if (!('workerId' in task) || !task.workerId) {
			if ('beatmakerId' in task && task.beatmakerId) {
				return { ...task, workerId: task.beatmakerId } as AnyTaskResponse;
			}
			if ('rapperId' in task && task.rapperId) {
				return { ...task, workerId: task.rapperId } as AnyTaskResponse;
			}
		}
		return task;
	});
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

// Mutation: Create scouting task with optimistic updates
export function createScoutingTaskMutation(labelId: string) {
	const queryClient = useQueryClient();

	return createMutation<
		TimedTask,
		Error,
		ScoutingTaskRequest & { costPrediction?: TaskCostPrediction },
		{ previousTasks?: TimedTask[] }
	>({
		mutationFn: async (request) => {
			// Remove costPrediction from the actual API request
			const { costPrediction, ...apiRequest } = request;
			return createScoutingTask(apiRequest);
		},
		onMutate: async (request) => {
			// Cancel any outgoing refetches to prevent overwriting optimistic update
			await queryClient.cancelQueries({ queryKey: queryKeys.tasks.byLabel(labelId) });

			// Snapshot the previous value
			const previousTasks = queryClient.getQueryData<TimedTask[]>(queryKeys.tasks.byLabel(labelId));

			// Create optimistic task
			const now = new Date();
			const estimatedDuration = request.costPrediction?.duration || '00:01:00:00'; // Default 1 hour
			const endTime = new Date(now.getTime() + parseDuration(estimatedDuration));

			const optimisticTask: ScoutingTaskResponse = {
				id: `temp-${Date.now()}-${Math.random()}`,
				labelId: request.labelId,
				workerId: request.workerId,
				taskType: TaskType.Scouting,
				name: 'Scouting Task',
				description: 'Scouting is starting, be ready...',
				budgetRequired: request.costPrediction?.budgetRequired ?? 0,
				staminaCost: request.costPrediction?.staminaCost ?? 0,
				startTime: now.toISOString(),
				endTime: endTime.toISOString(),
				claimedAt: null,
				createdAt: now.toISOString(),
				updatedAt: now.toISOString(),
				status: TaskStatus.Pending,
				results: null,
				viewedAt: null,
				scopeId: request.scopeId,
				scoutingType: request.scoutingType,
				// Store request data for display purposes (not part of API response)
				_optimistic: true,
				_requestData: request
			} as any;

			// Optimistically add the task to the cache
			queryClient.setQueryData<TimedTask[]>(queryKeys.tasks.byLabel(labelId), (old) =>
				old ? [...old, optimisticTask] : [optimisticTask]
			);

			// Return context for rollback
			return { previousTasks };
		},
		onError: (err, request, context) => {
			// Rollback to previous state on error
			if (context?.previousTasks) {
				queryClient.setQueryData<TimedTask[]>(
					queryKeys.tasks.byLabel(labelId),
					context.previousTasks
				);
			}
		},
		onSuccess: (newTask, request) => {
			// Remove optimistic task and add real task
			queryClient.setQueryData<TimedTask[]>(queryKeys.tasks.byLabel(labelId), (old) => {
				if (!old) return [newTask];
				// Filter out optimistic tasks and add the real one
				return [...old.filter((t) => !(t as any)._optimistic), newTask];
			});
			// Invalidate to get fresh data
			queryClient.invalidateQueries({ queryKey: queryKeys.tasks.byLabel(labelId) });
			// Also invalidate label to get updated bankroll
			queryClient.invalidateQueries({ queryKey: queryKeys.labels.byId(labelId) });
		}
	});
}

// Helper to parse duration string (format: "DD:HH:MM:SS")
function parseDuration(duration: string): number {
	const parts = duration.split(':').map(Number);
	if (parts.length === 4) {
		const [days, hours, minutes, seconds] = parts;
		return ((days * 24 + hours) * 60 + minutes) * 60 * 1000 + seconds * 1000;
	}
	// Default to 1 hour if parsing fails
	return 60 * 60 * 1000;
}

// Mutation: Create recording release task with optimistic updates
export function createRecordingReleaseTaskMutation(labelId: string) {
	const queryClient = useQueryClient();

	return createMutation<
		TimedTask,
		Error,
		RecordingReleaseRequest & { costPrediction?: TaskCostPrediction },
		{ previousTasks?: TimedTask[] }
	>({
		mutationFn: async (request) => {
			const { costPrediction, ...apiRequest } = request;
			return createRecordingReleaseTask(apiRequest);
		},
		onMutate: async (request) => {
			// Cancel any outgoing refetches to prevent overwriting optimistic update
			await queryClient.cancelQueries({ queryKey: queryKeys.tasks.byLabel(labelId) });

			// Snapshot the previous value
			const previousTasks = queryClient.getQueryData<TimedTask[]>(queryKeys.tasks.byLabel(labelId));

			// Create optimistic task
			const now = new Date();
			const estimatedDuration = request.costPrediction?.duration || '00:01:00:00'; // Default 1 hour
			const endTime = new Date(now.getTime() + parseDuration(estimatedDuration));

			const optimisticTask: RecordingReleaseTaskResponse = {
				id: `temp-${Date.now()}-${Math.random()}`,
				labelId: request.labelId,
				workerId: request.rapperId,
				taskType: TaskType.RecordingRelease,
				name: 'Recording Release',
				description: 'Recording is starting, the studio is warming up...',
				budgetRequired: request.costPrediction?.budgetRequired ?? 0,
				staminaCost: request.costPrediction?.staminaCost ?? 0,
				startTime: now.toISOString(),
				endTime: endTime.toISOString(),
				claimedAt: null,
				createdAt: now.toISOString(),
				updatedAt: now.toISOString(),
				status: TaskStatus.Pending,
				results: null,
				viewedAt: null,
				rapperId: request.rapperId,
				releaseTypeId: request.releaseTypeId,
				beatIds: request.beatIds,
				_optimistic: true,
				_requestData: request
			} as any;

			// Optimistically add the task to the cache
			queryClient.setQueryData<TimedTask[]>(queryKeys.tasks.byLabel(labelId), (old) =>
				old ? [...old, optimisticTask] : [optimisticTask]
			);

			// Return context for rollback
			return { previousTasks };
		},
		onError: (err, request, context) => {
			// Rollback to previous state on error
			if (context?.previousTasks) {
				queryClient.setQueryData<TimedTask[]>(
					queryKeys.tasks.byLabel(labelId),
					context.previousTasks
				);
			}
		},
		onSuccess: (newTask, request) => {
			// Remove optimistic task and add real task
			queryClient.setQueryData<TimedTask[]>(queryKeys.tasks.byLabel(labelId), (old) => {
				if (!old) return [newTask];
				// Filter out optimistic tasks and add the real one
				return [...old.filter((t) => !(t as any)._optimistic), newTask];
			});
			// Invalidate to get fresh data
			queryClient.invalidateQueries({ queryKey: queryKeys.tasks.byLabel(labelId) });
			// Also invalidate label to get updated bankroll
			queryClient.invalidateQueries({ queryKey: queryKeys.labels.byId(labelId) });
			// Invalidate beats since they may now be locked
			queryClient.invalidateQueries({ queryKey: queryKeys.beats.byLabel(labelId) });
		}
	});
}

// Mutation: Create producing beats task with optimistic updates
export function createProducingBeatsTaskMutation(labelId: string) {
	const queryClient = useQueryClient();

	return createMutation<
		TimedTask,
		Error,
		ProducingBeatsRequest & { costPrediction?: TaskCostPrediction },
		{ previousTasks?: TimedTask[] }
	>({
		mutationFn: async (request) => {
			const { costPrediction, ...apiRequest } = request;
			return createProducingBeatsTask(apiRequest);
		},
		onMutate: async (request) => {
			await queryClient.cancelQueries({ queryKey: queryKeys.tasks.byLabel(labelId) });

			const previousTasks = queryClient.getQueryData<TimedTask[]>(queryKeys.tasks.byLabel(labelId));

			const now = new Date();
			const estimatedDuration = request.costPrediction?.duration || '00:01:00:00';
			const endTime = new Date(now.getTime() + parseDuration(estimatedDuration));

			const optimisticTask: ProducingBeatsTaskResponse = {
				id: `temp-${Date.now()}-${Math.random()}`,
				labelId: request.labelId,
				workerId: request.beatmakerId,
				taskType: TaskType.ProducingBeats,
				name: 'Producing Beats',
				description: 'Beat production is starting, the studio is heating up...',
				budgetRequired: request.costPrediction?.budgetRequired ?? 0,
				staminaCost: request.costPrediction?.staminaCost ?? 0,
				startTime: now.toISOString(),
				endTime: endTime.toISOString(),
				claimedAt: null,
				createdAt: now.toISOString(),
				updatedAt: now.toISOString(),
				status: TaskStatus.Pending,
				results: null,
				viewedAt: null,
				beatmakerId: request.beatmakerId,
				numberOfBeats: request.numberOfBeats,
				_optimistic: true,
				_requestData: request
			} as any;

			queryClient.setQueryData<TimedTask[]>(queryKeys.tasks.byLabel(labelId), (old) =>
				old ? [...old, optimisticTask] : [optimisticTask]
			);

			return { previousTasks };
		},
		onError: (err, request, context) => {
			if (context?.previousTasks) {
				queryClient.setQueryData<TimedTask[]>(
					queryKeys.tasks.byLabel(labelId),
					context.previousTasks
				);
			}
		},
		onSuccess: (newTask) => {
			queryClient.setQueryData<TimedTask[]>(queryKeys.tasks.byLabel(labelId), (old) => {
				if (!old) return [newTask];
				return [...old.filter((t) => !(t as any)._optimistic), newTask];
			});
			queryClient.invalidateQueries({ queryKey: queryKeys.tasks.byLabel(labelId) });
			queryClient.invalidateQueries({ queryKey: queryKeys.labels.byId(labelId) });
		}
	});
}

// Mutation: Create resting task with optimistic updates
export function createRestingTaskMutation(labelId: string) {
	const queryClient = useQueryClient();

	return createMutation<
		TimedTask,
		Error,
		RestingTaskRequest & { costPrediction?: TaskCostPrediction },
		{ previousTasks?: TimedTask[] }
	>({
		mutationFn: async (request) => {
			const { costPrediction, ...apiRequest } = request;
			return createRestingTask(apiRequest);
		},
		onMutate: async (request) => {
			await queryClient.cancelQueries({ queryKey: queryKeys.tasks.byLabel(labelId) });

			const previousTasks = queryClient.getQueryData<TimedTask[]>(queryKeys.tasks.byLabel(labelId));

			const now = new Date();
			const estimatedDuration = request.costPrediction?.duration || '00:01:00:00';
			const endTime = new Date(now.getTime() + parseDuration(estimatedDuration));

			const optimisticTask: RestingTaskResponse = {
				id: `temp-${Date.now()}-${Math.random()}`,
				labelId: request.labelId,
				workerId: request.workerId,
				taskType: TaskType.Resting,
				name: 'Resting',
				description: 'Taking a well-deserved break...',
				budgetRequired: request.costPrediction?.budgetRequired ?? 0,
				staminaCost: request.costPrediction?.staminaCost ?? 0,
				startTime: now.toISOString(),
				endTime: endTime.toISOString(),
				claimedAt: null,
				createdAt: now.toISOString(),
				updatedAt: now.toISOString(),
				status: TaskStatus.Pending,
				results: null,
				viewedAt: null,
				restingTypeId: request.restingTypeId,
				duration: request.duration,
				_optimistic: true,
				_requestData: request
			} as any;

			queryClient.setQueryData<TimedTask[]>(queryKeys.tasks.byLabel(labelId), (old) =>
				old ? [...old, optimisticTask] : [optimisticTask]
			);

			return { previousTasks };
		},
		onError: (err, request, context) => {
			if (context?.previousTasks) {
				queryClient.setQueryData<TimedTask[]>(
					queryKeys.tasks.byLabel(labelId),
					context.previousTasks
				);
			}
		},
		onSuccess: (newTask) => {
			queryClient.setQueryData<TimedTask[]>(queryKeys.tasks.byLabel(labelId), (old) => {
				if (!old) return [newTask];
				return [...old.filter((t) => !(t as any)._optimistic), newTask];
			});
			queryClient.invalidateQueries({ queryKey: queryKeys.tasks.byLabel(labelId) });
			queryClient.invalidateQueries({ queryKey: queryKeys.labels.byId(labelId) });
		}
	});
}

// Mutation: Create sign artist contract task with optimistic updates
export function createSignArtistContractTaskMutation(labelId: string) {
	const queryClient = useQueryClient();

	return createMutation<
		TimedTask,
		Error,
		SignArtistContractRequest & { costPrediction?: TaskCostPrediction },
		{ previousTasks?: TimedTask[] }
	>({
		mutationFn: async (request) => {
			const { costPrediction, ...apiRequest } = request;
			return createSignArtistContractTask(apiRequest);
		},
		onMutate: async (request) => {
			await queryClient.cancelQueries({ queryKey: queryKeys.tasks.byLabel(labelId) });

			const previousTasks = queryClient.getQueryData<TimedTask[]>(queryKeys.tasks.byLabel(labelId));

			const now = new Date();
			const estimatedDuration = request.costPrediction?.duration || '00:01:00:00';
			const endTime = new Date(now.getTime() + parseDuration(estimatedDuration));

			const optimisticTask: SigningContractTaskResponse = {
				id: `temp-${Date.now()}-${Math.random()}`,
				labelId: request.labelId,
				workerId: request.workerId,
				taskType: TaskType.SigningContract,
				name: 'Signing Contract',
				description: 'Preparing the contract, negotiations underway...',
				budgetRequired: request.costPrediction?.budgetRequired ?? 0,
				staminaCost: request.costPrediction?.staminaCost ?? 0,
				startTime: now.toISOString(),
				endTime: endTime.toISOString(),
				claimedAt: null,
				createdAt: now.toISOString(),
				updatedAt: now.toISOString(),
				status: TaskStatus.Pending,
				results: null,
				viewedAt: null,
				contractId: '',
				_optimistic: true,
				_requestData: request
			} as any;

			queryClient.setQueryData<TimedTask[]>(queryKeys.tasks.byLabel(labelId), (old) =>
				old ? [...old, optimisticTask] : [optimisticTask]
			);

			return { previousTasks };
		},
		onError: (err, request, context) => {
			if (context?.previousTasks) {
				queryClient.setQueryData<TimedTask[]>(
					queryKeys.tasks.byLabel(labelId),
					context.previousTasks
				);
			}
		},
		onSuccess: (newTask) => {
			queryClient.setQueryData<TimedTask[]>(queryKeys.tasks.byLabel(labelId), (old) => {
				if (!old) return [newTask];
				return [...old.filter((t) => !(t as any)._optimistic), newTask];
			});
			queryClient.invalidateQueries({ queryKey: queryKeys.tasks.byLabel(labelId) });
			queryClient.invalidateQueries({ queryKey: queryKeys.labels.byId(labelId) });
			queryClient.invalidateQueries({ queryKey: queryKeys.contracts.byLabel(labelId) });
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
