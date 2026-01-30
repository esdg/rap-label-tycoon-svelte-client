<script lang="ts">
	import { onMount } from 'svelte';
	import { modalStore } from '$lib/stores/modal';
	import { label } from '$lib/stores/label';
	import Button from '$lib/components/Button.svelte';
	import { fetchLabelTasks } from '$lib/api';
	import type { ScoutingTaskResponse } from '$lib/types/scouting';

	let tasks: ScoutingTaskResponse[] = [];
	let serverTime: Date | null = null;
	let loading = true;
	let error: string | null = null;
	let previousModalState = $modalStore.isOpen;

	function openScoutModal() {
		modalStore.open('task-modal', {
			subModal: 'scout',
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

	async function loadTasks() {
		if (!$label?.id) {
			error = 'No label selected';
			loading = false;
			return;
		}

		try {
			const { tasks: fetchedTasks, serverTime: serverTimeStr } = await fetchLabelTasks($label.id);
			tasks = fetchedTasks.filter((task) => !task.claimedAt);
			serverTime = new Date(serverTimeStr);
			loading = false;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load tasks';
			loading = false;
		}
	}

	function isTaskFinished(task: ScoutingTaskResponse): boolean {
		if (!serverTime) return false;
		return new Date(task.endTime) <= serverTime;
	}

	function formatTimeRemaining(endTime: string): string {
		if (!serverTime) return '';
		const end = new Date(endTime);
		const diff = end.getTime() - serverTime.getTime();

		if (diff <= 0) return 'Finished';

		const hours = Math.floor(diff / (1000 * 60 * 60));
		const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
		const seconds = Math.floor((diff % (1000 * 60)) / 1000);

		return `${hours}h ${minutes}m ${seconds}s`;
	}

	onMount(() => {
		loadTasks();
		// Refresh tasks every 10 seconds
		const interval = setInterval(loadTasks, 10000);
		return () => clearInterval(interval);
	});
</script>

<div class="min-h-screen bg-gray-900 text-white p-8">
	<h1 class="text-3xl font-bold mb-8">Dashboard</h1>

	<div class="space-y-8">
		<div>
			<Button
				color="blue"
				style="normal"
				text="Scout Talents"
				altText="Open scout talents modal"
				on:clicked={openScoutModal}
			/>
		</div>

		<!-- Ongoing Tasks Section -->
		<div class="bg-gray-800 rounded-lg p-6">
			<h2 class="text-2xl font-bold mb-4">Ongoing Tasks</h2>

			{#if loading}
				<p class="text-gray-400">Loading tasks...</p>
			{:else if error}
				<p class="text-red-400">Error: {error}</p>
			{:else if tasks.length === 0}
				<p class="text-gray-400">No ongoing tasks</p>
			{:else}
				<div class="space-y-4">
					{#each tasks as task}
						<div
							class="bg-gray-700 rounded-lg p-4 border-l-4 {isTaskFinished(task)
								? 'border-green-500'
								: 'border-blue-500'}"
						>
							<div class="flex justify-between items-start mb-2">
								<div class="flex-1">
									<h3 class="text-lg font-semibold">{task.name}</h3>
									<p class="text-gray-300 text-sm mt-1">{task.description}</p>
								</div>
								<div class="ml-4">
									{#if isTaskFinished(task)}
										<span class="px-3 py-1 bg-green-600 rounded-full text-sm font-semibold"
											>Finished</span
										>
									{:else}
										<span class="px-3 py-1 bg-blue-600 rounded-full text-sm font-semibold"
											>In Progress</span
										>
									{/if}
								</div>
							</div>

							<div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
								<div>
									<span class="text-gray-400">Budget:</span>
									<span class="ml-2 font-semibold">${task.budgetRequired.toLocaleString()}</span>
								</div>
								<div>
									<span class="text-gray-400">Stamina:</span>
									<span class="ml-2 font-semibold">{task.staminaCost}</span>
								</div>
								<div>
									<span class="text-gray-400">Started:</span>
									<span class="ml-2 font-semibold"
										>{new Date(task.startTime).toLocaleTimeString()}</span
									>
								</div>
								<div>
									<span class="text-gray-400">Time:</span>
									<span class="ml-2 font-semibold">{formatTimeRemaining(task.endTime)}</span>
								</div>
							</div>

							{#if isTaskFinished(task) && task.results}
								<div class="mt-3 pt-3 border-t border-gray-600">
									<div class="flex items-center">
										<span class="text-gray-400 text-sm mr-2">Result:</span>
										<span
											class="text-sm {task.results.success ? 'text-green-400' : 'text-red-400'}"
										>
											{task.results.success ? '✓ Success' : '✗ Failed'}
										</span>
										{#if task.results.details}
											<span class="text-gray-300 text-sm ml-2">- {task.results.details}</span>
										{/if}
									</div>
								</div>
							{/if}
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</div>
