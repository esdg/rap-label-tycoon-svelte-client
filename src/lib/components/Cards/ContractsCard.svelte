<script lang="ts">
	import { onMount } from 'svelte';
	import type { SigningContractResults } from '$lib/types/SigningContractTask';
	import type { TaskResponse } from '$lib/types/task';
	import type { Contract } from '$lib/types/contracts';
	import type { Artist } from '$lib/types/nonPlayingCharacter';
	import { contracts } from '$lib/stores/contracts';
	import { discoveredArtists, addMultipleDiscoveredArtists } from '$lib/stores/artists';
	import { getArtistsByIds } from '$lib/api';

	export let contractsTaskResponse: TaskResponse[] = [];

	let artistsLoading = false;

	function getContractId(task: TaskResponse): string | null {
		const results = task.results as SigningContractResults | null;
		return results?.contractId ?? null;
	}

	function getContractByTask(task: TaskResponse): Contract | undefined {
		const contractId = getContractId(task);
		if (!contractId) return undefined;
		return $contracts.find((contract) => contract.id === contractId);
	}

	function getArtistById(artistId: string | null): Artist | undefined {
		if (!artistId) return undefined;
		return $discoveredArtists.find((item) => item.artist.id === artistId)?.artist;
	}

	async function fetchArtistsForContracts() {
		if (artistsLoading) return;
		artistsLoading = true;

		try {
			const artistIds: string[] = [];
			for (const task of contractsTaskResponse) {
				const contract = getContractByTask(task);
				if (contract?.artistId && !getArtistById(contract.artistId)) {
					artistIds.push(contract.artistId);
				}
			}

			if (artistIds.length > 0) {
				const artists = await getArtistsByIds(artistIds);
				addMultipleDiscoveredArtists(artists, false);
			}
		} catch (err) {
			console.error('Failed to fetch artists for contracts:', err);
		} finally {
			artistsLoading = false;
		}
	}

	onMount(() => {
		fetchArtistsForContracts();
	});

	$: if (contractsTaskResponse.length > 0 && $contracts.length > 0 && !artistsLoading) {
		fetchArtistsForContracts();
	}
</script>

<article>
	<div>Currently negotiating {contractsTaskResponse.length} contract(s)</div>
	<div>
		{#each contractsTaskResponse as contractTask}
			{@const contract = getContractByTask(contractTask)}
			{@const artist = contract ? getArtistById(contract.artistId) : undefined}
			<div class="border p-2 my-2">
				{#if contract}
					{#if artist}
						<div>{artist.stageName}</div>
					{:else if artistsLoading}
						<div>Loading artist...</div>
					{:else}
						<div>Artist ID: {contract.artistId}</div>
					{/if}
				{:else}
					<div>Contract not found</div>
				{/if}
			</div>
		{/each}
	</div>
</article>
