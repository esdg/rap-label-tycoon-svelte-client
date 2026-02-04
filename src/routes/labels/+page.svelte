<script lang="ts">
	import { onMount } from 'svelte';
	import { modalStore } from '$lib/stores/modal';
	import { currentLabel } from '$lib/stores/appState';
	import Button from '$lib/components/Button.svelte';
	import bgImage from '$lib/assets/main-bg-1.png';
	import ScoutingTaskCard from '$lib/components/Cards/ScoutingTaskCard.svelte';
	import {
		TaskType,
		type TaskResponse,
		type ScoutingTaskResponse,
		type SigningContractTaskResponse,
		type ScoutingTaskResults
	} from '$lib/types/task';
	import { ScoutingType } from '$lib/types/scoutingArtistsTask';
	import ContractsCard from '$lib/components/Cards/ContractsCard.svelte';
	import {
		createLabelTasksQuery,
		createTasksByType,
		createClaimTaskMutation,
		serverTimeOffset,
		getServerTime
	} from '$lib/queries/taskQueries';
	import { createContractsByIdsQuery } from '$lib/queries/contractQueries';
	import { createArtistsByIdsQuery, addDiscoveredArtists } from '$lib/queries/artistQueries';
	import { queryKeys } from '$lib/queries/queryClient';
	import { useQueryClient } from '@tanstack/svelte-query';
	import { fetchArtistsByIds } from '$lib/api/artists';
	import { claimTask } from '$lib/api/tasks';
	import { setContracts } from '$lib/stores/contracts';

	// Get query client for manual invalidation
	const queryClient = useQueryClient();

	// Reactive label ID
	$: labelId = $currentLabel?.id ?? null;

	// Create the tasks query - automatically refetches when labelId changes
	$: tasksQuery = createLabelTasksQuery(labelId);

	// Split tasks by type (derived from query data)
	$: taskData = $tasksQuery.data
		? createTasksByType($tasksQuery.data)
		: { scoutingTasks: [], contractTasks: [] };
	$: scoutingTasks = taskData.scoutingTasks;
	$: contractTasks = taskData.contractTasks;

	// Extract contract IDs directly from task.contractId (available on signing_contract_task)
	$: contractIds = contractTasks
		.map((task) => task.contractId)
		.filter((id): id is string => typeof id === 'string' && id.length > 0);

	// Deduplicate contract IDs (same contract can have multiple negotiation tasks)
	$: uniqueContractIds = [...new Set(contractIds)];

	// Create contracts query based on unique IDs
	$: contractsQuery = createContractsByIdsQuery(uniqueContractIds);

	// Sync contracts query data to legacy store for backward compatibility
	$: if ($contractsQuery.data) {
		setContracts($contractsQuery.data);
	}

	// Time tracking for progress bars
	let currentTime = Date.now();

	// Previous modal state for refresh on close
	let previousModalState = $modalStore.isOpen;

	// Watch for modal state changes to refetch
	$: {
		if (previousModalState && !$modalStore.isOpen) {
			// Modal just closed, refresh tasks
			queryClient.invalidateQueries({ queryKey: queryKeys.tasks.byLabel(labelId!) });
		}
		previousModalState = $modalStore.isOpen;
	}

	// Auto-claim finished tasks when data loads
	$: if ($tasksQuery.data && labelId) {
		autoClaimFinishedTasks($tasksQuery.data, labelId);
	}

	// Track which tasks we've already started claiming to avoid duplicates
	let claimingTaskIds = new Set<string>();

	async function autoClaimFinishedTasks(tasks: TaskResponse[], currentLabelId: string) {
		const finishedUnclaimed = tasks.filter(
			(task) => !task.claimedAt && isTaskFinished(task) && !claimingTaskIds.has(task.id)
		);

		if (finishedUnclaimed.length === 0) return;

		// Mark tasks as being claimed
		finishedUnclaimed.forEach((task) => claimingTaskIds.add(task.id));

		// Claim all finished tasks in parallel
		const claimPromises = finishedUnclaimed.map(async (task) => {
			try {
				const claimedTask = await claimTask(task.id);

				// Fetch and store discovered artists if this is a scouting task
				if (claimedTask.results && 'discoveredArtistsIds' in claimedTask.results) {
					const scoutingResults = claimedTask.results as ScoutingTaskResults;
					if (scoutingResults.discoveredArtistsIds?.length > 0) {
						const artists = await fetchArtistsByIds(scoutingResults.discoveredArtistsIds);
						addDiscoveredArtists(artists, false);
					}
				}

				return { success: true, taskId: task.id };
			} catch (err) {
				console.error(`Failed to claim task ${task.id}:`, err);
				claimingTaskIds.delete(task.id); // Allow retry
				return { success: false, taskId: task.id, error: err };
			}
		});

		await Promise.all(claimPromises);

		// Refetch tasks to get updated state
		queryClient.invalidateQueries({ queryKey: queryKeys.tasks.byLabel(currentLabelId) });
	}

	function openScoutModal() {
		modalStore.open('task-modal', {
			subModal: 'scout',
			title: 'Scouting talents',
			imageUrl:
				'https://res.cloudinary.com/dig430oem/image/upload/v1769715987/scouting-cover_mtrurs.png'
		});
	}

	async function openScoutResultsModal(scoutingTaskResponse: ScoutingTaskResponse) {
		// Fetch and add discovered artists to store if they exist
		if (scoutingTaskResponse.results && 'discoveredArtistsIds' in scoutingTaskResponse.results) {
			const scoutingResults = scoutingTaskResponse.results as ScoutingTaskResults;
			if (scoutingResults.discoveredArtistsIds?.length > 0) {
				try {
					const artists = await fetchArtistsByIds(scoutingResults.discoveredArtistsIds);
					addDiscoveredArtists(artists, false);
				} catch (err) {
					console.error('Failed to fetch discovered artists:', err);
				}
			}
		}

		modalStore.open('task-modal', {
			subModal: 'scout-results',
			scoutingTaskResponse: scoutingTaskResponse,
			title: 'Scouting talents',
			imageUrl:
				'https://res.cloudinary.com/dig430oem/image/upload/v1769715987/scouting-cover_mtrurs.png'
		});
	}

	function getCurrentServerTime(): number {
		return getServerTime($serverTimeOffset);
	}

	function isTaskFinished(task: TaskResponse): boolean {
		const endTime = new Date(task.endTime).getTime();
		return endTime <= getCurrentServerTime();
	}

	function isTaskClaimed(task: TaskResponse): boolean {
		return !!task.claimedAt;
	}

	function getTaskStatus(task: TaskResponse): 'in-progress' | 'failed' | 'succeeded' {
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

	function getTaskProgress(task: TaskResponse, _currentTime: number): number {
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

	function getScoutingType(task: ScoutingTaskResponse): ScoutingType {
		const results = task.results;
		// $type in API is string like "rapper" or "beatmaker", map to enum
		if (results?.$type === 'rapper') return ScoutingType.Rappers;
		if (results?.$type === 'beatmaker') return ScoutingType.Beatmakers;
		return ScoutingType.Rappers;
	}

	onMount(() => {
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

		<div>
			<h1 class="text-2xl font-bold mb-4">Label Roster</h1>
			{#if $tasksQuery.isLoading}
				<p class="text-gray-400">Loading tasks...</p>
			{:else if $tasksQuery.isError}
				<p class="text-red-400">Error: {$tasksQuery.error?.message}</p>
			{:else if contractTasks.length === 0}
				<p class="text-gray-400">No contracts</p>
			{:else}
				<ContractsCard contractsTaskResponse={contractTasks} />
			{/if}
		</div>
		<!-- Ongoing Tasks Section -->
		<div>
			<h2 class="text-2xl font-bold mb-4">Ongoing Tasks</h2>

			{#if $tasksQuery.isLoading}
				<p class="text-gray-400">Loading tasks...</p>
			{:else if $tasksQuery.isError}
				<p class="text-red-400">Error: {$tasksQuery.error?.message}</p>
			{:else if scoutingTasks.length === 0}
				<p class="text-gray-400">No ongoing tasks</p>
			{:else}
				<div class="flex flex-wrap gap-4">
					{#each scoutingTasks as task}
						<ScoutingTaskCard
							state={getTaskStatus(task)}
							durationText={formatTimeRemaining(task.endTime, currentTime)}
							inProgressDescription="Observing at open mic..."
							scoutingType={getScoutingType(task)}
							taskProgress={getTaskProgress(task, currentTime)}
							on:viewResults={() => openScoutResultsModal(task)}
						/>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</div>
