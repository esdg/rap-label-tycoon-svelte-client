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
	import { ArrowRightIcon } from 'heroicons-svelte/24/solid';
	import { ArrowPathIcon } from 'heroicons-svelte/24/outline';
	import { openScoutResultsModal, openSignContractModal } from '$lib/modals/helpers';

	export let contractsTaskResponse: SigningContractTaskResponse[] = [];
	export let contracts: Contract[] = [];
	export let currentTime: number = Date.now();

	type ContractTaskGroup = {
		contractId: string;
		contract?: Contract;
		task: SigningContractTaskResponse;
		isOptimistic?: boolean;
	};

	let contractTaskGroups: ContractTaskGroup[] = [];

	// Extract artist IDs from contracts AND optimistic tasks
	$: optimisticArtistIds = contractsTaskResponse
		.filter((t) => (t as any)._optimistic === true && (t as any)._requestData?.artistId)
		.map((t) => (t as any)._requestData.artistId as string);
	$: artistIds = [
		...new Set([
			...contracts
				.map((c) => c.artistId)
				.filter((id): id is string => typeof id === 'string' && id.length > 0),
			...optimisticArtistIds
		])
	];

	// Create query for artists
	$: artistsQuery = createArtistsByIdsQuery(artistIds);

	function getArtistById(artistId: string | null): Artist | undefined {
		if (!artistId || !$artistsQuery.data) return undefined;
		return $artistsQuery.data.find((artist) => artist.id === artistId);
	}

	function getOptimisticArtistId(task: SigningContractTaskResponse): string | null {
		return (task as any)?._requestData?.artistId ?? null;
	}

	function getOptimisticRequestData(task: SigningContractTaskResponse): any {
		return (task as any)?._requestData ?? null;
	}

	function formatReleases(numberOfReleases?: Record<string, number | null> | null): string {
		if (!numberOfReleases) return '—';
		const entries = Object.entries(numberOfReleases).filter(([, value]) => value !== null);
		if (entries.length === 0) return '—';
		return entries.map(([key, value]) => `${key}: ${value ?? 0}`).join(', ');
	}

	$: contractTaskGroups = (() => {
		const map = new Map<string, ContractTaskGroup>();
		const optimisticTasks: ContractTaskGroup[] = [];

		for (const task of contractsTaskResponse) {
			// Handle optimistic tasks separately (they have empty contractId)
			if ((task as any)._optimistic === true) {
				optimisticTasks.push({
					contractId: task.id, // Use temp id as key
					contract: undefined,
					task,
					isOptimistic: true
				});
				continue;
			}

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
		return [...Array.from(map.values()), ...optimisticTasks];
	})();
</script>

<article class="select-none overflow-hidden rounded-lg border border-gray-700 bg-primary-950">
	<div class="px-4 py-2">{contractTaskGroups.length} contract(s)</div>
	<div>
		{#each contractTaskGroups as { contractId, contract, task, isOptimistic }}
			{@const artist = isOptimistic
				? getArtistById(getOptimisticArtistId(task))
				: contract
					? getArtistById(contract.artistId)
					: undefined}
			{@const isFinished =
				!isOptimistic && task.results && new Date(task.endTime).getTime() < currentTime}
			{@const isFailed = isFinished && task.results && !task.results.success}
			{@const finishedClass = isFinished
				? 'hover:border hover:border-primary-500 cursor-pointer'
				: ''}
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<!-- svelte-ignore a11y-no-static-element-interactions -->

			{#if isOptimistic}
				{@const requestData = getOptimisticRequestData(task)}
				{@const estimatedCost = requestData?.costPrediction?.budgetRequired ?? null}
				{@const estimatedDuration = requestData?.costPrediction?.duration ?? ''}
				<div
					class="grid grid-cols-[95px,190px,1fr,1fr,5px] items-center gap-4 border-t border-gray-700 bg-black px-4 py-1 text-sm last:rounded-b-lg"
				>
					<div class="truncate text-right font-condensed font-light">
						{artist?.stageName ?? 'Artist'}
					</div>
					<div class="flex items-center gap-2">
						<ArrowPathIcon class="h-3 w-3 animate-spin text-indigo-400" />
						<span class="text-xs text-indigo-300">Negotiating...</span>
					</div>
					<div class="text-xs font-thin text-gray-500">
						{#if estimatedDuration}
							{formatDuration(estimatedDuration)}
						{/if}
					</div>
					<div class="text-xs text-gray-500">
						{#if estimatedCost !== null}
							{formatCurrency(estimatedCost)}
						{/if}
					</div>
					<div></div>
				</div>
			{:else if contract && artist}
				<div
					class="grid grid-cols-[95px,190px,1fr,1fr,5px] items-center gap-4 border-t border-gray-700 bg-black px-4 py-1 text-sm last:rounded-b-lg {finishedClass}"
					on:click={() => {
						if (isFinished) {
							openSignContractModal(artist);
						}
					}}
				>
					<div class="truncate text-right font-condensed font-light">
						{artist.stageName}
					</div>
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
							{@const hasResponse = !!contractIteration.response}
							{@const isAccepted = hasResponse && contractIteration.response?.accepted === true}
							{@const isRejected = hasResponse
								? contractIteration.response?.accepted === false
								: isFailed}
							<Tooltip position="bottom">
								<div slot="trigger" class="flex size-4 items-center justify-center">
									<span
										class="block h-2 w-2 rounded-full"
										class:bg-green-500={isAccepted}
										class:bg-red-500={isRejected}
										class:bg-gray-600={!hasResponse && !isFailed}
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
										{#if hasResponse}
											<span
												class="text-green-400"
												class:text-red-400={contractIteration.response?.accepted === false}
												>{contractIteration.response?.accepted ? 'Accepted' : 'Rejected'}</span
											>
										{:else if isFailed}
											<span class="text-red-400">Rejected</span>
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
					{#if task.results}
						<ArrowRightIcon class="inline h-4 w-4 text-[10px] text-primary-500 " />
					{/if}
				</div>
			{:else if contract && $artistsQuery.isLoading}
				<div class="col-span-5 text-gray-400">Loading artist...</div>
			{:else if contract}
				<div class="col-span-5 text-gray-400">Artist data unavailable</div>
			{:else}
				<div class="col-span-5 text-gray-400">Contract {contractId}</div>
			{/if}
		{/each}
	</div>
</article>
