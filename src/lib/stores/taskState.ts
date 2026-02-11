/**
 * Task State Store
 *
 * Provides reactive, derived state for tasks including progress,
 * status, and time remaining. Automatically updates with global time.
 *
 * This eliminates the need to calculate progress/status in components.
 * All task state is computed once and cached, ensuring consistency
 * across all pages.
 */

import { derived, type Readable } from 'svelte/store';
import { serverAdjustedTime } from './globalTime';
import { serverTimeOffset } from '$lib/queries/taskQueries';
import { queryClient, queryKeys } from '$lib/queries/queryClient';
import type { TimedTask } from '$lib/types/task';
import { TaskType } from '$lib/types/task';
import { getTaskProgress, getTaskStatus, isTaskFinished } from '$lib/utils/taskUtils';
import { formatCountdown } from '$lib/utils/timeUtils';

/**
 * Enhanced task with reactive computed properties
 */
export interface TaskWithState extends Omit<TimedTask, 'status'> {
	progress: number;
	status: 'in-progress' | 'failed' | 'succeeded';
	isFinished: boolean;
	timeRemaining: number;
	timeRemainingFormatted: string;
}

/**
 * Creates a reactive store for a specific label's tasks with computed state
 *
 * This store automatically updates every second with the global time,
 * recomputing progress, status, and time remaining for all tasks.
 *
 * @param labelId - The label ID to watch tasks for
 * @returns Readable store with array of tasks including computed state
 *
 * @example
 * $: tasksWithState = createTasksStateStore($currentLabel?.id);
 * $: scoutingTasks = $tasksWithState.filter(t => t.taskType === TaskType.Scouting);
 * // Use task.progress, task.status, task.timeRemainingFormatted directly
 */
export function createTasksStateStore(labelId: string | null): Readable<TaskWithState[]> {
	return derived([serverAdjustedTime, serverTimeOffset], ([$adjustedTime, $offset]) => {
		if (!labelId) return [];

		const tasks = queryClient.getQueryData<TimedTask[]>(queryKeys.tasks.byLabel(labelId));

		if (!tasks) return [];

		return tasks.map((task) => {
			const endTime = new Date(task.endTime).getTime();
			const timeRemaining = Math.max(0, endTime - $adjustedTime);

			return {
				...task,
				progress: getTaskProgress(task, $offset),
				status: getTaskStatus(task, $offset),
				isFinished: isTaskFinished(task, $offset),
				timeRemaining,
				timeRemainingFormatted: formatCountdown(timeRemaining)
			};
		});
	});
}

/**
 * Creates a reactive store for a single task with computed state
 *
 * @param taskId - The task ID to watch
 * @param labelId - The label ID the task belongs to
 * @returns Readable store with single task including computed state (or null if not found)
 *
 * @example
 * $: taskState = createTaskStateStore(taskId, labelId);
 * {#if $taskState}
 *   <ProgressBar value={$taskState.progress} />
 *   <div>{$taskState.timeRemainingFormatted}</div>
 * {/if}
 */
export function createTaskStateStore(
	taskId: string,
	labelId: string
): Readable<TaskWithState | null> {
	return derived(createTasksStateStore(labelId), ($tasks) => {
		return $tasks.find((t) => t.id === taskId) ?? null;
	});
}

/**
 * Get all finished but unclaimed tasks
 *
 * This is useful for showing "ready to claim" notifications or
 * for the task claiming service to know what to claim.
 *
 * @param labelId - The label ID to check
 * @returns Readable store with array of finished, unclaimed tasks
 *
 * @example
 * $: unclaimedTasks = createUnclaimedFinishedTasksStore($currentLabel?.id);
 * {#if $unclaimedTasks.length > 0}
 *   <notification>{$unclaimedTasks.length} tasks ready to claim!</notification>
 * {/if}
 */
export function createUnclaimedFinishedTasksStore(
	labelId: string | null
): Readable<TaskWithState[]> {
	return derived(createTasksStateStore(labelId), ($tasks) => {
		return $tasks.filter((t) => t.isFinished && !t.claimedAt);
	});
}

/**
 * Split tasks by type with computed state
 *
 * This is a convenience function that returns tasks grouped by type,
 * all with their computed state properties.
 *
 * @param tasks - Array of tasks with state
 * @returns Object with tasks grouped by type
 *
 * @example
 * $: tasksWithState = createTasksStateStore($currentLabel?.id);
 * $: tasksByType = splitTasksByType($tasksWithState);
 * $: scoutingTasks = tasksByType.scoutingTasks;
 */
export function splitTasksByType(tasks: TaskWithState[]) {
	return {
		scoutingTasks: tasks.filter((t) => t.taskType === TaskType.Scouting),
		contractTasks: tasks.filter((t) => t.taskType === TaskType.SigningContract),
		beatProductionTasks: tasks.filter((t) => t.taskType === TaskType.ProducingBeats),
		recordingReleaseTasks: tasks.filter((t) => t.taskType === TaskType.RecordingRelease),
		publishingReleaseTasks: tasks.filter((t) => t.taskType === TaskType.PublishingRelease),
		restingTasks: tasks.filter(
			(t) => t.taskType === TaskType.Resting || 'restingTypeId' in (t as any)
		)
	};
}
