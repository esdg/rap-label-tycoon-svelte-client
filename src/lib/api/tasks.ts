// Tasks API functions
import {
	apiFetch,
	apiFetchWithTime,
	apiPostTask,
	TaskCreationError,
	type TimestampedResponse
} from './client';
import type { TimedTask, TaskCostPrediction } from '$lib/types/task';
import type { ScoutingTaskRequest, ScoutingScope } from '$lib/types/scoutingArtistsTask';
import type { SignArtistContractRequest } from '$lib/types/SigningContractTask';
import type { RestingTaskRequest } from '$lib/types/resting';
export type { RestingTaskRequest } from '$lib/types/resting';

// Re-export TaskCreationError for convenience
export { TaskCreationError } from './client';

// Fetch all tasks for a label (with server time for sync)
export async function fetchLabelTasks(labelId: string): Promise<TimestampedResponse<TimedTask[]>> {
	return apiFetchWithTime<TimedTask[]>(`/api/v1/rap-labels/${labelId}/tasks`);
}

// Fetch a single task by ID
export async function fetchTaskById(taskId: string): Promise<TimedTask> {
	return apiFetch<TimedTask>(`/api/v1/tasks/${taskId}`);
}

// Claim a completed task
export async function claimTask(taskId: string): Promise<TimedTask> {
	return apiFetch<TimedTask>(`/api/v1/tasks/${taskId}/claim`, {
		method: 'PUT'
	});
}

// Scouting tasks
export async function fetchScoutingScopes(): Promise<ScoutingScope[]> {
	return apiFetch<ScoutingScope[]>('/api/v1/scouting-scopes');
}

export async function predictScoutingCost(data: ScoutingTaskRequest): Promise<TaskCostPrediction> {
	return apiFetch<TaskCostPrediction>('/api/v1/task-estimates/scouting', {
		method: 'POST',
		body: JSON.stringify(data)
	});
}

export async function createScoutingTask(data: ScoutingTaskRequest): Promise<TimedTask> {
	return apiPostTask<ScoutingTaskRequest, TimedTask>('/api/v1/tasks/scouting', data);
}

// Contract tasks
export async function predictSignArtistContractCost(
	data: SignArtistContractRequest
): Promise<TaskCostPrediction> {
	return apiFetch<TaskCostPrediction>('/api/v1/task-estimates/sign-artist-contract', {
		method: 'POST',
		body: JSON.stringify(data)
	});
}

export interface ContractAcceptanceChance {
	acceptanceChance: number;
}

export async function predictContractAcceptanceChance(
	data: SignArtistContractRequest
): Promise<ContractAcceptanceChance> {
	return apiFetch<ContractAcceptanceChance>('/api/v1/task-estimates/contract-acceptance-chance', {
		method: 'POST',
		body: JSON.stringify(data)
	});
}

export async function createSignArtistContractTask(
	data: SignArtistContractRequest
): Promise<TimedTask> {
	return apiPostTask<SignArtistContractRequest, TimedTask>(
		'/api/v1/tasks/sign-artist-contract',
		data
	);
}

// Resting tasks
export async function predictRestingTaskCost(
	data: RestingTaskRequest
): Promise<TaskCostPrediction> {
	return apiFetch<TaskCostPrediction>('/api/v1/task-estimates/resting', {
		method: 'POST',
		body: JSON.stringify(data)
	});
}

export async function createRestingTask(data: RestingTaskRequest): Promise<TimedTask> {
	return apiPostTask<RestingTaskRequest, TimedTask>('/api/v1/tasks/resting', data);
}

// Producing beats tasks
export interface ProducingBeatsRequest {
	labelId: string;
	beatmakerId: string;
	numberOfBeats: number;
	productionStyles: number[];
}

export async function predictProducingBeatsCost(
	data: ProducingBeatsRequest
): Promise<TaskCostPrediction> {
	return apiFetch<TaskCostPrediction>('/api/v1/task-estimates/producing-beats', {
		method: 'POST',
		body: JSON.stringify(data)
	});
}

export async function createProducingBeatsTask(data: ProducingBeatsRequest): Promise<TimedTask> {
	return apiPostTask<ProducingBeatsRequest, TimedTask>('/api/v1/tasks/producing-beats', data);
}

// Recording release tasks
export interface RecordingReleaseRequest {
	labelId: string;
	releaseTypeId: string;
	productionStyle: number;
	rapperId: string;
	beatIds: string[];
}

export async function predictRecordingReleaseCost(
	data: RecordingReleaseRequest
): Promise<TaskCostPrediction> {
	return apiFetch<TaskCostPrediction>('/api/v1/task-estimates/recording-release', {
		method: 'POST',
		body: JSON.stringify(data)
	});
}

export async function createRecordingReleaseTask(
	data: RecordingReleaseRequest
): Promise<TimedTask> {
	return apiPostTask<RecordingReleaseRequest, TimedTask>('/api/v1/tasks/recording-release', data);
}

// Publishing release tasks
export interface PublishingReleaseRequest {
	labelId: string;
	releaseId: string;
}

export async function createPublishingReleaseTask(
	data: PublishingReleaseRequest
): Promise<TimedTask> {
	return apiPostTask<PublishingReleaseRequest, TimedTask>('/api/v1/tasks/publishing-release', data);
}
