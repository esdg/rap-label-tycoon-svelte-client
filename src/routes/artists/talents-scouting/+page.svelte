<script lang="ts">
	import { fetchArtistsByIds } from '$lib/api';
	import ScoutingTaskCard from '$lib/components/cards/ScoutingTaskCard.svelte';
	import {
		addDiscoveredArtists,
		createLabelTasksQuery,
		createTasksByType,
		createScoutingScopesQuery,
		serverTimeOffset
	} from '$lib/queries';
	import { currentLabel } from '$lib/stores/appState';
	import { currentTime } from '$lib/stores/globalTime';
	import type { ScoutingTaskResponse, ScoutingTaskResults } from '$lib/types/task';
	import { formatTimeRemaining, getTaskProgress, getTaskStatus } from '$lib/utils';
	import bgImage from '$lib/assets/main-bg-1.png';
	import Button from '$lib/components/Button.svelte';
	import { openScoutingModal, openScoutResultsModal } from '$lib/modals/helpers';
	import ButtonsGroup from '$lib/components/ButtonsGroup.svelte';
	import { goto } from '$app/navigation';
	import ArtistFinderSubNavigationBar from '$lib/components/navigation/ArtistFinderSubNavigationBar.svelte';
	import PageContentWithScroll from '$lib/components/PageContentWithScroll.svelte';

	// Helper to check if a task is optimistic (has temporary ID and extra data)
	function isOptimisticTask(task: any): boolean {
		return task?._optimistic === true;
	}

	function getScopeMessages(task: any, scopes: any[] | undefined): string[] {
		if (!task?.scopeId || !scopes) {
			return ['Searching for talent...'];
		}
		const scope = scopes.find((s: any) => s.id === task.scopeId);
		return scope?.messages?.length > 0 ? scope.messages : ['Searching for talent...'];
	}

	// Reactive label ID
	$: labelId = $currentLabel?.id ?? null;
	// Create queries
	$: scoutingScopesQuery = createScoutingScopesQuery();
	$: tasksQuery = createLabelTasksQuery(labelId);

	$: taskData = $tasksQuery.data
		? createTasksByType($tasksQuery.data)
		: { scoutingTasks: [], contractTasks: [], beatProductionTasks: [], recordingReleaseTasks: [] };
	$: scoutingTasks = taskData.scoutingTasks;

	// Note: Time tracking is now handled by global time store (no local timer needed)

	// Create reactive task data that depends on currentTime to ensure updates
	$: taskCards = scoutingTasks.map((task) => {
		const isOptimistic = isOptimisticTask(task);
		const state: 'loading' | 'in-progress' | 'failed' | 'succeeded' | 'error' = isOptimistic
			? 'loading'
			: getTaskStatus(task, $serverTimeOffset);
		return {
			task,
			state,
			durationText: formatTimeRemaining(task.endTime, $currentTime, $serverTimeOffset),
			taskProgress: getTaskProgress(task, $serverTimeOffset, $currentTime)
		};
	});

	async function handleOpenScoutResultsModal(scoutingTaskResponse: ScoutingTaskResponse) {
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

		openScoutResultsModal(scoutingTaskResponse);
	}
</script>

<PageContentWithScroll>
	<div class="mb-10 flex select-none flex-wrap items-start justify-between gap-4">
		<div>
			<h1 class="text-7xl font-thin uppercase leading-none">Artists finder</h1>
			<p class="text-sm text-gray-300">Discover and scout new talents for your label.</p>
		</div>
		<ArtistFinderSubNavigationBar />
	</div>

	<div class="mb-6">
		<Button
			color="primary"
			style="hollow"
			altText="Open scout talents modal"
			on:clicked={openScoutingModal}
		>
			Scout New Talents
		</Button>
	</div>

	<div>
		{#if $tasksQuery.isLoading}
			<p class="text-gray-400">Loading scouting tasks...</p>
		{:else if $tasksQuery.isError}
			<p class="text-red-400">Error: {$tasksQuery.error?.message}</p>
		{:else if scoutingTasks.length === 0}
			<p class="text-gray-400">No scouting tasks</p>
		{:else}
			<div class="flex flex-wrap gap-4">
				{#each taskCards as { task, state, durationText, taskProgress } (task.id)}
					{@const messages = getScopeMessages(task, $scoutingScopesQuery.data)}
					<ScoutingTaskCard
						{state}
						{durationText}
						{messages}
						scoutingType={task.scoutingType}
						{taskProgress}
						on:viewResults={() => handleOpenScoutResultsModal(task)}
					/>
				{/each}
			</div>
		{/if}
	</div>
</PageContentWithScroll>
