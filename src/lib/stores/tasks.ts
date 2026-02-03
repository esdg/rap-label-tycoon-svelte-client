import type { TaskResponse } from '$lib/types/task';
import { writable } from 'svelte/store';

export const scoutingTasks = writable<TaskResponse[]>([]);

export function addScoutingTask(task: TaskResponse) {
    scoutingTasks.update((tasks) => [...tasks, task]);
}

export function removeScoutingTask(taskId: string) {
    scoutingTasks.update((tasks) => tasks.filter((t) => t.id !== taskId));
}

export function updateScoutingTask(taskId: string, updatedTask: Partial<TaskResponse>) {
    scoutingTasks.update((tasks) =>
        tasks.map((t) => (t.id === taskId ? { ...t, ...updatedTask } : t))
    );
}
