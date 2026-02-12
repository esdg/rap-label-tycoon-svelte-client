<script lang="ts">
	import ArtistCard from '$lib/components/cards/ArtistCard.svelte';
	import { currentTime, serverAdjustedTime } from '$lib/stores/globalTime';
	import { createContractsByIdsQuery } from '$lib/queries/contractQueries';
	import { createArtistsByIdsQuery } from '$lib/queries/artistQueries';
	import {
		createLabelTasksQuery,
		createTasksByType,
		serverTimeOffset
	} from '$lib/queries/taskQueries';
	import type {
		ProducingBeatsTaskResponse,
		RecordingReleaseTaskResponse,
		RestingTaskResponse,
		SigningContractTaskResponse
	} from '$lib/types/task';
	import { currentLabel } from '$lib/stores/appState';
	import type { Artist } from '$lib/types/nonPlayingCharacter';
	import { createLabelByIdQuery } from '$lib/queries/labelQueries';
	import PageContentWithScroll from '$lib/components/PageContentWithScroll.svelte';
	import ArtistFinderSubNavigationBar from '$lib/components/navigation/ArtistFinderSubNavigationBar.svelte';

	$: labelId = $currentLabel?.id ?? null;
	$: labelQuery = createLabelByIdQuery(labelId);
	$: labelData = $labelQuery.data ?? $currentLabel;

	// Tasks + time sync (progress bars use the same logic as the label dashboard)
	$: tasksQuery = createLabelTasksQuery(labelId);
	let contractTasks: SigningContractTaskResponse[] = [];
	let beatProductionTasks: ProducingBeatsTaskResponse[] = [];
	let recordingReleaseTasks: RecordingReleaseTaskResponse[] = [];
	let restingTasks: RestingTaskResponse[] = [];
	$: taskData = $tasksQuery.data
		? createTasksByType($tasksQuery.data)
		: {
				scoutingTasks: [],
				contractTasks: [],
				beatProductionTasks: [],
				recordingReleaseTasks: [],
				restingTasks: []
			};
	$: ({ contractTasks, beatProductionTasks, recordingReleaseTasks, restingTasks } = taskData);

	// Contracts -> signed artist IDs
	$: contractIds = contractTasks
		.map((task) => task.contractId)
		.filter((id): id is string => typeof id === 'string' && id.length > 0);
	$: uniqueContractIds = [...new Set(contractIds)];
	$: contractsQuery = createContractsByIdsQuery(uniqueContractIds);

	// Watchlist artists
	$: watchlistArtistIds = labelData?.artistsWatchlistIds ?? [];
	$: watchlistArtistsQuery = createArtistsByIdsQuery(watchlistArtistIds);

	// Active dataset based on selected view
	$: watchlistArtists = $watchlistArtistsQuery.data ?? [];

	// Split by role
	const isRapper = (artist: Artist) => 'songWritingSkills' in artist;
	const isBeatmaker = (artist: Artist) => 'beatmakingSkills' in artist;
	$: rappers = watchlistArtists.filter(isRapper);
	$: beatmakers = watchlistArtists.filter(isBeatmaker);

	// Loading/error helpers
	$: isWatchlistLoading = $watchlistArtistsQuery.isLoading;
	$: activeLoading = isWatchlistLoading;
	$: activeError = $tasksQuery.error || $contractsQuery.error || $watchlistArtistsQuery.error;

	function getErrorMessage(err: unknown): string {
		if (!err) return '';
		return err instanceof Error ? err.message : String(err);
	}

	function getActiveBeatTask(artistId: string) {
		const adjustedNow = $serverAdjustedTime;
		return (
			beatProductionTasks.find((task) => {
				if (task.workerId !== artistId) return false;
				const startTime = new Date(task.startTime).getTime();
				const endTime = new Date(task.endTime).getTime();
				return startTime <= adjustedNow && endTime > adjustedNow;
			}) ?? null
		);
	}

	function getActiveRecordingTask(artistId: string) {
		const adjustedNow = $serverAdjustedTime;
		return (
			recordingReleaseTasks.find((task) => {
				if (task.workerId !== artistId) return false;
				const startTime = new Date(task.startTime).getTime();
				const endTime = new Date(task.endTime).getTime();
				return startTime <= adjustedNow && endTime > adjustedNow;
			}) ?? null
		);
	}
	function getActiveRestingTask(artistId: string) {
		const adjustedNow = $serverAdjustedTime;
		return (
			restingTasks.find((task) => {
				if (task.workerId !== artistId) return false;
				const startTime = new Date(task.startTime).getTime();
				const endTime = new Date(task.endTime).getTime();
				return startTime <= adjustedNow && endTime > adjustedNow;
			}) ?? null
		);
	}
</script>

<PageContentWithScroll>
	<div class="mb-10 flex select-none flex-wrap items-start justify-between gap-4">
		<div>
			<h1 class="text-7xl font-thin uppercase leading-none">Artists watchlist</h1>
			<p class="text-sm text-gray-300">
				Mark your artists as your favorites to keep track of their progress.
			</p>
		</div>
		<ArtistFinderSubNavigationBar />
	</div>
	{#if activeLoading}
		<p class="text-gray-300">Loading artists...</p>
	{:else if activeError}
		<p class="text-red-400">Error loading artists: {getErrorMessage(activeError)}</p>
	{:else if watchlistArtists.length === 0}
		<p class="text-gray-300">No artists to display for this view yet.</p>
	{:else}
		<div class="grid gap-6 lg:grid-cols-2">
			<div class="space-y-4">
				<h2 class="select-none text-2xl font-thin uppercase text-white">Rappers</h2>
				{#if rappers.length === 0}
					<p class="text-gray-400">No rappers available.</p>
				{:else}
					{#each rappers as artist (artist.id)}
						<ArtistCard
							{artist}
							beatProductionTask={getActiveBeatTask(artist.id)}
							recordingReleaseTask={getActiveRecordingTask(artist.id)}
							restingTask={getActiveRestingTask(artist.id)}
							currentTime={$currentTime}
							serverTimeOffset={$serverTimeOffset}
						/>
					{/each}
				{/if}
			</div>

			<div class="space-y-4">
				<h2 class="select-none text-2xl font-thin uppercase text-white">Beatmakers</h2>
				{#if beatmakers.length === 0}
					<p class="text-gray-400">No beatmakers available.</p>
				{:else}
					{#each beatmakers as artist (artist.id)}
						<ArtistCard
							{artist}
							beatProductionTask={getActiveBeatTask(artist.id)}
							recordingReleaseTask={getActiveRecordingTask(artist.id)}
							restingTask={getActiveRestingTask(artist.id)}
							currentTime={$currentTime}
							serverTimeOffset={$serverTimeOffset}
						/>
					{/each}
				{/if}
			</div>
		</div>
	{/if}
</PageContentWithScroll>
