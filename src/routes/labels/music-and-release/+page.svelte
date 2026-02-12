<script lang="ts">
	import { currentLabel } from '$lib/stores/appState';
	import { currentTime, serverAdjustedTime } from '$lib/stores/globalTime';
	import { loadClientConfig } from '$lib/services/config';
	import { createLabelBeatsQuery } from '$lib/queries/beatQueries';
	import { createLabelReleasesQuery, createLabelTracksQuery } from '$lib/queries/releaseQueries';
	import { createArtistsByIdsQuery } from '$lib/queries/artistQueries';
	import {
		createLabelTasksQuery,
		createPublishingReleaseTaskMutation,
		serverTimeOffset
	} from '$lib/queries/taskQueries';
	import { RapMusicStyleNames } from '$lib/types/musicStyles';
	import type { ReleaseType } from '$lib/types/config';
	import type { TimedTask } from '$lib/types/task';
	import { formatTimeRemaining } from '$lib/utils/timeUtils';
	import { isPublishingReleaseTask } from '$lib/utils/typeGuards';
	import Stepper from '$lib/components/Stepper.svelte';
	import ContentPanel from '$lib/components/ContentPanel.svelte';
	import ContentPanelItem from '$lib/components/ContentPanelItem.svelte';
	import Button from '$lib/components/Button.svelte';
	import { onMount } from 'svelte';
	import { TaskCreationError } from '$lib/api/tasks';
	import bgImage from '$lib/assets/main-bg-discography.png';
	import PageContentWithScroll from '$lib/components/PageContentWithScroll.svelte';

	// Tab management
	let activeTabIndex = 0;
	const tabLabels = ['Releases', 'Tracks', 'Beats'];

	function handleTabClick(event: CustomEvent<number>) {
		activeTabIndex = event.detail;
	}

	// Release types from config
	let releaseTypes: ReleaseType[] = [];

	// Note: Time tracking is now handled by global time store
	// Task claiming is handled globally by taskClaimingService

	onMount(async () => {
		try {
			const config = await loadClientConfig();
			releaseTypes = config.releaseTypes;
		} catch (err) {
			console.error('Failed to load config:', err);
		}
	});

	// Fetch data when label is available
	$: labelId = $currentLabel?.id ?? null;
	$: beatsQuery = createLabelBeatsQuery(labelId);
	$: releasesQuery = createLabelReleasesQuery(labelId);
	$: tracksQuery = createLabelTracksQuery(labelId);
	$: tasksQuery = createLabelTasksQuery(labelId);
	$: publishMutation = createPublishingReleaseTaskMutation(labelId ?? '');

	$: beats = $beatsQuery.data ?? [];
	$: releases = $releasesQuery.data ?? [];
	$: tracks = $tracksQuery.data ?? [];
	$: tasks = $tasksQuery.data ?? [];

	// Create a map of releaseId -> hasActiveTask for reactivity
	$: activePublishingTasks = new Set(
		tasks
			.filter(
				(task): task is import('$lib/types/task').PublishingReleaseTaskResponse =>
					isPublishingReleaseTask(task) && !task.claimedAt
			)
			.map((task) => task.releaseId)
	);

	// Create a map of releaseId -> task for getting task details (like endTime)
	$: publishingTaskMap = new Map<string, TimedTask>(
		tasks
			.filter(
				(task): task is import('$lib/types/task').PublishingReleaseTaskResponse =>
					isPublishingReleaseTask(task) && !task.claimedAt
			)
			.map((task) => [task.releaseId, task])
	);

	// Note: Task auto-claiming is now handled globally by taskClaimingService in +layout.svelte

	$: isLoadingBeats = $beatsQuery.isLoading;
	$: isLoadingReleases = $releasesQuery.isLoading;
	$: isLoadingTracks = $tracksQuery.isLoading;

	$: beatsError = $beatsQuery.error;
	$: releasesError = $releasesQuery.error;
	$: tracksError = $tracksQuery.error;

	// Get unique artist IDs from releases and tracks
	$: trackArtistIds = [...new Set(tracks.flatMap((t) => t.artistId))];

	// Query for artists
	$: artistsQuery = createArtistsByIdsQuery(trackArtistIds);
	$: artists = $artistsQuery.data ?? [];

	// Helper function to get release type name
	function getReleaseTypeName(releaseTypeId: string): string {
		const releaseType = releaseTypes.find((rt) => rt.id === releaseTypeId);
		return releaseType?.name ?? 'Unknown';
	}

	// Helper function to get artist names
	function getArtistNames(artistIds: string[]): string {
		return artistIds
			.map((id) => {
				const artist = artists.find((a) => a.id === id);
				return artist?.stageName ?? 'Unknown';
			})
			.join(', ');
	}

	// Helper function to format date
	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString();
	}

	// Helper function to format duration
	function formatDuration(seconds: number): string {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	}

	// Helper function to check if release is unpublished
	function isUnpublished(releaseDate: string | null): boolean {
		if (!releaseDate) return true; // null or empty date means unpublished
		const now = new Date();
		const release = new Date(releaseDate);
		return release > now;
	}

	// Check if a release has an active publishing task
	function hasActivePublishingTask(releaseId: string): boolean {
		return tasks.some(
			(task) => isPublishingReleaseTask(task) && task.releaseId === releaseId && !task.claimedAt
		);
	}

	// Publishing state tracking
	let publishingReleaseId: string | null = null;
	let publishError: string | null = null;

	async function handlePublish(releaseId: string) {
		if (!labelId) return;

		publishingReleaseId = releaseId;
		publishError = null;

		try {
			await $publishMutation.mutateAsync({
				labelId,
				releaseId
			});
		} catch (err) {
			if (err instanceof TaskCreationError) {
				publishError = err.message;
			} else {
				publishError = 'Failed to create publishing task';
			}
			console.error('Publishing task creation failed:', err);
		} finally {
			publishingReleaseId = null;
		}
	}
</script>

<PageContentWithScroll>
	<div class="mb-10 flex select-none flex-wrap items-start justify-between gap-4">
		<div>
			<h1 class="text-7xl font-thin uppercase leading-none">Music catalog</h1>
			<p class="text-sm text-gray-300">Manage your label's music releases and tracks.</p>
		</div>
	</div>

	<!-- Tabs -->
	<div class="mb-6">
		<Stepper
			stepLabels={tabLabels}
			activeStepIndex={activeTabIndex}
			on:stepClicked={handleTabClick}
			selectedButtonColor="#10b981"
			selectedTextColor="#10b981"
		/>
	</div>

	<!-- Tab Content -->
	<ContentPanel activeStepIndex={activeTabIndex} transition="fade" duration={200}>
		<!-- Releases Tab -->
		<ContentPanelItem>
			<div class="rounded-lg border border-primary-200 bg-primary-950 p-6">
				<h2 class="mb-4 text-xl font-semibold text-primary-100">Releases</h2>

				{#if isLoadingReleases}
					<p class="py-8 text-center text-primary-300">Loading releases...</p>
				{:else if releasesError}
					<p class="py-8 text-center text-red-400">
						Error loading releases: {releasesError.message}
					</p>
				{:else if releases.length === 0}
					<p class="py-8 text-center text-primary-300">No releases yet. Record some music!</p>
				{:else}
					<div>
						<!-- Error Message -->
						{#if publishError}
							<div class="mb-4 rounded border border-red-600 bg-red-900 px-4 py-3 text-red-200">
								{publishError}
							</div>
						{/if}

						<!-- Header -->
						<div
							class="grid grid-cols-[2fr_120px_120px_120px_80px_120px] gap-4 rounded-t border-b border-primary-300 bg-primary-900 px-4 py-3 text-xs uppercase text-primary-300"
						>
							<div>Title</div>
							<div class="text-center">Type</div>
							<div class="text-center">Release Date</div>
							<div class="text-center">Rating</div>
							<div class="text-center">Hype</div>
							<div class="text-center">Actions</div>
						</div>

						<!-- Releases List -->
						{#each releases as release (release.id)}
							<div
								class="grid grid-cols-[120px_2fr_120px_120px_120px_80px_120px] items-center gap-4 border-b border-primary-800 px-4 py-3 text-sm transition-colors hover:bg-primary-900"
							>
								<div>
									{#if release.albumCoverUrl}
										<img src={release.albumCoverUrl} alt="Cover" class="object-cover" />
									{/if}
								</div>
								<div class="truncate font-medium text-primary-100">{release.title}</div>
								<div class="text-center text-primary-200">
									{getReleaseTypeName(release.releaseTypeId)}
								</div>
								<div class="text-center text-primary-200">
									{formatDate(release.releaseDate)}
								</div>
								<div class="text-center text-primary-200">
									{release.rating.toFixed(1)}/10
								</div>
								<div class="text-center text-primary-200">
									{release.hype}
								</div>
								<div class="flex justify-center">
									{#if activePublishingTasks.has(release.id)}
										{@const task = publishingTaskMap.get(release.id)}
										<span class="rounded bg-yellow-600 px-2 py-1 text-xs text-white">
											Publishing... {task
												? formatTimeRemaining(task.endTime, $currentTime, $serverTimeOffset)
												: ''}
										</span>
									{:else if isUnpublished(release.releaseDate)}
										<Button
											color="primary"
											class="px-3 py-1 text-xs"
											loading={publishingReleaseId === release.id}
											disabled={publishingReleaseId !== null}
											on:clicked={() => handlePublish(release.id)}
										>
											Publish
										</Button>
									{:else}
										<span class="rounded bg-green-600 px-2 py-1 text-xs text-white">
											Published
										</span>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</ContentPanelItem>

		<!-- Tracks Tab -->
		<ContentPanelItem>
			<div class="rounded-lg border border-primary-200 bg-primary-950 p-6">
				<h2 class="mb-4 text-xl font-semibold text-primary-100">Tracks</h2>

				{#if isLoadingTracks}
					<p class="py-8 text-center text-primary-300">Loading tracks...</p>
				{:else if tracksError}
					<p class="py-8 text-center text-red-400">Error loading tracks: {tracksError.message}</p>
				{:else if tracks.length === 0}
					<p class="py-8 text-center text-primary-300">No tracks yet. Record some music!</p>
				{:else}
					<div>
						<!-- Header -->
						<div
							class="grid grid-cols-[2fr_1fr_100px_100px_80px_80px_100px] gap-4 rounded-t border-b border-primary-300 bg-primary-900 px-4 py-3 text-xs uppercase text-primary-300"
						>
							<div>Title</div>
							<div>Artist(s)</div>
							<div class="text-center">Duration</div>
							<div class="text-center">Genre</div>
							<div class="text-center">Rating</div>
							<div class="text-center">Hype</div>
							<div class="text-center">Streams</div>
						</div>

						<!-- Tracks List -->
						{#each tracks as track (track.id)}
							<div
								class="grid grid-cols-[2fr_1fr_100px_100px_80px_80px_100px] items-center gap-4 border-b border-primary-800 px-4 py-3 text-sm transition-colors hover:bg-primary-900"
							>
								<div class="truncate font-medium text-primary-100">{track.title}</div>
								<div class="truncate text-primary-200">
									{getArtistNames(track.artistId)}
								</div>
								<div class="text-center text-primary-200">
									{formatDuration(track.durationSeconds)}
								</div>
								<div class="text-center text-primary-200">
									{RapMusicStyleNames[track.productionStyle]}
								</div>
								<div class="text-center text-primary-200">
									{track.rating.toFixed(1)}/10
								</div>
								<div class="text-center text-primary-200">
									{track.hype}
								</div>
								<div class="text-center text-primary-200">
									{track.performanceStats.streams.toLocaleString()}
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</ContentPanelItem>

		<!-- Beats Tab -->
		<ContentPanelItem>
			<div class="rounded-lg border border-primary-200 bg-primary-950 p-6">
				<h2 class="mb-4 text-xl font-semibold text-primary-100">Beats</h2>

				{#if isLoadingBeats}
					<p class="py-8 text-center text-primary-300">Loading beats...</p>
				{:else if beatsError}
					<p class="py-8 text-center text-red-400">Error loading beats: {beatsError.message}</p>
				{:else if beats.length === 0}
					<p class="py-8 text-center text-primary-300">No beats owned by this label yet.</p>
				{:else}
					<div>
						<!-- Header -->
						<div
							class="grid grid-cols-[2fr_1fr_80px_80px_80px_120px_100px] gap-4 rounded-t border-b border-primary-300 bg-primary-900 px-4 py-3 text-xs uppercase text-primary-300"
						>
							<div>Title</div>
							<div>Genre</div>
							<div class="text-center">BPM</div>
							<div class="text-center">Rating</div>
							<div class="text-center">Rarity</div>
							<div class="text-center">Type</div>
							<div class="text-center">Status</div>
						</div>

						<!-- Beats List -->
						{#each beats as beat (beat.id)}
							<div
								class="grid grid-cols-[2fr_1fr_80px_80px_80px_120px_100px] items-center gap-4 border-b border-primary-800 px-4 py-3 text-sm transition-colors hover:bg-primary-900"
							>
								<div class="truncate font-medium text-primary-100">{beat.title}</div>
								<div class="truncate text-primary-200">{beat.genre}</div>
								<div class="text-center text-primary-200">{beat.bpm}</div>
								<div class="text-center text-primary-200">{beat.rating.toFixed(1)}/10</div>
								<div class="text-center text-primary-200">{beat.rarity}</div>
								<div class="flex justify-center">
									{#if beat.isExclusive}
										<span class="rounded bg-secondary-500 px-2 py-1 text-xs text-primary-950">
											Exclusive
										</span>
									{:else}
										<span class="rounded bg-primary-700 px-2 py-1 text-xs text-primary-200">
											Non-Exclusive
										</span>
									{/if}
								</div>
								<div class="flex justify-center">
									{#if beat.isSold}
										<span class="rounded bg-red-600 px-2 py-1 text-xs text-white">Sold</span>
									{:else}
										<span class="rounded bg-green-600 px-2 py-1 text-xs text-white">
											Available
										</span>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</ContentPanelItem>
	</ContentPanel>
</PageContentWithScroll>
