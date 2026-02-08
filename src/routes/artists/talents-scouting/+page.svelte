<script lang="ts">
	import { fetchArtistsByIds } from '$lib/api';
	import ScoutingTaskCard from '$lib/components/cards/ScoutingTaskCard.svelte';
	import {
		addDiscoveredArtists,
		createLabelTasksQuery,
		createTasksByType,
		serverTimeOffset
	} from '$lib/queries';
	import { currentLabel } from '$lib/stores/appState';
	import type { ScoutingTaskResponse, ScoutingTaskResults } from '$lib/types/task';
	import { formatTimeRemaining, getTaskProgress, getTaskStatus } from '$lib/utils';

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
				try {
					const artists = await fetchArtistsByIds(scoutingResults.discoveredArtistsIds);
					addDiscoveredArtists(artists, false);
				} catch (err) {
					console.error('Failed to fetch discovered artists:', err);
				}
			}
		}
	}
</script>

<div>
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
