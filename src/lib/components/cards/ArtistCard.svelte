<script lang="ts">
	import { goto } from '$app/navigation';
	import BeatmakerIcon from '$lib/icons/BeatmakerIcon.svelte';
	import RapperIcon from '$lib/icons/RapperIcon.svelte';
	import type { Artist } from '$lib/types/nonPlayingCharacter';
	import type { ProducingBeatsTaskResponse, RecordingReleaseTaskResponse } from '$lib/types/task';
	import { getRarityClass, getRarityLabel } from '$lib/utils';
	import { BoltIcon, FaceSmileIcon, StarIcon } from 'heroicons-svelte/24/solid';
	import ArtistActivityPanel from '../ArtistActivityPanel.svelte';
	import Chip from '../Chip.svelte';
	import ProgressBar from '../progress-bars/ProgressBar.svelte';
	import WatchlistButton from '../WatchlistButton.svelte';

	export let artist: Artist;
	export let beatProductionTask: ProducingBeatsTaskResponse | null = null;
	export let recordingReleaseTask: RecordingReleaseTaskResponse | null = null;
	export let currentTime: number = Date.now();
	export let serverTimeOffset: number = 0;

	function handleClick() {
		goto(`/artists/${artist.id}`);
	}
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
		<div class="relative flex flex-1 flex-col justify-between gap-2 py-4 pr-4">
			<WatchlistButton {artist} class="absolute right-2 top-2" />
			<div class="flex flex-1 justify-between">
				<div>
					<h2 class="flex flex-nowrap items-center gap-2 text-3xl uppercase leading-none">
						<span class="whitespace-nowrap break-keep font-black">{artist.stageName}</span>
						{#if artist.$type === 'rapper'}
							<RapperIcon class=" inline-block size-4 self-start" />
						{:else if artist.$type === 'beatmaker'}
							<BeatmakerIcon class="inline-block size-4 self-start" />
						{/if}
						<Chip class={getRarityClass(artist.rarity) + '  ml-2 '}
							>{getRarityLabel(artist.rarity)}</Chip
						>
					</h2>
					<p class="whitespace-nowrap break-keep text-2xl font-thin uppercase">
						{artist.lastName}
						{artist.firstName}
					</p>
				</div>
				<div class="vitality-infos flex w-24 flex-col gap-1 self-end">
					<div class="flex gap-2">
						<FaceSmileIcon class="h-3 w-3 flex-none text-secondary-500" /><ProgressBar
							thicknessClass="h-2"
							value={artist.vitalityStats.happinessPercent}
							useGradient={true}
							gradientFromClass="from-secondary-600"
							gradientToClass="to-secondary-400"
						/>
					</div>
					<div class="flex gap-2">
						<BoltIcon class="h-3 w-3 flex-none text-primary-500" /><ProgressBar
							thicknessClass="h-2"
							value={artist.vitalityStats.staminaPercent}
							useGradient={true}
							gradientFromClass="from-primary-600"
							gradientToClass="to-primary-400"
						/>
					</div>
				</div>
			</div>
			<ArtistActivityPanel
				{beatProductionTask}
				{recordingReleaseTask}
				{currentTime}
				{serverTimeOffset}
			/>
		</div>
	</div>
</button>
