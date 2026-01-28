import { writable } from 'svelte/store';
import type { ScoutingTaskResponse } from '../types/scouting';

export const scoutingTasks = writable<ScoutingTaskResponse[]>([]);

export function addScoutingTask(task: ScoutingTaskResponse) {
    scoutingTasks.update((tasks) => [...tasks, task]);
}

export function removeScoutingTask(taskId: string) {
    scoutingTasks.update((tasks) => tasks.filter((t) => t.id !== taskId));
}

export function updateScoutingTask(taskId: string, updatedTask: Partial<ScoutingTaskResponse>) {
    scoutingTasks.update((tasks) =>
        tasks.map((t) => (t.id === taskId ? { ...t, ...updatedTask } : t))
    );
}
