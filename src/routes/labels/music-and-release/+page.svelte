<script lang="ts">
	import { currentLabel } from '$lib/stores/appState';
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
	import { TaskType, TaskStatus } from '$lib/types/task';
	import type { TimedTask } from '$lib/types/task';
	import { formatTimeRemaining } from '$lib/utils/timeUtils';
	import Stepper from '$lib/components/Stepper.svelte';
	import ContentPanel from '$lib/components/ContentPanel.svelte';
	import ContentPanelItem from '$lib/components/ContentPanelItem.svelte';
	import Button from '$lib/components/Button.svelte';
	import { onMount, onDestroy } from 'svelte';
	import { TaskCreationError, claimTask } from '$lib/api/tasks';
	import { queryClient, queryKeys } from '$lib/queries/queryClient';
	import { isTaskFinished } from '$lib/utils/taskUtils';

	// Tab management
	let activeTabIndex = 0;
	const tabLabels = ['Releases', 'Tracks', 'Beats'];

	function handleTabClick(event: CustomEvent<number>) {
		activeTabIndex = event.detail;
	}

	// Release types from config
	let releaseTypes: ReleaseType[] = [];

	// Timer for updating remaining time
	let currentTime = Date.now();
	let timerInterval: ReturnType<typeof setInterval>;

	onMount(async () => {
		try {
			const config = await loadClientConfig();
			releaseTypes = config.releaseTypes;
		} catch (err) {
			console.error('Failed to load config:', err);
		}

		// Update timer every second
		timerInterval = setInterval(() => {
			currentTime = Date.now();
		}, 1000);
	});

	onDestroy(() => {
		if (timerInterval) {
			clearInterval(timerInterval);
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
				(task) =>
					task.taskType === TaskType.PublishingRelease && 'releaseId' in task && !task.claimedAt
			)
			.map((task) => (task as any).releaseId)
	);

	// Create a map of releaseId -> task for getting task details (like endTime)
	$: publishingTaskMap = new Map<string, TimedTask>(
		tasks
			.filter(
				(task) =>
					task.taskType === TaskType.PublishingRelease && 'releaseId' in task && !task.claimedAt
			)
			.map((task) => [(task as any).releaseId, task])
	);

	// Auto-claim finished publishing tasks
	let claimingTaskIds = new Set<string>();

	$: if (tasks.length > 0 && labelId && currentTime) {
		autoClaimFinishedPublishingTasks(tasks, labelId);
	}

	async function autoClaimFinishedPublishingTasks(allTasks: TimedTask[], currentLabelId: string) {
		const finishedPublishing = allTasks.filter(
			(task) =>
				task.taskType === TaskType.PublishingRelease &&
				!task.claimedAt &&
				isTaskFinished(task, $serverTimeOffset) &&
				!claimingTaskIds.has(task.id)
		);

		if (finishedPublishing.length === 0) return;

		// Mark tasks as being claimed
		finishedPublishing.forEach((task) => claimingTaskIds.add(task.id));

		// Claim all finished tasks
		for (const task of finishedPublishing) {
			try {
				await claimTask(task.id);
			} catch (err) {
				console.error(`Failed to claim publishing task ${task.id}:`, err);
				claimingTaskIds.delete(task.id);
			}
		}

		// Invalidate queries to refresh data
		queryClient.invalidateQueries({ queryKey: queryKeys.tasks.byLabel(currentLabelId) });
		queryClient.invalidateQueries({ queryKey: queryKeys.releases.byLabel(currentLabelId) });
		queryClient.invalidateQueries({ queryKey: queryKeys.labels.byId(currentLabelId) });
	}

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
		console.log('Checking publishing task for release:', releaseId, 'Tasks count:', tasks.length);
		return tasks.some(
			(task) =>
				task.taskType === TaskType.PublishingRelease &&
				'releaseId' in task &&
				(task as any).releaseId === releaseId &&
				!task.claimedAt
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

<div class="music-and-release-page p-4 md:p-6 lg:p-8">
	<h1 class="text-3xl font-bold mb-6 text-primary-100">Music & Release</h1>

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
			<div class="bg-primary-950 border border-primary-200 rounded-lg p-6">
				<h2 class="text-xl font-semibold text-primary-100 mb-4">Releases</h2>

				{#if isLoadingReleases}
					<p class="text-primary-300 text-center py-8">Loading releases...</p>
				{:else if releasesError}
					<p class="text-red-400 text-center py-8">
						Error loading releases: {releasesError.message}
					</p>
				{:else if releases.length === 0}
					<p class="text-primary-300 text-center py-8">No releases yet. Record some music!</p>
				{:else}
					<div class="space-y-2">
						<!-- Error Message -->
						{#if publishError}
							<div class="bg-red-900 border border-red-600 text-red-200 px-4 py-3 rounded mb-4">
								{publishError}
							</div>
						{/if}

						<!-- Header -->
						<div
							class="grid grid-cols-[2fr_120px_120px_120px_80px_120px] gap-4 px-4 py-3 text-xs uppercase bg-primary-900 text-primary-300 border-b border-primary-300 rounded-t"
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
								class="grid grid-cols-[2fr_120px_120px_120px_80px_120px] gap-4 px-4 py-3 items-center border-b border-primary-800 hover:bg-primary-900 transition-colors text-sm"
							>
								<div class="font-medium text-primary-100 truncate">{release.title}</div>
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
										<span class="px-2 py-1 text-xs bg-yellow-600 text-white rounded">
											Publishing... {task
												? formatTimeRemaining(task.endTime, currentTime, $serverTimeOffset)
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
										<span class="px-2 py-1 text-xs bg-green-600 text-white rounded">
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
			<div class="bg-primary-950 border border-primary-200 rounded-lg p-6">
				<h2 class="text-xl font-semibold text-primary-100 mb-4">Tracks</h2>

				{#if isLoadingTracks}
					<p class="text-primary-300 text-center py-8">Loading tracks...</p>
				{:else if tracksError}
					<p class="text-red-400 text-center py-8">Error loading tracks: {tracksError.message}</p>
				{:else if tracks.length === 0}
					<p class="text-primary-300 text-center py-8">No tracks yet. Record some music!</p>
				{:else}
					<div class="space-y-2">
						<!-- Header -->
						<div
							class="grid grid-cols-[2fr_1fr_100px_100px_80px_80px_100px] gap-4 px-4 py-3 text-xs uppercase bg-primary-900 text-primary-300 border-b border-primary-300 rounded-t"
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
								class="grid grid-cols-[2fr_1fr_100px_100px_80px_80px_100px] gap-4 px-4 py-3 items-center border-b border-primary-800 hover:bg-primary-900 transition-colors text-sm"
							>
								<div class="font-medium text-primary-100 truncate">{track.title}</div>
								<div class="text-primary-200 truncate">
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
			<div class="bg-primary-950 border border-primary-200 rounded-lg p-6">
				<h2 class="text-xl font-semibold text-primary-100 mb-4">Beats</h2>

				{#if isLoadingBeats}
					<p class="text-primary-300 text-center py-8">Loading beats...</p>
				{:else if beatsError}
					<p class="text-red-400 text-center py-8">Error loading beats: {beatsError.message}</p>
				{:else if beats.length === 0}
					<p class="text-primary-300 text-center py-8">No beats owned by this label yet.</p>
				{:else}
					<div class="space-y-2">
						<!-- Header -->
						<div
							class="grid grid-cols-[2fr_1fr_80px_80px_80px_120px_100px] gap-4 px-4 py-3 text-xs uppercase bg-primary-900 text-primary-300 border-b border-primary-300 rounded-t"
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
								class="grid grid-cols-[2fr_1fr_80px_80px_80px_120px_100px] gap-4 px-4 py-3 items-center border-b border-primary-800 hover:bg-primary-900 transition-colors text-sm"
							>
								<div class="font-medium text-primary-100 truncate">{beat.title}</div>
								<div class="text-primary-200 truncate">{beat.genre}</div>
								<div class="text-center text-primary-200">{beat.bpm}</div>
								<div class="text-center text-primary-200">{beat.rating.toFixed(1)}/10</div>
								<div class="text-center text-primary-200">{beat.rarity}</div>
								<div class="flex justify-center">
									{#if beat.isExclusive}
										<span class="px-2 py-1 text-xs bg-secondary-500 text-primary-950 rounded">
											Exclusive
										</span>
									{:else}
										<span class="px-2 py-1 text-xs bg-primary-700 text-primary-200 rounded">
											Non-Exclusive
										</span>
									{/if}
								</div>
								<div class="flex justify-center">
									{#if beat.isSold}
										<span class="px-2 py-1 text-xs bg-red-600 text-white rounded">Sold</span>
									{:else}
										<span class="px-2 py-1 text-xs bg-green-600 text-white rounded">
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
</div>
