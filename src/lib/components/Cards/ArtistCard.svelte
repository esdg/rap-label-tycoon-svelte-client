<script lang="ts">
	import { goto } from '$app/navigation';
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
	class="flex flex-col bg-primary-950 border border-gray-700 rounded-lg overflow-hidden hover:border-secondary-500 transition-colors duration-200 hover:ring-secondary-500 hover:ring-1 cursor-pointer select-none w-full text-left"
	on:click={handleClick}
	type="button"
>
	<div class="flex h-40">
		<div class="relative h-full w-28 flex-shrink-0">
			<img
				src={artist.profileImage ??
					`/artists/profiles/default/artist-default-${artist.sex === 0 ? 'm' : 'f'}-1.png`}
				alt={artist.stageName}
				class="h-full w-full object-cover"
			/>
			<div class="absolute inset-0 bg-gradient-to-r from-transparent to-primary-950"></div>
		</div>
		<div class="py-4 pr-4 flex-1 flex flex-col">
			<h2 class="font-black text-3xl uppercase leading-none">
				{artist.stageName}<Chip class={getRarityClass(artist.rarity) + ' inline-block ml-2'}
					>{getRarityLabel(artist.rarity)}</Chip
				>
			</h2>
			<p class="font-thin text-2xl uppercase">{artist.lastName} {artist.firstName}</p>

			<!-- Beat Production Task Progress -->
			{#if beatProductionTask}
				<div class="mt-3 space-y-1">
					<div class="flex items-center justify-between text-xs">
						<span class="text-gray-400"
							>Producing {numberOfBeats} beat{numberOfBeats !== 1 ? 's' : ''}</span
						>
						{#if beatTaskState === 'in-progress'}
							<span class="text-amber-400 font-medium">{beatTimeRemaining}</span>
						{:else if beatTaskState === 'succeeded'}
							<span class="text-success-500 font-medium">Complete</span>
						{:else if beatTaskState === 'failed'}
							<span class="text-error-500 font-medium">Failed</span>
						{/if}
					</div>
					<ProgressBar
						value={beatProgress}
						lengthClass="w-full"
						thicknessClass="h-2"
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
				<div class="mt-3 space-y-1">
					<div class="flex items-center justify-between text-xs">
						<span class="text-gray-400"
							>Recording {numberOfTracks} track{numberOfTracks !== 1 ? 's' : ''}</span
						>
						{#if recordingTaskState === 'in-progress'}
							<span class="text-purple-400 font-medium">{recordingTimeRemaining}</span>
						{:else if recordingTaskState === 'succeeded'}
							<span class="text-success-500 font-medium">Complete</span>
						{:else if recordingTaskState === 'failed'}
							<span class="text-error-500 font-medium">Failed</span>
						{/if}
					</div>
					<ProgressBar
						value={recordingProgress}
						lengthClass="w-full"
						thicknessClass="h-2"
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
