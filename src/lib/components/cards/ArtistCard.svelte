<script lang="ts">
	import { goto } from '$app/navigation';
	import BeatmakerIcon from '$lib/icons/BeatmakerIcon.svelte';
	import RapperIcon from '$lib/icons/RapperIcon.svelte';
	import type { Artist } from '$lib/types/nonPlayingCharacter';
	import type { ProducingBeatsTaskResponse, RecordingReleaseTaskResponse } from '$lib/types/task';
	import { getRarityClass, getRarityLabel } from '$lib/utils';
	import ArtistActivityPanel from '../ArtistActivityPanel.svelte';
	import Chip from '../Chip.svelte';

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
		<div class="flex flex-1 flex-col py-4 pr-4">
			<h2 class="text-3xl uppercase leading-none">
				<span class="font-black">{artist.stageName}</span>
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

			<ArtistActivityPanel
				{beatProductionTask}
				{recordingReleaseTask}
				{currentTime}
				{serverTimeOffset}
			/>
		</div>
	</div>
</button>
