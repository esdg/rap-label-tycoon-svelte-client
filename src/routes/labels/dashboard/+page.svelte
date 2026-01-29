<script lang="ts">
	import { modalStore } from '$lib/stores/modal';
	import Button from '$lib/components/Button.svelte';

	function openScoutModal() {
		modalStore.open('task-modal', {
			subModal: 'scout',
			imageUrl:
				'https://res.cloudinary.com/dig430oem/image/upload/v1769715987/scouting-cover_mtrurs.png'
		});
	}
</script>

<div class="min-h-screen bg-gray-900 text-white p-8">
	<h1 class="text-3xl font-bold mb-8">Dashboard</h1>

	<div class="space-y-4">
		<Button
			color="blue"
			style="normal"
			text="Scout Talents"
			altText="Open scout talents modal"
			on:clicked={openScoutModal}
		/>
	</div>
</div>
