<script lang="ts">
	import ScoutingTaskCard from '$lib/components/cards/ScoutingTaskCard.svelte';
	import {
		addDiscoveredArtists,
		createLabelTasksQuery,
		createTasksByType,
		serverTimeOffset
	} from '$lib/queries';
	import { queryKeys } from '$lib/queries/queryClient';
	import { useQueryClient } from '@tanstack/svelte-query';
	import { fetchArtistsByIds } from '$lib/api/artists';
	import { currentLabel } from '$lib/stores/appState';
	import type { ScoutingTaskResponse, ScoutingTaskResults } from '$lib/types/task';
	import { formatTimeRemaining, getTaskProgress, getTaskStatus } from '$lib/utils';
	import bgImage from '$lib/assets/main-bg-1.png';
	import Button from '$lib/components/Button.svelte';
	import { modalStore } from '$lib/stores';

	const queryClient = useQueryClient();

	// Reactive label ID
	$: labelId = $currentLabel?.id ?? null;
	// Create the tasks query - automatically refetches when labelId changes
	$: tasksQuery = createLabelTasksQuery(labelId);

	$: taskData = $tasksQuery.data
		? createTasksByType($tasksQuery.data)
		: { scoutingTasks: [], contractTasks: [], beatProductionTasks: [], recordingReleaseTasks: [] };
	$: scoutingTasks = taskData.scoutingTasks;

	// Time tracking for progress bars
	let currentTime = Date.now();

	async function openScoutResultsModal(scoutingTaskResponse: ScoutingTaskResponse) {
		// Fetch and add discovered artists to store if they exist
		if (scoutingTaskResponse.results && 'discoveredArtistsIds' in scoutingTaskResponse.results) {
			const scoutingResults = scoutingTaskResponse.results as ScoutingTaskResults;
			if (scoutingResults.discoveredArtistsIds?.length > 0) {
				// Use query to fetch and cache artists - wait for completion
				const artists = await queryClient.fetchQuery({
					queryKey: queryKeys.artists.byIds(scoutingResults.discoveredArtistsIds),
					queryFn: () => fetchArtistsByIds(scoutingResults.discoveredArtistsIds)
				});
				addDiscoveredArtists(artists, false);
			}
		}

		// Open modal after artists are loaded
		modalStore.open('task-modal', {
			subModal: 'scout-results',
			scoutingTaskResponse: scoutingTaskResponse,
			title: 'Scouting talents',
			imageUrl:
				'https://res.cloudinary.com/dig430oem/image/upload/v1770582359/scouting-cover_puhh6v.png'
		});
	}
	function openScoutModal() {
		modalStore.open('task-modal', {
			subModal: 'scout',
			title: 'Scouting talents',
			imageUrl:
				'https://res.cloudinary.com/dig430oem/image/upload/v1770582359/scouting-cover_puhh6v.png'
		});
	}
</script>

<div
	class=" min-h-screen overflow-x-hidden p-4 text-white sm:p-8"
	style="background-image: url({bgImage}); background-size: cover; background-position: center;"
>
	<div class="mb-6">
		<Button
			color="primary"
			style="hollow"
			altText="Open scout talents modal"
			on:clicked={openScoutModal}
		>
			Scout Talents
		</Button>
	</div>
	<div class="grid grid-cols-[1fr_1fr_max-content]">
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
