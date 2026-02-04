import { getCurrentServerTime } from './timeUtils';
import { ScoutingType } from '$lib/types/scoutingArtistsTask';
import type { TaskResponse, ScoutingTaskResponse } from '$lib/types/task';

export function isTaskClaimed(task: TaskResponse): boolean {
    return Boolean(task.claimedAt);
}

export function isTaskFinished(task: TaskResponse, serverOffset: number): boolean {
    const endTime = new Date(task.endTime).getTime();
    return endTime <= getCurrentServerTime(serverOffset);
}

export function getTaskStatus(
    task: TaskResponse,
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

export function getTaskProgress(task: TaskResponse, serverOffset: number): number {
    const startTime = new Date(task.startTime).getTime();
    const endTime = new Date(task.endTime).getTime();
    const currentServerTime = getCurrentServerTime(serverOffset);

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