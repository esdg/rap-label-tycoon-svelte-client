<script lang="ts">
	import RecordIcon from '$lib/icons/RecordIcon.svelte';
	import SoundWaveIcon from '$lib/icons/SoundWaveIcon.svelte';
	import WorldIcon from '$lib/icons/WorldIcon.svelte';
	import { modalStore } from '$lib/stores';
	import type { Artist } from '$lib/types/nonPlayingCharacter';
	import type { TimedTask } from '$lib/types/task';
	import { isBeatmaker, isRapper } from '$lib/utils';

	export let artist: Artist;
	let className = '';
	export { className as class };

	async function openProduceBeatsModal() {
		modalStore.open('task-modal', {
			subModal: 'producing-beats',
			title: 'Producing beat(s)',
			imageUrl:
				'https://res.cloudinary.com/dig430oem/image/upload/v1769715987/scouting-cover_mtrurs.png'
		});
	}
	async function openRecordingReleaseModal() {
		modalStore.open('task-modal', {
			subModal: 'recording-release',
			title: 'Recording Release',
			imageUrl:
				'https://res.cloudinary.com/dig430oem/image/upload/v1769715987/scouting-cover_mtrurs.png'
		});
	}
</script>

<div class="mb-6 flex gap-2 justify-end {className}">
	<!-- Send artist on tour button -->
	{#if isRapper(artist)}
		<button
			class="flex items-center flex-col gap-1 bg-[#080B12] size-28 border border-gray-600 rounded-md p-2 hover:border-secondary-500 transition-colors duration-200 hover:ring-secondary-500 hover:ring-1 select-none"
		>
			<WorldIcon />
			<div class="text-xs uppercase">Send Artist<br />On Tour</div>
		</button>
	{/if}

	<!-- Produce record Buttons -->
	{#if isRapper(artist)}
		<button
			on:click={() => openRecordingReleaseModal()}
			class="flex items-center flex-col gap-1 bg-[#080B12] size-28 border border-gray-600 rounded-md p-2 hover:border-secondary-500 transition-colors duration-200 hover:ring-secondary-500 hover:ring-1 select-none"
		>
			<RecordIcon />
			<div class="text-xs uppercase">Produce<br />Record</div>
		</button>
	{/if}

	<!-- Produce beat(s) button -->
	{#if isBeatmaker(artist)}
		<button
			on:click={() => openProduceBeatsModal()}
			class="flex items-center flex-col gap-1 bg-[#080B12] size-28 border border-gray-600 rounded-md p-2 hover:border-secondary-500 transition-colors duration-200 hover:ring-secondary-500 hover:ring-1 select-none"
		>
			<SoundWaveIcon />
			<div class="text-xs uppercase">Produce<br />Beat(s)</div>
		</button>
	{/if}
</div>
