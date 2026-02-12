<script lang="ts">
	import ArtistCard from '$lib/components/cards/ArtistCard.svelte';
	import { createContractsByIdsQuery } from '$lib/queries/contractQueries';
	import { createArtistsByIdsQuery } from '$lib/queries/artistQueries';
	import { createLabelTasksQuery, createTasksByType } from '$lib/queries/taskQueries';
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
	import RosterSubNaviationBar from '$lib/components/navigation/RosterSubNaviationBar.svelte';
	import PageContentWithScroll from '$lib/components/PageContentWithScroll.svelte';

	type ViewMode = 'roster' | 'contracts';
	const viewOptions: { key: ViewMode; label: string; path?: string }[] = [
		{ key: 'roster', label: 'Roster', path: '/labels/roster' },
		{ key: 'contracts', label: 'Contracts', path: '/labels/contracts' }
	];

	const viewDescriptions: Record<ViewMode, string> = {
		roster: 'Signed artists with active contracts; progress shows their current tasks.',
		contracts:
			'A list of all your contracts, including unsigned ones; use this to track potential signings and scouting targets.'
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

	// Active dataset based on selected view
	$: rosterArtists = $rosterArtistsQuery.data ?? [];

	// Split by role
	const isRapper = (artist: Artist) => 'songWritingSkills' in artist;
	const isBeatmaker = (artist: Artist) => 'beatmakingSkills' in artist;
	$: rappers = rosterArtists.filter(isRapper);
	$: beatmakers = rosterArtists.filter(isBeatmaker);

	// Loading/error helpers
	$: isRosterLoading =
		$tasksQuery.isLoading || $contractsQuery.isLoading || $rosterArtistsQuery.isLoading;
	$: activeLoading = isRosterLoading;

	$: activeError = $tasksQuery.error || $contractsQuery.error || $rosterArtistsQuery.error;

	function getErrorMessage(err: unknown): string {
		if (!err) return '';
		return err instanceof Error ? err.message : String(err);
	}
</script>

<!-- Page content -->
<PageContentWithScroll>
	<div>
		<div class="mb-10 flex select-none flex-wrap items-start justify-between gap-4">
			<div>
				<h1 class="text-7xl font-thin uppercase leading-none">Roster</h1>
				<p class="text-sm text-gray-300">Your label's roster of artists.</p>
			</div>
			<RosterSubNaviationBar />
		</div>

		{#if activeLoading}
			<p class="text-gray-300">Loading artists...</p>
		{:else if activeError}
			<p class="text-red-400">Error loading artists: {getErrorMessage(activeError)}</p>
		{:else if rosterArtists.length === 0}
			<p class="text-gray-300">No artists to display for this view yet.</p>
		{:else}
			<div class="grid gap-6 lg:grid-cols-2">
				<div class="space-y-4">
					<h2 class="select-none text-2xl font-thin uppercase text-white">Rappers</h2>
					{#if rappers.length === 0}
						<p class="text-gray-400">No rappers available.</p>
					{:else}
						{#each rappers as artist (artist.id)}
							<ArtistCard {artist} />
						{/each}
					{/if}
				</div>

				<div class="space-y-4">
					<h2 class="select-none text-2xl font-thin uppercase text-white">Beatmakers</h2>
					{#if beatmakers.length === 0}
						<p class="text-gray-400">No beatmakers available.</p>
					{:else}
						{#each beatmakers as artist (artist.id)}
							<ArtistCard {artist} />
						{/each}
					{/if}
				</div>
			</div>
		{/if}
	</div>
</PageContentWithScroll>
