<script lang="ts">
	import { onMount } from 'svelte';
	import { modalStore } from '$lib/stores/modal';
	import { label } from '$lib/stores/label';
	import Button from '$lib/components/Button.svelte';
	import { fetchLabelTasks, claimTask } from '$lib/api';
	import type { ScoutingTaskResponse } from '$lib/types/scouting';
	import ScoutingTask from '$lib/components/Cards/ScoutingTask.svelte';
	import bgImage from '$lib/assets/main-bg-1.png';

	let tasks: ScoutingTaskResponse[] = [];
	let serverTimeOffset = 0; // Difference between server time and client time
	let loading = true;
	let error: string | null = null;
	let previousModalState = $modalStore.isOpen;
	let currentTime = Date.now(); // Current client time, updated every second
	let hasLoadedOnce = false; // Track if we've loaded tasks at least once

	function openScoutModal() {
		modalStore.open('task-modal', {
			subModal: 'scout',
			title: 'Scouting talents',
			imageUrl:
				'https://res.cloudinary.com/dig430oem/image/upload/v1769715987/scouting-cover_mtrurs.png'
		});
	}

	function openScoutResultsModal(scoutingTaskResponse: ScoutingTaskResponse) {
		modalStore.open('task-modal', {
			subModal: 'scout-results',
			scoutingTaskResponse: scoutingTaskResponse,
			title: 'Scouting talents',
			imageUrl:
				'https://res.cloudinary.com/dig430oem/image/upload/v1769715987/scouting-cover_mtrurs.png'
		});
	}

	// Watch for modal state changes
	$: {
		if (previousModalState && !$modalStore.isOpen) {
			// Modal just closed, refresh tasks
			loadTasks();
		}
		previousModalState = $modalStore.isOpen;
	}

	// Reactively load tasks when label becomes available
	$: if ($label?.id && !hasLoadedOnce) {
		hasLoadedOnce = true;
		loadTasks();
	}

	async function loadTasks() {
		if (!$label?.id) {
			// Don't show error if label is not yet loaded - just wait
			loading = true;
			return;
		}

		error = null;
		loading = true;

		try {
			const { tasks: fetchedTasks, serverTime: serverTimeStr } = await fetchLabelTasks($label.id);

			// Calculate offset between server time and client time first
			const serverTime = new Date(serverTimeStr).getTime();
			const clientTime = Date.now();
			serverTimeOffset = serverTime - clientTime;

			// Keep all tasks (including claimed ones)
			tasks = fetchedTasks;

			// Auto-claim all finished tasks that haven't been claimed yet
			const finishedUnclaimedTasks = tasks.filter(
				(task) => !task.claimedAt && isTaskFinished(task)
			);

			if (finishedUnclaimedTasks.length > 0) {
				// Claim all finished tasks in parallel
				const claimPromises = finishedUnclaimedTasks.map(async (task) => {
					try {
						const claimedTask = await claimTask(task.id);
						// Update the task in the array with the claimed task data
						const index = tasks.findIndex((t) => t.id === task.id);
						if (index !== -1) {
							tasks[index] = claimedTask;
						}
						return { success: true, taskId: task.id };
					} catch (err) {
						console.error(`Failed to claim task ${task.id}:`, err);
						return { success: false, taskId: task.id, error: err };
					}
				});

				await Promise.all(claimPromises);
				// Trigger reactivity by reassigning tasks
				tasks = [...tasks];
			}

			loading = false;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load tasks';
			loading = false;
		}
	}

	function getCurrentServerTime(): number {
		return currentTime + serverTimeOffset;
	}

	function isTaskFinished(task: ScoutingTaskResponse): boolean {
		const endTime = new Date(task.endTime).getTime();
		return endTime <= getCurrentServerTime();
	}

	function isTaskClaimed(task: ScoutingTaskResponse): boolean {
		return !!task.claimedAt;
	}

	function getTaskStatus(task: ScoutingTaskResponse): 'in-progress' | 'failed' | 'succeeded' {
		if (!isTaskClaimed(task) && !isTaskFinished(task)) {
			return 'in-progress';
		}
		if (isTaskClaimed(task) && task.results?.success) {
			return 'succeeded';
		}
		if (isTaskClaimed(task) && !task.results?.success) {
			return 'failed';
		}
		return 'in-progress'; // Default fallback
	}

	function formatTimeRemaining(endTime: string, _currentTime: number): string {
		const end = new Date(endTime).getTime();
		const diff = end - getCurrentServerTime();

		if (diff <= 0) return 'Finished';

		const days = Math.floor(diff / (1000 * 60 * 60 * 24));
		const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
		const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
		const seconds = Math.floor((diff % (1000 * 60)) / 1000);

		if (days > 0) {
			return `${days}d ${hours}h ${minutes}m`;
		}
		return `${hours}h ${minutes}m ${seconds}s`;
	}

	function getTaskProgress(task: ScoutingTaskResponse, _currentTime: number): number {
		const startTime = new Date(task.startTime).getTime();
		const endTime = new Date(task.endTime).getTime();
		const currentServerTime = getCurrentServerTime();

		// If task is finished or claimed, return 100%
		if (isTaskFinished(task) || isTaskClaimed(task)) {
			return 100;
		}

		// Calculate progress as percentage of time elapsed
		const totalDuration = endTime - startTime;
		const elapsed = currentServerTime - startTime;
		const progress = (elapsed / totalDuration) * 100;

		// Clamp between 0 and 100
		return Math.max(0, Math.min(100, progress));
	}

	onMount(() => {
		// Initial load is handled by the reactive statement that watches $label
		// Only set up intervals here

		// Update current time every second for countdown
		const timeInterval = setInterval(() => {
			currentTime = Date.now();
		}, 1000);

		return () => {
			clearInterval(timeInterval);
		};
	});
</script>

<div
	class="min-h-screen text-white p-4 sm:p-8 overflow-x-hidden"
	style="background-image: url({bgImage}); background-size: cover; background-position: center;"
>
	<div class="space-y-6 sm:space-y-8">
		<div>
			<Button
				color="primary"
				style="normal"
				altText="Open scout talents modal"
				on:clicked={openScoutModal}
			>
				Scout Talents
			</Button>
		</div>

		<!-- Ongoing Tasks Section -->
		<div>
			<h2 class="text-2xl font-bold mb-4">Ongoing Tasks</h2>

			{#if loading}
				<p class="text-gray-400">Loading tasks...</p>
			{:else if error}
				<p class="text-red-400">Error: {error}</p>
			{:else if tasks.length === 0}
				<p class="text-gray-400">No ongoing tasks</p>
			{:else}
				<div class="flex flex-wrap gap-4">
					{#each tasks as task}
						<ScoutingTask
							state={getTaskStatus(task)}
							durationText={formatTimeRemaining(task.endTime, currentTime)}
							inProgressDescription="Observing at open mic..."
							scoutingType="Rappers"
							taskProgress={getTaskProgress(task, currentTime)}
							on:viewResults={() => openScoutResultsModal(task)}
						/>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</div>
