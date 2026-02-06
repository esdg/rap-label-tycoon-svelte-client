<script lang="ts">
	import { createArtistByIdQuery } from '$lib/queries/artistQueries';
	import ArtistDetails from '$lib/components/ArtistDetails.svelte';
	import Button from '$lib/components/Button.svelte';
	import { goto } from '$app/navigation';
	import Hero from '$lib/components/Hero.svelte';
	import RecordIcon from '$lib/icons/RecordIcon.svelte';
	import WorldIcon from '$lib/icons/WorldIcon.svelte';
	import SoundWaveIcon from '$lib/icons/SoundWaveIcon.svelte';

	// Get data from load function
	export let data: { artistId: string };

	// Reactive query based on the slug parameter (artist ID)
	$: artistQuery = createArtistByIdQuery(data?.artistId ?? '');
</script>

<div class="h-screen bg-gray-900 text-white overflow-hidden">
	<div class="">
		<!-- Loading State -->
		{#if $artistQuery.isLoading}
			<div class="flex justify-center items-center min-h-[400px]">
				<div class="text-center">
					<div
						class="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary-500 border-r-transparent"
					></div>
					<p class="mt-4 text-gray-400">Loading artist...</p>
				</div>
			</div>

			<!-- Error State -->
		{:else if $artistQuery.error}
			<div class="flex justify-center items-center min-h-[400px]">
				<div class="text-center max-w-md">
					<div class="text-red-500 text-5xl mb-4">⚠️</div>
					<h2 class="text-2xl font-bold mb-2">Error Loading Artist</h2>
					<p class="text-gray-400 mb-6">{$artistQuery.error.message}</p>
					<Button on:clicked={() => goto('/labels')}>Back to Labels</Button>
				</div>
			</div>

			<!-- Success State -->
		{:else if $artistQuery.data}
			<div class="flex md:flex-row flex-col-reverse h-full">
				<Hero
					image={$artistQuery.data.profileImage ??
						`/artists/profiles/default/artist-default-${$artistQuery.data.sex === 0 ? 'm' : 'f'}-1.png`}
				/>
				<div class="md:basis-3/5 h-screen overflow-y-auto">
					<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 overflow-y-auto">
						<div class="mb-6 flex gap-2 justify-end">
							<button
								class="flex items-center flex-col gap-1 bg-[#080B12] size-28 border border-gray-600 rounded-md p-2 hover:border-secondary-500 transition-colors duration-200 hover:ring-secondary-500 hover:ring-1 select-none"
							>
								<RecordIcon />
								<div class="text-xs uppercase">Produce<br />Record</div>
							</button>
							<button
								class="flex items-center flex-col gap-1 bg-[#080B12] size-28 border border-gray-600 rounded-md p-2 hover:border-secondary-500 transition-colors duration-200 hover:ring-secondary-500 hover:ring-1 select-none"
							>
								<WorldIcon />
								<div class="text-xs uppercase">Send Artist<br />On Tour</div>
							</button>
							<button
								class="flex items-center flex-col gap-1 bg-[#080B12] size-28 border border-gray-600 rounded-md p-2 hover:border-secondary-500 transition-colors duration-200 hover:ring-secondary-500 hover:ring-1 select-none"
							>
								<SoundWaveIcon />
								<div class="text-xs uppercase">Produce<br />Beat(s)</div>
							</button>
						</div>
						<ArtistDetails class="-mt-24" artist={$artistQuery.data} />
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
