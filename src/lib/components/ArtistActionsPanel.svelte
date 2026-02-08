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
				'https://res.cloudinary.com/dig430oem/image/upload/v1770582359/producing-beats-cover_nzyoxb.png'
		});
	}
	async function openRecordingReleaseModal() {
		modalStore.open('task-modal', {
			subModal: 'recording-release',
			title: 'Recording Release',
			imageUrl:
				'https://res.cloudinary.com/dig430oem/image/upload/v1770582711/recording-release-cover_lcaaqs.png'
		});
	}
</script>

<div class="mb-6 flex justify-end gap-2 {className}">
	<!-- Send artist on tour button -->
	{#if isRapper(artist)}
		<button
			class="flex size-28 select-none flex-col items-center gap-1 rounded-md border border-gray-600 bg-[#080B12] p-2 transition-colors duration-200 hover:border-secondary-500 hover:ring-1 hover:ring-secondary-500"
		>
			<WorldIcon />
			<div class="text-xs uppercase">Send Artist<br />On Tour</div>
		</button>
	{/if}

	<!-- Produce record Buttons -->
	{#if isRapper(artist)}
		<button
			on:click={() => openRecordingReleaseModal()}
			class="flex size-28 select-none flex-col items-center gap-1 rounded-md border border-gray-600 bg-[#080B12] p-2 transition-colors duration-200 hover:border-secondary-500 hover:ring-1 hover:ring-secondary-500"
		>
			<RecordIcon />
			<div class="text-xs uppercase">Produce<br />Record</div>
		</button>
	{/if}

	<!-- Produce beat(s) button -->
	{#if isBeatmaker(artist)}
		<button
			on:click={() => openProduceBeatsModal()}
			class="flex size-28 select-none flex-col items-center gap-1 rounded-md border border-gray-600 bg-[#080B12] p-2 transition-colors duration-200 hover:border-secondary-500 hover:ring-1 hover:ring-secondary-500"
		>
			<SoundWaveIcon />
			<div class="text-xs uppercase">Produce<br />Beat(s)</div>
		</button>
	{/if}
</div>
