<script lang="ts">
	import { onMount } from 'svelte';
	import { modalStore } from '$lib/stores/modal';
	import { currentLabel } from '$lib/stores/appState';
	import Button from '$lib/components/Button.svelte';
	import bgImage from '$lib/assets/main-bg-office.png';
	import {
		type TimedTask,
		type ScoutingTaskResponse,
		type ScoutingTaskResults,
		TaskType
	} from '$lib/types/task';
	import {
		createLabelTasksQuery,
		createTasksByType,
		serverTimeOffset
	} from '$lib/queries/taskQueries';
	import { createContractsByIdsQuery } from '$lib/queries/contractQueries';
	import { addDiscoveredArtists, createArtistsByIdsQuery } from '$lib/queries/artistQueries';
	import { createPerformanceReportsByLabelQuery } from '$lib/queries/performanceReportQueries';
	import { queryKeys } from '$lib/queries/queryClient';
	import { useQueryClient } from '@tanstack/svelte-query';
	import { fetchArtistsByIds } from '$lib/api/artists';
	import { claimTask } from '$lib/api/tasks';
	import {
		formatCurrency,
		formatTimeRemaining,
		getTaskProgress,
		getTaskStatus,
		isTaskFinished,
		handleError,
		getUserFriendlyError
	} from '$lib/utils';
	import { getDateRange } from '$lib/utils/performanceUtils';
	import { errorNotifications } from '$lib/stores/errorNotifications';
	import { openScoutingModal, openScoutResultsModal } from '$lib/modals/helpers';
	import ScoutingTaskCard from '$lib/components/cards/ScoutingTaskCard.svelte';
	import ContractsCard from '$lib/components/cards/ContractsCard.svelte';
	import ArtistCard from '$lib/components/cards/ArtistCard.svelte';
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
		: { scoutingTasks: [], contractTasks: [], beatProductionTasks: [], recordingReleaseTasks: [] };
	$: scoutingTasks = taskData.scoutingTasks;
	$: contractTasks = taskData.contractTasks;
	$: beatProductionTasks = taskData.beatProductionTasks;
	$: recordingReleaseTasks = taskData.recordingReleaseTasks;

	// Extract contract IDs directly from task.contractId (available on signing_contract_task)
	$: contractIds = contractTasks
		.map((task) => task.contractId)
		.filter((id): id is string => typeof id === 'string' && id.length > 0);

	// Deduplicate contract IDs (same contract can have multiple negotiation tasks)
	$: uniqueContractIds = [...new Set(contractIds)];

	// Create contracts query based on unique IDs
	$: contractsQuery = createContractsByIdsQuery(uniqueContractIds);

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

	// Fetch performance reports for last 2 days to calculate monthly revenue and trend
	$: dateParams = getDateRange(2); // Last 2 days
	$: reportsQuery = createPerformanceReportsByLabelQuery(labelId || '', dateParams);

	// Calculate monthly revenue (today's revenue)
	$: monthlyRevenue = $reportsQuery.data
		? $reportsQuery.data
				.filter((report) => {
					// Get today's date in YYYY-MM-DD format
					const today = new Date().toISOString().split('T')[0];
					return report.reportDate.startsWith(today);
				})
				.reduce((sum, report) => sum + report.performanceStatsForThePeriod.revenue, 0)
		: 0;

	// Calculate yesterday's revenue for comparison
	$: yesterdayRevenue = $reportsQuery.data
		? $reportsQuery.data
				.filter((report) => {
					// Get yesterday's date in YYYY-MM-DD format
					const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
					return report.reportDate.startsWith(yesterday);
				})
				.reduce((sum, report) => sum + report.performanceStatsForThePeriod.revenue, 0)
		: 0;

	// Determine trend indicator
	$: trendIndicator =
		monthlyRevenue > yesterdayRevenue ? '▲' : monthlyRevenue < yesterdayRevenue ? '▼' : '-';

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
		let hasPublishingTask = false;
		let hasBeatProductionTask = false;

		finishedUnclaimed.forEach((task) => {
			if ('contractId' in task && typeof task.contractId === 'string' && task.contractId) {
				contractIdsToRefresh.add(task.contractId);
			}
			if (task.taskType === TaskType.PublishingRelease) {
				hasPublishingTask = true;
			}
			if (task.taskType === TaskType.ProducingBeats) {
				hasBeatProductionTask = true;
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
				handleError('ClaimTask', err);
				errorNotifications.add('Task Claim Failed', getUserFriendlyError(err).message);
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

		// If any publishing tasks were claimed, invalidate releases cache
		if (hasPublishingTask) {
			queryClient.invalidateQueries({ queryKey: queryKeys.releases.byLabel(currentLabelId) });
		}

		// If any beat production tasks were claimed, invalidate beats cache
		if (hasBeatProductionTask) {
			queryClient.invalidateQueries({ queryKey: queryKeys.beats.byLabel(currentLabelId) });
		}
	}

	async function handleOpenScoutResultsModal(scoutingTaskResponse: ScoutingTaskResponse) {
		// Fetch and add discovered artists to store if they exist
		if (scoutingTaskResponse.results && 'discoveredArtistsIds' in scoutingTaskResponse.results) {
			const scoutingResults = scoutingTaskResponse.results as ScoutingTaskResults;
			if (scoutingResults.discoveredArtistsIds?.length > 0) {
				try {
					const artists = await fetchArtistsByIds(scoutingResults.discoveredArtistsIds);
					addDiscoveredArtists(artists, false);
				} catch (err) {
					handleError('FetchScoutedArtists', err);
					errorNotifications.add('Fetch Failed', 'Could not load discovered artists.');
				}
			}
		}

		openScoutResultsModal(scoutingTaskResponse);
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
	class="grid min-h-screen grid-cols-[minmax(0,35rem)_1fr_max-content] overflow-x-hidden p-4 text-white sm:p-8"
	style="background-image: url({bgImage}); background-size: cover; background-position: center;"
>
	<!-- 1 col -->
	<div class="space-y-6 sm:space-y-8">
		<div>
			<h1 class="mb-1 text-2xl font-thin">Label Roster</h1>

			<div class="flex flex-col gap-2">
				<!-- Contract List -->
				{#if $tasksQuery.isLoading}
					<p class="text-gray-400">Loading tasks...</p>
				{:else if $tasksQuery.isError}
					<p class="text-red-400">Error: {$tasksQuery.error?.message}</p>
				{:else if contractTasks.length === 0}
					<p class="text-gray-400">No contracts</p>
				{:else}
					<ContractsCard
						contractsTaskResponse={contractTasks}
						contracts={$contractsQuery.data ?? []}
						{currentTime}
					/>
				{/if}

				<!-- Artist List -->
				{#if $artistsQuery.isLoading}
					<p class="mt-4 text-gray-400">Loading artists...</p>
				{:else if $artistsQuery.isError}
					<p class="mt-4 text-red-400">Error loading artists: {$artistsQuery.error?.message}</p>
				{:else if $artistsQuery.data && $artistsQuery.data.length > 0}
					{#each $artistsQuery.data as artist (artist.id)}
						{@const artistBeatTask =
							beatProductionTasks.find((t) => {
								if (t.workerId !== artist.id) return false;
								const adjustedNow = currentTime + $serverTimeOffset;
								const startTime = new Date(t.startTime).getTime();
								const endTime = new Date(t.endTime).getTime();
								return startTime <= adjustedNow && endTime > adjustedNow;
							}) || null}
						{@const artistRecordingTask =
							recordingReleaseTasks.find((t) => {
								if (t.workerId !== artist.id) return false;
								const adjustedNow = currentTime + $serverTimeOffset;
								const startTime = new Date(t.startTime).getTime();
								const endTime = new Date(t.endTime).getTime();
								return startTime <= adjustedNow && endTime > adjustedNow;
							}) || null}
						<ArtistCard
							{artist}
							beatProductionTask={artistBeatTask}
							recordingReleaseTask={artistRecordingTask}
							{currentTime}
							serverTimeOffset={$serverTimeOffset}
						/>
					{/each}
				{/if}
			</div>
		</div>
	</div>
	<!-- 2 col -->
	<div></div>
	<!-- 3 col -->
	<div class="flex flex-col items-center gap-8">
		<div id="label-stats" class="flex grow flex-col gap-4">
			<div class="max-w-52 text-center text-3xl font-black uppercase">{$currentLabel?.name}</div>
			{#if $currentLabel?.rating}
				<div id="label-rating" class="flex flex-col-reverse items-center">
					<span class="text-xs uppercase text-secondary-700">Rating</span>
					<span class="text-2xl text-category-1-500">{$currentLabel?.rating}</span>
				</div>
			{/if}
			{#if $currentLabel?.bankroll}
				<div id="label-bank" class="flex flex-col-reverse items-center">
					<span class="text-xs uppercase text-secondary-700">Bank</span>
					<span class="text-2xl font-black">{formatCurrency($currentLabel?.bankroll)}</span>
				</div>
			{/if}
			<div id="monthly-revenue" class="flex flex-col-reverse items-center">
				<span class="text-xs uppercase text-secondary-700">Monthly<br />Revenue</span>
				<div class="flex items-center text-category-2-500">
					<span class="text-2xl font-black">{formatCurrency(monthlyRevenue)}</span>
					<span class="mt-2 text-xs">{trendIndicator}</span>
				</div>
			</div>
		</div>

		<!-- Scouting Tasks Section -->
		<div>
			{#if $tasksQuery.isLoading}
				<p class="text-gray-400">Loading scouting tasks...</p>
			{:else if $tasksQuery.isError}
				<p class="text-red-400">Error: {$tasksQuery.error?.message}</p>
			{:else if scoutingTasks.length === 0}
				<div>
					<Button
						color="primary"
						style="hollow"
						altText="Open scout talents modal"
						on:clicked={openScoutingModal}
					>
						Scout Talents
					</Button>
				</div>
			{:else}
				{@const lastTask = scoutingTasks[scoutingTasks.length - 1]}
				<div class="flex flex-wrap gap-4">
					<ScoutingTaskCard
						state={getTaskStatus(lastTask, $serverTimeOffset)}
						durationText={formatTimeRemaining(lastTask.endTime, currentTime, $serverTimeOffset)}
						inProgressDescription="Observing at open mic..."
						scoutingType={lastTask.scoutingType}
						taskProgress={getTaskProgress(lastTask, $serverTimeOffset)}
						on:viewResults={() => handleOpenScoutResultsModal(lastTask)}
					/>
				</div>
			{/if}
		</div>
	</div>
</div>
