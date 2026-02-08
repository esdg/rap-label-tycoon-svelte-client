<script lang="ts">
	import { goto } from '$app/navigation';
	import BeatmakerIcon from '$lib/icons/BeatmakerIcon.svelte';
	import RapperIcon from '$lib/icons/RapperIcon.svelte';
	import type { Artist } from '$lib/types/nonPlayingCharacter';
	import type { ProducingBeatsTaskResponse, RecordingReleaseTaskResponse } from '$lib/types/task';
	import { getRarityClass, getRarityLabel, getTaskProgress, getTaskStatus } from '$lib/utils';
	import { formatTimeRemaining } from '$lib/utils/timeUtils';
	import Chip from '../Chip.svelte';
	import ProgressBar from '../progress-bars/ProgressBar.svelte';

	export let artist: Artist;
	export let beatProductionTask: ProducingBeatsTaskResponse | null = null;
	export let recordingReleaseTask: RecordingReleaseTaskResponse | null = null;
	export let currentTime: number = Date.now();
	export let serverTimeOffset: number = 0;

	function handleClick() {
		goto(`/artists/${artist.id}`);
	}

	$: beatTaskState = beatProductionTask
		? getTaskStatus(beatProductionTask, serverTimeOffset)
		: null;
	$: beatTimeRemaining = beatProductionTask
		? formatTimeRemaining(beatProductionTask.endTime, currentTime, serverTimeOffset)
		: '';
	$: beatProgress = beatProductionTask ? getTaskProgress(beatProductionTask, serverTimeOffset) : 0;
	$: numberOfBeats = beatProductionTask?.numberOfBeats || 1;

	$: recordingTaskState = recordingReleaseTask
		? getTaskStatus(recordingReleaseTask, serverTimeOffset)
		: null;
	$: recordingTimeRemaining = recordingReleaseTask
		? formatTimeRemaining(recordingReleaseTask.endTime, currentTime, serverTimeOffset)
		: '';
	$: recordingProgress = recordingReleaseTask
		? getTaskProgress(recordingReleaseTask, serverTimeOffset)
		: 0;
	$: numberOfTracks = recordingReleaseTask?.beatIds?.length || 1;
</script>

<button
	class="flex w-full cursor-pointer select-none flex-col overflow-hidden rounded-lg border border-gray-700 bg-primary-950 text-left transition-colors duration-200 hover:border-secondary-500 hover:ring-1 hover:ring-secondary-500"
	on:click={handleClick}
	type="button"
>
	<div class="flex h-40">
		<div class="relative h-full w-28 flex-shrink-0">
			<img
				src={artist.profileImage ??
					`/artists/profiles/default/artist-default-${artist.sex === 'Male' ? 'm' : 'f'}-1.png`}
				alt={artist.stageName}
				class="h-full w-full object-cover"
			/>
			<div class="absolute inset-0 bg-gradient-to-r from-transparent to-primary-950"></div>
		</div>
		<div class="flex flex-1 flex-col py-4 pr-4">
			<h2 class="text-3xl font-black uppercase leading-none">
				{artist.stageName}
				{#if artist.$type === 'rapper'}
					<RapperIcon class="relative bottom-2 top-auto inline-block size-4" />
				{:else if artist.$type === 'beatmaker'}
					<BeatmakerIcon class="relative bottom-2 top-auto inline-block size-4" />
				{/if}
				<Chip
					class={getRarityClass(artist.rarity) + ' relative bottom-2 top-auto ml-2 inline-block'}
					>{getRarityLabel(artist.rarity)}</Chip
				>
			</h2>
			<p class="text-2xl font-thin uppercase">{artist.lastName} {artist.firstName}</p>

			<!-- Beat Production Task Progress -->
			{#if beatProductionTask}
				<div class="mt-3 space-y-1 rounded-md border border-gray-700 bg-gray-800/50 p-2">
					<div class="flex items-center justify-between text-xs">
						<span class="text-gray-400"
							>Producing {numberOfBeats} beat{numberOfBeats !== 1 ? 's' : ''}</span
						>
						{#if beatTaskState === 'in-progress'}
							<span class="font-medium text-amber-400">{beatTimeRemaining}</span>
						{:else if beatTaskState === 'succeeded'}
							<span class="font-medium text-success-500">Complete</span>
						{:else if beatTaskState === 'failed'}
							<span class="font-medium text-error-500">Failed</span>
						{/if}
					</div>
					<ProgressBar
						value={beatProgress}
						lengthClass="w-full"
						thicknessClass="h-1"
						useGradient={beatTaskState === 'in-progress'}
						gradientFromClass="from-amber-500"
						gradientToClass="to-red-500"
						progressClass={beatTaskState === 'succeeded'
							? 'bg-success-500'
							: beatTaskState === 'failed'
								? 'bg-error-500'
								: 'bg-amber-500'}
						backgroundClass="bg-gray-800"
						ariaLabel="Beat production progress"
					/>
				</div>
			{/if}

			<!-- Recording Release Task Progress -->
			{#if recordingReleaseTask}
				<div class="mt-3 space-y-1 rounded-md border border-gray-700 bg-gray-800/50 p-2">
					<div class="flex items-center justify-between text-xs">
						<span class="text-gray-400"
							>Recording {numberOfTracks} track{numberOfTracks !== 1 ? 's' : ''}</span
						>
						{#if recordingTaskState === 'in-progress'}
							<span class="font-medium text-purple-400">{recordingTimeRemaining}</span>
						{:else if recordingTaskState === 'succeeded'}
							<span class="font-medium text-success-500">Complete</span>
						{:else if recordingTaskState === 'failed'}
							<span class="font-medium text-error-500">Failed</span>
						{/if}
					</div>
					<ProgressBar
						value={recordingProgress}
						lengthClass="w-full"
						thicknessClass="h-1"
						useGradient={recordingTaskState === 'in-progress'}
						gradientFromClass="from-purple-500"
						gradientToClass="to-pink-500"
						progressClass={recordingTaskState === 'succeeded'
							? 'bg-success-500'
							: recordingTaskState === 'failed'
								? 'bg-error-500'
								: 'bg-purple-500'}
						backgroundClass="bg-gray-800"
						ariaLabel="Recording release progress"
					/>
				</div>
			{/if}
		</div>
	</div>
</button>
