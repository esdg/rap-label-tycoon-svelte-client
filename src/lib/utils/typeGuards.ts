// Type guards for task discriminated unions
import { TaskType } from '$lib/types/task';
import type {
	TimedTask,
	ScoutingTaskResponse,
	SigningContractTaskResponse,
	ProducingBeatsTaskResponse,
	RecordingReleaseTaskResponse,
	PublishingReleaseTaskResponse,
	RestingTaskResponse
} from '$lib/types/task';

/**
 * Type guard to check if a task is a scouting task
 */
export function isScoutingTask(task: TimedTask): task is ScoutingTaskResponse {
	return task.taskType === TaskType.Scouting;
}

/**
 * Type guard to check if a task is a signing contract task
 */
export function isSigningContractTask(task: TimedTask): task is SigningContractTaskResponse {
	return task.taskType === TaskType.SigningContract;
}

/**
 * Type guard to check if a task is a producing beats task
 */
export function isProducingBeatsTask(task: TimedTask): task is ProducingBeatsTaskResponse {
	return task.taskType === TaskType.ProducingBeats;
}

/**
 * Type guard to check if a task is a recording release task
 */
export function isRecordingReleaseTask(task: TimedTask): task is RecordingReleaseTaskResponse {
	return task.taskType === TaskType.RecordingRelease;
}

/**
 * Type guard to check if a task is a publishing release task
 */
export function isPublishingReleaseTask(task: TimedTask): task is PublishingReleaseTaskResponse {
	return task.taskType === TaskType.PublishingRelease;
}

/**
 * Type guard to check if a task is a resting task
 */
export function isRestingTask(task: TimedTask): task is RestingTaskResponse {
	return task.taskType === TaskType.Resting || 'restingTypeId' in (task as RestingTaskResponse);
}

/**
 * Helper to safely access releaseId from a publishing release task
 */
export function getPublishingReleaseId(task: TimedTask): string | null {
	if (isPublishingReleaseTask(task)) {
		return task.releaseId;
	}
	return null;
}
