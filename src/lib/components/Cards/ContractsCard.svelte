<script lang="ts">
	import { onMount } from 'svelte';
	import type { SigningContractTaskResponse } from '$lib/types/task';
	import type { Contract } from '$lib/types/contracts';
	import type { Artist } from '$lib/types/nonPlayingCharacter';
	import { contracts } from '$lib/stores/contracts';
	import { discoveredArtists, addMultipleDiscoveredArtists } from '$lib/stores/artists';
	import { getArtistsByIds } from '$lib/api';
	import { serverTimeOffset } from '$lib/queries/taskQueries';
	import ProgressBar from '../progress-bars/ProgressBar.svelte';
	import { getProgressPercent, formatTimeRemaining } from '$lib/utils';

	export let contractsTaskResponse: SigningContractTaskResponse[] = [];

	let artistsLoading = false;

	function getContractByTask(task: SigningContractTaskResponse): Contract | undefined {
		// contractId is directly on the task object
		if (!task.contractId) return undefined;
		return $contracts.find((contract) => contract.id === task.contractId);
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
						<div>
							<ProgressBar
								value={getProgressPercent(contractTask.startTime, contractTask.endTime)}
								lengthClass="w-full"
								thicknessClass="h-1.5 lg:h-2"
								useGradient={true}
								gradientFromClass="from-indigo-500"
								gradientToClass="to-pink-500"
								backgroundClass="bg-black"
								ariaLabel={`Contract negotiation with ${artist.stageName} progress`}
							/>
						</div>
						<div>{formatTimeRemaining(contractTask.endTime, Date.now(), $serverTimeOffset)}</div>
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
