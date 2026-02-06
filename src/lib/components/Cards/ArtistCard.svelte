<script lang="ts">
	import { goto } from '$app/navigation';
	import type { Artist } from '$lib/types/nonPlayingCharacter';
	import { getRarityClass, getRarityLabel } from '$lib/utils';
	import Chip from '../Chip.svelte';

	export let artist: Artist;

	function handleClick() {
		goto(`/artists/${artist.id}`);
	}
</script>

<button
	class="flex bg-primary-950 border border-gray-700 rounded-lg overflow-hidden h-40 hover:border-secondary-500 transition-colors duration-200 hover:ring-secondary-500 hover:ring-1 cursor-pointer select-none w-full text-left"
	on:click={handleClick}
	type="button"
>
	<div class="relative h-full w-28 flex-shrink-0">
		<img
			src={artist.profileImage ??
				`/artists/profiles/default/artist-default-${artist.sex === 0 ? 'm' : 'f'}-1.png`}
			alt={artist.stageName}
			class="h-full w-full object-cover"
		/>
		<div class="absolute inset-0 bg-gradient-to-r from-transparent to-primary-950"></div>
	</div>
	<div class="py-4">
		<h2 class="font-black text-3xl uppercase leading-none">
			{artist.stageName}<Chip class={getRarityClass(artist.rarity) + ' inline-block ml-2'}
				>{getRarityLabel(artist.rarity)}</Chip
			>
		</h2>
		<p class="font-thin text-2xl uppercase">{artist.lastName} {artist.firstName}</p>
	</div>
</button>
