<script lang="ts">
	import { onMount } from 'svelte';
	import { modalStore } from '$lib/stores/modal';
	import { currentLabel } from '$lib/stores/appState';
	import Button from '$lib/components/Button.svelte';
	import bgImage from '$lib/assets/main-bg-1.png';
	import {
		type TimedTask,
		type ScoutingTaskResponse,
		type ScoutingTaskResults
	} from '$lib/types/task';
	import {
		createLabelTasksQuery,
		createTasksByType,
		serverTimeOffset
	} from '$lib/queries/taskQueries';
	import { createContractsByIdsQuery } from '$lib/queries/contractQueries';
	import { addDiscoveredArtists } from '$lib/queries/artistQueries';
	import { queryKeys } from '$lib/queries/queryClient';
	import { useQueryClient } from '@tanstack/svelte-query';
	import { fetchArtistsByIds } from '$lib/api/artists';
	import { claimTask } from '$lib/api/tasks';
	import { setContracts } from '$lib/stores/contracts';
	import {
		formatTimeRemaining,
		getTaskProgress,
		getTaskStatus,
		getScoutingType,
		isTaskFinished
	} from '$lib/utils';
	import ScoutingTaskCard from '$lib/components/cards/ScoutingTaskCard.svelte';
	import ContractsCard from '$lib/components/cards/ContractsCard.svelte';
	import ArtistCard from '$lib/components/cards/ArtistCard.svelte';
	import { createArtistsByIdsQuery } from '$lib/queries/artistQueries';
	import { ContractStatus } from '$lib/types/contracts';

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

	// Filter for valid signed contracts (status = signed, end date not passed)
	// Note: Don't use currentTime here to avoid recreating queries every second
	$: validContracts = ($contractsQuery.data ?? []).filter((contract) => {
		if (contract.status !== ContractStatus.Signed) return false;
		if (!contract.endDate) return true; // No end date means active
		const endDate = new Date(contract.endDate).getTime();
		return endDate > Date.now(); // Use Date.now() directly instead of currentTime
	});

	// Extract artist IDs from valid contracts
	$: validArtistIds = validContracts
		.map((contract) => contract.artistId)
		.filter((id): id is string => typeof id === 'string' && id.length > 0);

	// Create artists query based on valid contract artist IDs
	$: artistsQuery = createArtistsByIdsQuery(validArtistIds);

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

	// Auto-claim finished tasks; include currentTime so this re-runs when timers tick
	$: if ($tasksQuery.data && labelId && currentTime) {
		autoClaimFinishedTasks($tasksQuery.data, labelId);
	}

	// Track which tasks we've already started claiming to avoid duplicates
	let claimingTaskIds = new Set<string>();

	async function autoClaimFinishedTasks(tasks: TimedTask[], currentLabelId: string) {
		const finishedUnclaimed = tasks.filter(
			(task) =>
				!task.claimedAt && isTaskFinished(task, $serverTimeOffset) && !claimingTaskIds.has(task.id)
		);

		const contractIdsToRefresh = new Set<string>();
		finishedUnclaimed.forEach((task) => {
			if ('contractId' in task && typeof task.contractId === 'string' && task.contractId) {
				contractIdsToRefresh.add(task.contractId);
			}
		});

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
		queryClient.invalidateQueries({ queryKey: queryKeys.contracts.byLabel(currentLabelId) });

		if (contractIdsToRefresh.size > 0) {
			queryClient.invalidateQueries({
				queryKey: queryKeys.contracts.byIds([...contractIdsToRefresh])
			});
		}
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

			<div class="flex flex-col gap-2">
				<!-- Contract List -->
				{#if $tasksQuery.isLoading}
					<p class="text-gray-400">Loading tasks...</p>
				{:else if $tasksQuery.isError}
					<p class="text-red-400">Error: {$tasksQuery.error?.message}</p>
				{:else if contractTasks.length === 0}
					<p class="text-gray-400">No contracts</p>
				{:else}
					<ContractsCard contractsTaskResponse={contractTasks} {currentTime} />
				{/if}

				<!-- Artist List -->
				{#if $artistsQuery.isLoading}
					<p class="text-gray-400 mt-4">Loading artists...</p>
				{:else if $artistsQuery.isError}
					<p class="text-red-400 mt-4">Error loading artists: {$artistsQuery.error?.message}</p>
				{:else if $artistsQuery.data && $artistsQuery.data.length > 0}
					{#each $artistsQuery.data as artist (artist.id)}
						<ArtistCard {artist} />
					{/each}
				{/if}
			</div>
		</div>
		<!-- Scouting Tasks Section -->
		<div>
			<h2 class="text-2xl font-bold mb-4">Scouting Tasks</h2>

			{#if $tasksQuery.isLoading}
				<p class="text-gray-400">Loading scouting tasks...</p>
			{:else if $tasksQuery.isError}
				<p class="text-red-400">Error: {$tasksQuery.error?.message}</p>
			{:else if scoutingTasks.length === 0}
				<p class="text-gray-400">No scouting tasks</p>
			{:else}
				<div class="flex flex-wrap gap-4">
					{#each scoutingTasks as task}
						<ScoutingTaskCard
							state={getTaskStatus(task, $serverTimeOffset)}
							durationText={formatTimeRemaining(task.endTime, currentTime, $serverTimeOffset)}
							inProgressDescription="Observing at open mic..."
							scoutingType={task.scoutingType}
							taskProgress={getTaskProgress(task, $serverTimeOffset)}
							on:viewResults={() => openScoutResultsModal(task)}
						/>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</div>
