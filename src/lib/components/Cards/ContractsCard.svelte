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
	import Tooltip from '../Tooltip.svelte';
	import EllipsedTextWithQuote from '../EllipsedTextWithQuote.svelte';

	export let contractsTaskResponse: SigningContractTaskResponse[] = [];
	export let currentTime: number = Date.now();

	let artistsLoading = false;

	type ContractTaskGroup = {
		contractId: string;
		contract?: Contract;
		task: SigningContractTaskResponse;
	};

	let contractTaskGroups: ContractTaskGroup[] = [];

	function getArtistById(artistId: string | null): Artist | undefined {
		if (!artistId) return undefined;
		return $discoveredArtists.find((item) => item.artist.id === artistId)?.artist;
	}

	function formatReleases(numberOfReleases?: Record<string, number | null> | null): string {
		if (!numberOfReleases) return '—';
		const entries = Object.entries(numberOfReleases).filter(([, value]) => value !== null);
		if (entries.length === 0) return '—';
		return entries.map(([key, value]) => `${key}: ${value ?? 0}`).join(', ');
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
			<div
				class="bg-black grid grid-cols-[60px,190px,1fr,1fr,5fr] border-t border-gray-700 px-4 py-1 text-sm gap-4 items-center"
			>
				{#if contract && artist}
					<div class="font-stretch-condensed text-right">{artist.stageName}</div>
					<div class="">
						<ProgressBar
							value={getProgressPercent(
								task.startTime,
								task.endTime,
								$serverTimeOffset,
								currentTime
							)}
							lengthClass="w-full"
							thicknessClass="h-[3px]"
							useGradient={true}
							gradientFromClass="from-indigo-500"
							gradientToClass="to-pink-500"
							backgroundClass="bg-gray-700"
							ariaLabel={`Contract negotiation with ${artist.stageName} progress`}
						/>
					</div>
					<div class="font-thin">
						{formatTimeRemaining(task.endTime, currentTime, $serverTimeOffset)}
					</div>
					<div class="flex">
						{#each contract.iterations ?? [] as contractIteration}
							<Tooltip position="bottom">
								<div slot="trigger" class="size-4 flex items-center justify-center">
									<span
										class="w-2 h-2 block rounded-full"
										class:bg-green-500={contractIteration.response?.accepted}
										class:bg-red-500={contractIteration.response?.accepted === false}
										class:bg-gray-600={!contractIteration.response}
										title={contractIteration.iterationNumber
											? `Iteration ${contractIteration.iterationNumber}`
											: 'Pending'}
									/>
								</div>
								<div
									class="text-xs text-gray-400 italic flex flex-col items-stretch gap-1 min-w-0 w-full max-w-[240px]"
								>
									<div class="flex text-white justify-between gap-2 w-full mb-1">
										<span class="font-semibold"
											>Iteration {contractIteration.iterationNumber ?? '—'}</span
										>
										{#if contractIteration.response}
											<span
												class="text-green-400"
												class:text-red-400={!contractIteration.response.accepted}
												>{contractIteration.response.accepted ? 'Accepted' : 'Rejected'}</span
											>
										{:else}
											<span class="text-gray-400">Awaiting response</span>
										{/if}
									</div>

									{#if contractIteration.offert}
										<div class="flex flex-col gap-0.5 w-full min-w-0">
											<div class="flex justify-between gap-2">
												<span>Signing bonus</span><span
													>{contractIteration.offert.signingBonus}</span
												>
											</div>
											<div class="flex justify-between gap-2">
												<span>Royalty</span><span
													>{contractIteration.offert.royaltyPercentage}%</span
												>
											</div>
											<div class="flex justify-between gap-2">
												<span>Advance</span><span>{contractIteration.offert.advance}</span>
											</div>
											{#if contractIteration.offert.numberOfReleases}
												<div class="flex justify-between gap-2 w-full min-w-0">
													<span>Releases</span>
													<span class="text-right truncate min-w-0"
														>{formatReleases(contractIteration.offert.numberOfReleases)}</span
													>
												</div>
											{/if}
										</div>
									{:else}
										<div class="text-gray-400">No offer terms</div>
									{/if}

									{#if contractIteration.response?.message}
										<div class="w-full min-w-0">
											<EllipsedTextWithQuote
												>{contractIteration.response.message}</EllipsedTextWithQuote
											>
										</div>
									{/if}
								</div>
							</Tooltip>
						{/each}
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
