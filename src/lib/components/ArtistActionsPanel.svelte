<script lang="ts">
	import {
		openProducingBeatsModal,
		openRecordingReleaseModal,
		openRestingModal,
		openSignContractModal
	} from '$lib/modals/helpers';
	import type { Artist } from '$lib/types/nonPlayingCharacter';
	import { isBeatmaker, isRapper } from '$lib/utils';
	import { currentLabel } from '$lib/stores/appState';
	import { ContractStatus } from '$lib/types/contracts';
	import SignContractIcon from '$lib/icons/SignContractIcon.svelte';
	import { fetchContractsByArtistId } from '$lib/api/contracts';
	import { createQuery } from '@tanstack/svelte-query';
	import Tooltip from './Tooltip.svelte';
	import OnTourIcon from '$lib/assets/icons/on-tour-icon.png';
	import ProduceBeatsIcon from '$lib/assets/icons/produce-beats-icon.png';
	import ProduceRecordIcon from '$lib/assets/icons/produce-record-icon.png';
	import RestIcon from '$lib/assets/icons/rest-icon.png';
	import SingContractIcon from '$lib/assets/icons/sign-contract-icon.png';

	export let artist: Artist;
	let className = '';
	export { className as class };

	// Fetch all contracts for this artist (across all labels)
	$: artistContractsQuery = createQuery({
		queryKey: ['contracts', 'by-artist', artist.id],
		queryFn: () => fetchContractsByArtistId(artist.id),
		enabled: !!artist.id
	});

	$: labelId = $currentLabel?.id ?? null;
	$: allArtistContracts = $artistContractsQuery.data ?? [];

	// Check if artist has ANY active signed contract with ANY label (free agent check)
	$: artistHasAnyActiveContract = allArtistContracts.some((contract) => {
		// Must be signed
		if (contract.status !== ContractStatus.Signed) return false;
		// Must not have passed the end date
		if (!contract.endDate) return true;
		return new Date(contract.endDate).getTime() > Date.now();
	});

	// Check if artist has active contract specifically with CURRENT label
	$: artistHasActiveContractWithCurrentLabel = allArtistContracts.some((contract) => {
		// Must be with the CURRENT label
		if (contract.labelId !== labelId) return false;
		// Must be signed
		if (contract.status !== ContractStatus.Signed) return false;
		// Must not have passed the end date
		if (!contract.endDate) return true;
		return new Date(contract.endDate).getTime() > Date.now();
	});
</script>

<div class="mb-6 flex justify-end gap-2 {className}">
	<!-- Sign contract (only show if artist is a free agent - no contract with ANY label) -->

	<Tooltip position="bottom">
		<button
			disabled={artistHasAnyActiveContract}
			slot="trigger"
			on:click={() => openSignContractModal(artist)}
			class="group flex size-28 select-none flex-col items-center gap-1 rounded-md border border-gray-600 bg-[#080B12] p-2 transition-colors duration-200 hover:border-secondary-500 hover:ring-1 hover:ring-secondary-500 disabled:cursor-not-allowed disabled:border-gray-700 disabled:text-gray-500 disabled:hover:border-gray-700 disabled:hover:ring-0"
		>
			<img
				src={SingContractIcon}
				alt="Sign Contract Icon"
				class="h-[58px] w-[58px] group-disabled:opacity-30"
			/>
			<div class="text-xs uppercase">Sign contract<br />with artist</div>
		</button>
		<p class="font-bold text-white">✍️ Sign Contract</p>
		<p>
			{artistHasAnyActiveContract
				? 'Artist already has an active contract.'
				: 'Negotiate and secure a deal.'}
		</p>
		<p>
			{artistHasAnyActiveContract
				? 'Wait for the current contract to expire before signing a new one.'
				: 'Sign or renew a contract to officially bring the artist under your label.'}
		</p>
	</Tooltip>

	{#if artistHasActiveContractWithCurrentLabel}
		<!-- Send artist on rest button -->
		<Tooltip position="bottom">
			<button
				slot="trigger"
				on:click={() => openRestingModal({ workerId: artist.id })}
				class="group flex size-28 select-none flex-col items-center gap-1 rounded-md border border-gray-600 bg-[#080B12] p-2 transition-colors duration-200 hover:border-secondary-500 hover:ring-1 hover:ring-secondary-500 disabled:cursor-not-allowed disabled:border-gray-700 disabled:text-gray-500 disabled:hover:border-gray-700 disabled:hover:ring-0"
			>
				<img src={RestIcon} alt="Rest Icon" class="h-[58px] w-[58px] group-disabled:opacity-30" />
				<div class="text-xs uppercase">Send Artist<br />To Rest</div>
			</button>
			<p class="font-bold text-white">🛌 Resting</p>
			<p>Negotiate and secure a deal.</p>
			<p>Sign or renew a contract to officially bring the artist under your label.</p>
		</Tooltip>
		<!-- Send artist on tour button -->
		{#if isRapper(artist)}
			<Tooltip position="bottom">
				<button
					slot="trigger"
					class="group flex size-28 select-none flex-col items-center gap-1 rounded-md border border-gray-600 bg-[#080B12] p-2 transition-colors duration-200 hover:border-secondary-500 hover:ring-1 hover:ring-secondary-500 disabled:cursor-not-allowed disabled:border-gray-700 disabled:text-gray-500 disabled:hover:border-gray-700 disabled:hover:ring-0"
				>
					<img
						src={OnTourIcon}
						alt="On Tour Icon"
						class="h-[58px] w-[58px] group-disabled:opacity-30"
					/>
					<div class="text-xs uppercase">Send Artist<br />On Tour</div>
				</button>
				<p class="font-bold text-white">🎤 Send on Tour</p>
				<p>Perform live to grow the fanbase.</p>
				<p>Send the artist on tour to increase popularity and generate revenue.</p>
			</Tooltip>
		{/if}

		<!-- Produce record Buttons -->
		{#if isRapper(artist)}
			<Tooltip position="bottom">
				<button
					slot="trigger"
					on:click={() => openRecordingReleaseModal({ workerId: artist.id })}
					class="group flex size-28 select-none flex-col items-center gap-1 rounded-md border border-gray-600 bg-[#080B12] p-2 transition-colors duration-200 hover:border-secondary-500 hover:ring-1 hover:ring-secondary-500 disabled:cursor-not-allowed disabled:border-gray-700 disabled:text-gray-500 disabled:hover:border-gray-700 disabled:hover:ring-0"
				>
					<img
						src={ProduceRecordIcon}
						alt="Produce Record Icon"
						class="h-[58px] w-[58px] group-disabled:opacity-30"
					/>
					<div class="text-xs uppercase">Produce<br />Record</div>
				</button>
				<p class="font-bold text-white">🎙️ Record Release</p>
				<p>Create and prepare a new track.</p>
				<p>Record a song using available beats and get it ready for distribution.</p>
			</Tooltip>
		{/if}

		<!-- Produce beat(s) button -->
		{#if isBeatmaker(artist)}
			<Tooltip position="bottom">
				<button
					slot="trigger"
					on:click={() => openProducingBeatsModal({ workerId: artist.id })}
					class="group flex size-28 select-none flex-col items-center gap-1 rounded-md border border-gray-600 bg-[#080B12] p-2 transition-colors duration-200 hover:border-secondary-500 hover:ring-1 hover:ring-secondary-500 disabled:cursor-not-allowed disabled:border-gray-700 disabled:text-gray-500 disabled:hover:border-gray-700 disabled:hover:ring-0"
				>
					<img
						src={ProduceBeatsIcon}
						alt="Produce Beats Icon"
						class="h-[58px] w-[58px] group-disabled:opacity-30"
					/>
					<div class="text-xs uppercase">Produce<br />Beat(s)</div>
				</button>
				<p class="font-bold text-white">🎧 Produce Beats</p>
				<p>Create new instrumentals.</p>
				<p>Assign a beatmaker to produce beats that can be used for future releases.</p>
			</Tooltip>
		{/if}
	{/if}
</div>
