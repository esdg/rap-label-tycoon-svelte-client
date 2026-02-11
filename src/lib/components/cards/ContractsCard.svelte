<script lang="ts">
	import type { SigningContractTaskResponse } from '$lib/types/task';
	import type { Contract } from '$lib/types/contracts';
	import type { Artist } from '$lib/types/nonPlayingCharacter';
	import { createArtistsByIdsQuery } from '$lib/queries/artistQueries';
	import { serverTimeOffset } from '$lib/queries/taskQueries';
	import ProgressBar from '../progress-bars/ProgressBar.svelte';
	import {
		getProgressPercent,
		formatTimeRemaining,
		formatDuration,
		formatCurrency
	} from '$lib/utils';
	import Tooltip from '../Tooltip.svelte';

	export let contractsTaskResponse: SigningContractTaskResponse[] = [];
	export let contracts: Contract[] = [];
	export let currentTime: number = Date.now();

	type ContractTaskGroup = {
		contractId: string;
		contract?: Contract;
		task: SigningContractTaskResponse;
	};

	let contractTaskGroups: ContractTaskGroup[] = [];

	// Extract artist IDs from contracts
	$: artistIds = contracts
		.map((c) => c.artistId)
		.filter((id): id is string => typeof id === 'string' && id.length > 0);

	// Create query for artists
	$: artistsQuery = createArtistsByIdsQuery(artistIds);

	function getArtistById(artistId: string | null): Artist | undefined {
		if (!artistId || !$artistsQuery.data) return undefined;
		return $artistsQuery.data.find((artist) => artist.id === artistId);
	}

	function formatReleases(numberOfReleases?: Record<string, number | null> | null): string {
		if (!numberOfReleases) return '—';
		const entries = Object.entries(numberOfReleases).filter(([, value]) => value !== null);
		if (entries.length === 0) return '—';
		return entries.map(([key, value]) => `${key}: ${value ?? 0}`).join(', ');
	}

	$: contractTaskGroups = (() => {
		const map = new Map<string, ContractTaskGroup>();
		for (const task of contractsTaskResponse) {
			if (!task.contractId) continue;
			const contract = contracts.find((c) => c.id === task.contractId);
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
</script>

<article class="select-none overflow-hidden rounded-lg border border-gray-700 bg-primary-950">
	<div class="px-4 py-2">Currently negotiating {contractTaskGroups.length} contract(s)</div>
	<div>
		{#each contractTaskGroups as { contractId, contract, task }}
			{@const artist = contract ? getArtistById(contract.artistId) : undefined}
			<div
				class="grid grid-cols-[60px,190px,1fr,1fr,5fr] items-center gap-4 border-t border-gray-700 bg-black px-4 py-1 text-sm"
			>
				{#if contract && artist}
					<div class="font-stretch-condensed text-right">{artist.stageName}</div>
					<div>
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
								<div slot="trigger" class="flex size-4 items-center justify-center">
									<span
										class="block h-2 w-2 rounded-full"
										class:bg-green-500={contractIteration.response?.accepted}
										class:bg-red-500={contractIteration.response?.accepted === false}
										class:bg-gray-600={!contractIteration.response}
										title={contractIteration.iterationNumber
											? `Iteration ${contractIteration.iterationNumber}`
											: 'Pending'}
									/>
								</div>
								<div
									class="flex w-full min-w-0 max-w-[240px] flex-col items-stretch gap-1 text-xs italic text-gray-400"
								>
									<div class="mb-1 flex w-full justify-between gap-2 text-white">
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
										{#if contractIteration.offert.contractDuration && contractIteration.offert.contractDuration !== '0'}
											<div class="flex w-full min-w-0 justify-between gap-2">
												<span>Releases</span>
												<span class="min-w-0 truncate text-right"
													>{formatDuration(contractIteration.offert.contractDuration)}</span
												>
											</div>
										{:else}
											<div class="flex w-full min-w-0 justify-between gap-2">
												<span>Releases</span>
												<span class="min-w-0 truncate text-right"
													>{formatReleases(contractIteration.offert.numberOfReleases)}</span
												>
											</div>
										{/if}
										<div class="flex w-full min-w-0 flex-col gap-0.5">
											<div class="flex justify-between gap-2">
												<span>Signing bonus</span><span
													>{formatCurrency(contractIteration.offert.signingBonus)}</span
												>
											</div>
											<div class="flex justify-between gap-2">
												<span>Royalty</span><span
													>{contractIteration.offert.royaltyPercentage}%</span
												>
											</div>
											<div class="flex justify-between gap-2">
												<span>Advance</span><span
													>{formatCurrency(contractIteration.offert.advance)}</span
												>
											</div>
										</div>
									{:else}
										<div class="text-gray-400">No offer terms</div>
									{/if}

									{#if contractIteration.response?.message}
										<div class="w-full min-w-0 text-xs italic text-primary-600">
											"{contractIteration.response.message}"
										</div>
									{/if}
								</div>
							</Tooltip>
						{/each}
					</div>
				{:else if contract && $artistsQuery.isLoading}
					<div class="col-span-5 text-gray-400">Loading artist...</div>
				{:else if contract}
					<div class="col-span-5 text-gray-400">Artist data unavailable</div>
				{:else}
					<div class="col-span-5 text-gray-400">Contract {contractId}</div>
				{/if}
			</div>
		{/each}
	</div>
</article>
