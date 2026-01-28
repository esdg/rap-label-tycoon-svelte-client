<script lang="ts">
	import { modalStore } from '$lib/stores/modal';

	function openScoutModal() {
		modalStore.open('task-modal', { subModal: 'scout' });
	}
</script>

<div class="min-h-screen bg-gray-900 text-white p-8">
	<h1 class="text-3xl font-bold mb-8">Dashboard</h1>

	<div class="space-y-4">
		<button
			on:click={openScoutModal}
			class="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
		>
			Scout Talents
		</button>
	</div>
</div>
