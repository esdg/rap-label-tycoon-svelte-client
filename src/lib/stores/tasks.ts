import type { TimedTask } from '$lib/types/task';
import { writable } from 'svelte/store';

export const scoutingTasks = writable<TimedTask[]>([]);
export const contractTasks = writable<TimedTask[]>([]);

export function addScoutingTask(task: TimedTask) {
    scoutingTasks.update((tasks) => [...tasks, task]);
}

export function removeScoutingTask(taskId: string) {
    scoutingTasks.update((tasks) => tasks.filter((t) => t.id !== taskId));
}

export function updateScoutingTask(taskId: string, updatedTask: Partial<TimedTask>) {
    scoutingTasks.update((tasks) =>
        tasks.map((t) => (t.id === taskId ? { ...t, ...updatedTask } : t))
    );
}

export function addContractTask(task: TimedTask) {
    contractTasks.update((tasks) => [...tasks, task]);
}

export function removeContractTask(taskId: string) {
    contractTasks.update((tasks) => tasks.filter((t) => t.id !== taskId));
}

export function updateContractTask(taskId: string, updatedTask: Partial<TimedTask>) {
    contractTasks.update((tasks) =>
        tasks.map((t) => (t.id === taskId ? { ...t, ...updatedTask } : t))
    );
}
