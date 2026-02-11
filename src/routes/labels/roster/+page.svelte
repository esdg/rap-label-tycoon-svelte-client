<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import ArtistCard from '$lib/components/cards/ArtistCard.svelte';
	import Tooltip from '$lib/components/Tooltip.svelte';
	import bgImage from '$lib/assets/main-bg-office.png';
	import { currentTime, serverAdjustedTime } from '$lib/stores/globalTime';
	import { createContractsByIdsQuery } from '$lib/queries/contractQueries';
	import { createArtistsByIdsQuery, discoveredArtistsList } from '$lib/queries/artistQueries';
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
	import { ContractStatus } from '$lib/types/contracts';
	import type { Artist } from '$lib/types/nonPlayingCharacter';
	import { createLabelByIdQuery } from '$lib/queries/labelQueries';

	type ViewMode = 'roster' | 'watchlist' | 'discovered';
	const viewOptions: { key: ViewMode; label: string }[] = [
		{ key: 'roster', label: 'Roster' },
		{ key: 'watchlist', label: 'Watchlist' },
		{ key: 'discovered', label: 'Discovered' }
	];

	const viewDescriptions: Record<ViewMode, string> = {
		roster: 'Signed artists with active contracts; progress shows their current tasks.',
		watchlist: 'Artists you bookmarked to track before signing; timers show any ongoing work.',
		discovered: 'Talents found via scouting or label records; use this to decide who to sign next.'
	};

	let activeView: ViewMode = 'roster';

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
	$: signedContracts = ($contractsQuery.data ?? []).filter((contract) => {
		if (contract.status !== ContractStatus.Signed) return false;
		if (!contract.endDate) return true;
		return new Date(contract.endDate).getTime() > Date.now();
	});
	$: rosterArtistIds = signedContracts
		.map((contract) => contract.artistId)
		.filter((id): id is string => typeof id === 'string' && id.length > 0);
	$: rosterArtistsQuery = createArtistsByIdsQuery(rosterArtistIds);

	// Watchlist artists
	$: watchlistArtistIds = labelData?.artistsWatchlistIds ?? [];
	$: watchlistArtistsQuery = createArtistsByIdsQuery(watchlistArtistIds);

	// Discovered artists (persisted on label + locally stored discoveries)
	$: labelDiscoveredIds = labelData?.discoveredArtistsIds ?? [];
	$: labelDiscoveredArtistsQuery = createArtistsByIdsQuery(labelDiscoveredIds);
	$: discoveredFromStore = $discoveredArtistsList.map((entry) => entry.artist);
	$: discoveredFromLabel = $labelDiscoveredArtistsQuery.data ?? [];
	$: discoveredArtists = Array.from(
		new Map<string, Artist>(
			[...discoveredFromLabel, ...discoveredFromStore].map((artist) => [artist.id, artist])
		).values()
	);

	// Active dataset based on selected view
	$: rosterArtists = $rosterArtistsQuery.data ?? [];
	$: watchlistArtists = $watchlistArtistsQuery.data ?? [];
	$: activeArtists =
		activeView === 'roster'
			? rosterArtists
			: activeView === 'watchlist'
				? watchlistArtists
				: discoveredArtists;

	// Split by role
	const isRapper = (artist: Artist) => 'songWritingSkills' in artist;
	const isBeatmaker = (artist: Artist) => 'beatmakingSkills' in artist;
	$: rappers = activeArtists.filter(isRapper);
	$: beatmakers = activeArtists.filter(isBeatmaker);

	// Loading/error helpers
	$: isRosterLoading =
		$tasksQuery.isLoading || $contractsQuery.isLoading || $rosterArtistsQuery.isLoading;
	$: isWatchlistLoading = $watchlistArtistsQuery.isLoading;
	$: isDiscoveredLoading = $labelDiscoveredArtistsQuery.isLoading && labelDiscoveredIds.length > 0;
	$: activeLoading =
		activeView === 'roster'
			? isRosterLoading
			: activeView === 'watchlist'
				? isWatchlistLoading
				: isDiscoveredLoading;
	$: activeError =
		activeView === 'roster'
			? $tasksQuery.error || $contractsQuery.error || $rosterArtistsQuery.error
			: activeView === 'watchlist'
				? $watchlistArtistsQuery.error
				: $labelDiscoveredArtistsQuery.error;

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

<div
	class="min-h-screen overflow-x-hidden bg-cover bg-center p-4 text-white sm:p-8"
	style="background-image: url({bgImage});"
>
	<div class="mx-auto flex max-w-7xl flex-col gap-6">
		<div class="flex select-none flex-wrap items-center justify-between gap-4">
			<div>
				<h1 class="text-7xl font-thin uppercase leading-none">Artists</h1>
				<p class="text-sm text-gray-300">Switch between roster, watchlist, and discoveries.</p>
			</div>
			<div class="flex flex-wrap gap-2">
				{#each viewOptions as option}
					<Tooltip position="bottom" maxWidth={260}>
						<svelte:fragment slot="trigger">
							<Button
								color="primary"
								style={activeView === option.key ? 'normal' : 'hollow'}
								altText={`Show ${option.label.toLowerCase()} artists`}
								on:clicked={() => (activeView = option.key)}
							>
								{option.label}
							</Button>
						</svelte:fragment>
						{viewDescriptions[option.key]}
					</Tooltip>
				{/each}
			</div>
		</div>

		{#if activeLoading}
			<p class="text-gray-300">Loading artists...</p>
		{:else if activeError}
			<p class="text-red-400">Error loading artists: {getErrorMessage(activeError)}</p>
		{:else if activeArtists.length === 0}
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
	</div>
</div>
