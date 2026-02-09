<script lang="ts">
	import { StarIcon } from 'heroicons-svelte/24/solid';
	import type { Artist } from '$lib/types/nonPlayingCharacter';
	import { currentLabelId } from '$lib/stores/appState';
	import {
		createLabelByIdQuery,
		createAddToWatchlistMutation,
		createRemoveFromWatchlistMutation
	} from '$lib/queries/labelQueries';

	let className = '';
	export { className as class };
	export let artist: Artist;

	const addToWatchlist = createAddToWatchlistMutation();
	const removeFromWatchlist = createRemoveFromWatchlistMutation();

	// Get label data from query cache for reactive updates
	$: labelQuery = createLabelByIdQuery($currentLabelId);
	$: currentLabel = $labelQuery.data;

	// Check if artist is in watchlist
	$: isWatchlisted = currentLabel?.artistsWatchlistIds.includes(artist.id) ?? false;
	$: isLoading = $addToWatchlist.isPending || $removeFromWatchlist.isPending;

	async function toggleWatchlist() {
		if (!currentLabel) return;

		if (isWatchlisted) {
			$removeFromWatchlist.mutate({
				labelId: currentLabel.id,
				artistId: artist.id
			});
		} else {
			$addToWatchlist.mutate({
				labelId: currentLabel.id,
				artistId: artist.id
			});
		}
	}
</script>

<button
	class={className}
	on:click|stopPropagation={toggleWatchlist}
	disabled={isLoading || !currentLabel}
	title={isWatchlisted ? 'Remove from watchlist' : 'Add to watchlist'}
>
	<StarIcon
		class="h-4 w-4 transition-colors {isWatchlisted
			? 'text-secondary-500'
			: 'text-gray-600'} {isLoading ? 'opacity-50' : ''}"
	/>
</button>
