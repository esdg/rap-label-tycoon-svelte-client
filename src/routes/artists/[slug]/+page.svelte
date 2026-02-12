<script lang="ts">
	import { createArtistByIdQuery } from '$lib/queries/artistQueries';
	import ArtistDetails from '$lib/components/ArtistDetails.svelte';
	import Button from '$lib/components/Button.svelte';
	import { goto } from '$app/navigation';
	import Hero from '$lib/components/Hero.svelte';
	import ArtistActionsPanel from '$lib/components/ArtistActionsPanel.svelte';

	// Get data from load function
	export let data: { artistId: string };

	// Reactive query based on the slug parameter (artist ID)
	$: artistQuery = createArtistByIdQuery(data?.artistId ?? '');
</script>

<div class="h-screen overflow-hidden bg-gray-900 text-white">
	<div class="">
		<!-- Loading State -->
		{#if $artistQuery.isLoading}
			<div class="flex min-h-[400px] items-center justify-center">
				<div class="text-center">
					<div
						class="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary-500 border-r-transparent"
					></div>
					<p class="mt-4 text-gray-400">Loading artist...</p>
				</div>
			</div>

			<!-- Error State -->
		{:else if $artistQuery.error}
			<div class="flex min-h-[400px] items-center justify-center">
				<div class="max-w-md text-center">
					<div class="mb-4 text-5xl text-red-500">⚠️</div>
					<h2 class="mb-2 text-2xl font-bold">Error Loading Artist</h2>
					<p class="mb-6 text-gray-400">{$artistQuery.error.message}</p>
					<Button on:clicked={() => goto('/labels')}>Back to Labels</Button>
				</div>
			</div>

			<!-- Success State -->
		{:else if $artistQuery.data}
			<div class="flex h-full flex-col-reverse md:flex-row">
				<Hero
					image={$artistQuery.data.profileImage ??
						`/artists/profiles/default/artist-default-${$artistQuery.data.sex === 'Male' ? 'm' : 'f'}-1.png`}
				/>
				<div class="h-screen overflow-y-auto md:basis-3/5">
					<div class="mx-auto max-w-7xl overflow-y-auto px-4 py-8 sm:px-6 lg:px-8">
						<ArtistActionsPanel artist={$artistQuery.data} />
						<ArtistDetails class="pointer-events-none -mt-24" artist={$artistQuery.data} />
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
