<script lang="ts">
	import { goto } from '$app/navigation';
	import type { Artist } from '$lib/types/nonPlayingCharacter';
	import type { ProducingBeatsTaskResponse } from '$lib/types/task';
	import { getRarityClass, getRarityLabel, getTaskProgress, getTaskStatus } from '$lib/utils';
	import { formatTimeRemaining } from '$lib/utils/timeUtils';
	import Chip from '../Chip.svelte';
	import ProgressBar from '../progress-bars/ProgressBar.svelte';

	export let artist: Artist;
	export let beatProductionTask: ProducingBeatsTaskResponse | null = null;
	export let currentTime: number = Date.now();
	export let serverTimeOffset: number = 0;

	function handleClick() {
		goto(`/artists/${artist.id}`);
	}

	$: taskState = beatProductionTask ? getTaskStatus(beatProductionTask, serverTimeOffset) : null;
	$: timeRemaining = beatProductionTask
		? formatTimeRemaining(beatProductionTask.endTime, currentTime, serverTimeOffset)
		: '';
	$: progress = beatProductionTask ? getTaskProgress(beatProductionTask, serverTimeOffset) : 0;
	$: numberOfBeats = beatProductionTask?.results?.producedBeatsIds?.length || 1;
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
						{#if taskState === 'in-progress'}
							<span class="text-amber-400 font-medium">{timeRemaining}</span>
						{:else if taskState === 'succeeded'}
							<span class="text-success-500 font-medium">Complete</span>
						{:else if taskState === 'failed'}
							<span class="text-error-500 font-medium">Failed</span>
						{/if}
					</div>
					<ProgressBar
						value={progress}
						lengthClass="w-full"
						thicknessClass="h-2"
						useGradient={taskState === 'in-progress'}
						gradientFromClass="from-amber-500"
						gradientToClass="to-red-500"
						progressClass={taskState === 'succeeded'
							? 'bg-success-500'
							: taskState === 'failed'
								? 'bg-error-500'
								: 'bg-amber-500'}
						backgroundClass="bg-gray-800"
						ariaLabel="Beat production progress"
					/>
				</div>
			{/if}
		</div>
	</div>
</button>
