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

	type ContractTaskGroup = {
		contractId: string;
		contract?: Contract;
		task: SigningContractTaskResponse;
	};

	let contractTaskGroups: ContractTaskGroup[] = [];

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
			const artistIds = new Set<string>();
			for (const { contract } of contractTaskGroups) {
				if (contract?.artistId && !getArtistById(contract.artistId)) {
					artistIds.add(contract.artistId);
				}
			}

			if (artistIds.size > 0) {
				const artists = await getArtistsByIds(Array.from(artistIds));
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

	$: contractTaskGroups = (() => {
		const map = new Map<string, ContractTaskGroup>();
		const currentContracts = $contracts; // make store changes reactive here
		for (const task of contractsTaskResponse) {
			if (!task.contractId) continue;
			const contract = currentContracts.find((c) => c.id === task.contractId);
			const contractId = contract?.id ?? task.contractId;

			const existing = map.get(contractId);
			const isNewer =
				!existing || new Date(task.endTime).getTime() > new Date(existing.task.endTime).getTime();
			if (isNewer) {
				map.set(contractId, { contractId, contract, task });
			}
		}
		return Array.from(map.values());
	})();

	$: if (contractTaskGroups.length > 0 && !artistsLoading) {
		fetchArtistsForContracts();
	}
</script>

<article class="bg-primary-950 border border-gray-700 rounded-lg overflow-hidden">
	<div class="px-4 py-2">Currently negotiating {contractTaskGroups.length} contract(s)</div>
	<div>
		{#each contractTaskGroups as { contractId, contract, task }}
			{@const artist = contract ? getArtistById(contract.artistId) : undefined}
			{@const lastResponseMessage =
				contract?.iterations?.[contract.iterations.length - 2]?.response?.message}
			<div
				class="bg-black grid grid-cols-[60px,190px,1fr,1fr,5fr] border-t border-gray-700 px-4 py-1 text-sm gap-4 items-center"
			>
				{#if contract && artist}
					<div class="font-stretch-condensed text-right">{artist.stageName}</div>
					<div class="">
						<ProgressBar
							value={getProgressPercent(task.startTime, task.endTime)}
							lengthClass="w-full"
							thicknessClass="h-[3px]"
							useGradient={true}
							gradientFromClass="from-indigo-500"
							gradientToClass="to-pink-500"
							backgroundClass="bg-black"
							ariaLabel={`Contract negotiation with ${artist.stageName} progress`}
						/>
					</div>
					<div class="font-thin">
						{formatTimeRemaining(task.endTime, Date.now(), $serverTimeOffset)}
					</div>
					<div class="flex gap-1">
						{#each contract.iterations ?? [] as contractIteration}
							<span
								class="w-2 h-2 rounded-full"
								class:bg-green-500={contractIteration.response?.accepted}
								class:bg-red-500={contractIteration.response?.accepted === false}
								class:bg-gray-600={!contractIteration.response}
								title={contractIteration.iterationNumber
									? `Iteration ${contractIteration.iterationNumber}`
									: 'Pending'}
							/>
						{/each}
					</div>
					<div
						class="text-xs text-primary-600 italic flex items-center gap-1 min-w-0"
						title={lastResponseMessage}
					>
						{#if lastResponseMessage}
							<span aria-hidden="true">"</span>
							<span class="truncate min-w-0">{lastResponseMessage}</span>
							<span aria-hidden="true">"</span>
						{:else}
							—
						{/if}
					</div>
				{:else if contract && artistsLoading}
					<div>Loading artist...</div>
				{:else}
					<div>Contract {contractId}</div>
				{/if}
			</div>
		{/each}
	</div>
</article>
