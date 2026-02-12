import { getCurrentServerTime } from './timeUtils';
import { ScoutingType } from '$lib/types/scoutingArtistsTask';
import type {
	TimedTask,
	ScoutingTaskResponse,
	ProducingBeatsTaskResponse,
	RecordingReleaseTaskResponse,
	RestingTaskResponse
} from '$lib/types/task';
import { get } from 'svelte/store';
import { serverAdjustedTime } from '$lib/stores/globalTime';

export function isTaskClaimed(task: TimedTask): boolean {
	return Boolean(task.claimedAt);
}

export function isTaskFinished(task: TimedTask, serverOffset: number): boolean {
	const endTime = new Date(task.endTime).getTime();
	return endTime <= getCurrentServerTime(serverOffset);
}

export function getTaskStatus(
	task: TimedTask,
	serverOffset: number
): 'in-progress' | 'failed' | 'succeeded' {
	if (!isTaskClaimed(task) && !isTaskFinished(task, serverOffset)) {
		return 'in-progress';
	}
	if (isTaskClaimed(task) && task.results?.success) {
		return 'succeeded';
	}
	if (isTaskClaimed(task) && !task.results?.success) {
		return 'failed';
	}
	return 'in-progress';
}

export function getTaskProgress(
	task: TimedTask,
	serverOffset: number,
	currentTime?: number
): number {
	const startTime = new Date(task.startTime).getTime();
	const endTime = new Date(task.endTime).getTime();
	const currentServerTime = currentTime
		? currentTime + serverOffset
		: getCurrentServerTime(serverOffset);

	if (isTaskFinished(task, serverOffset) || isTaskClaimed(task)) {
		return 100;
	}

	const totalDuration = endTime - startTime;
	const elapsed = currentServerTime - startTime;
	const progress = (elapsed / totalDuration) * 100;

	return Math.max(0, Math.min(100, progress));
}

export function getScoutingType(task: ScoutingTaskResponse): ScoutingType {
	const results = task.results;
	if (results?.$type === 'rapper') return ScoutingType.Rappers;
	if (results?.$type === 'beatmaker') return ScoutingType.Beatmakers;
	return ScoutingType.Rappers;
}

/**
 * Get the active beat production task for an artist at the current time
 * @param tasks Array of beat production tasks
 * @param artistId The artist's ID
 * @returns The active task or null
 */
export function getActiveBeatTask(
	tasks: ProducingBeatsTaskResponse[],
	artistId: string
): ProducingBeatsTaskResponse | null {
	const adjustedNow = get(serverAdjustedTime);
	return (
		tasks.find((task) => {
			if (task.workerId !== artistId) return false;
			const startTime = new Date(task.startTime).getTime();
			const endTime = new Date(task.endTime).getTime();
			return startTime <= adjustedNow && endTime > adjustedNow;
		}) ?? null
	);
}

/**
 * Get the active recording/release task for an artist at the current time
 * @param tasks Array of recording/release tasks
 * @param artistId The artist's ID
 * @returns The active task or null
 */
export function getActiveRecordingTask(
	tasks: RecordingReleaseTaskResponse[],
	artistId: string
): RecordingReleaseTaskResponse | null {
	const adjustedNow = get(serverAdjustedTime);
	return (
		tasks.find((task) => {
			if (task.workerId !== artistId) return false;
			const startTime = new Date(task.startTime).getTime();
			const endTime = new Date(task.endTime).getTime();
			return startTime <= adjustedNow && endTime > adjustedNow;
		}) ?? null
	);
}

/**
 * Get the active resting task for an artist at the current time
 * @param tasks Array of resting tasks
 * @param artistId The artist's ID
 * @returns The active task or null
 */
export function getActiveRestingTask(
	tasks: RestingTaskResponse[],
	artistId: string
): RestingTaskResponse | null {
	const adjustedNow = get(serverAdjustedTime);
	return (
		tasks.find((task) => {
			if (task.workerId !== artistId) return false;
			const startTime = new Date(task.startTime).getTime();
			const endTime = new Date(task.endTime).getTime();
			return startTime <= adjustedNow && endTime > adjustedNow;
		}) ?? null
	);
}
