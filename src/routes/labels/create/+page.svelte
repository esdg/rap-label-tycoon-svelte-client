<script lang="ts">
	import { goto } from '$app/navigation';
	import { api } from '$lib/api';
	import { player } from '$lib/stores/player';
	import { label } from '$lib/stores/label';
	import type { Label } from '$lib/types/label';
	import Button from '$lib/components/Button.svelte';

	let currentPlayer = $player;
	let name: string = '';
	let description: string = '';
	let productionStyles: number[] = [];
	let isLoading: boolean = false;
	let error: string = '';

	// Subscribe to player store
	player.subscribe((value) => {
		currentPlayer = value;
	});

	function toggleProductionStyle(style: number) {
		if (productionStyles.includes(style)) {
			productionStyles = productionStyles.filter((s) => s !== style);
		} else {
			productionStyles = [...productionStyles, style];
		}
	}

	async function handleCreateLabel() {
		// Reset error
		error = '';

		// Validate inputs
		if (!currentPlayer?.id) {
			error = 'Player data not found. Please register first.';
			return;
		}
		if (!name.trim()) {
			error = 'Label name is required';
			return;
		}
		if (!description.trim()) {
			error = 'Description is required';
			return;
		}
		if (productionStyles.length === 0) {
			error = 'Select at least one production style';
			return;
		}

		isLoading = true;

		try {
			const response = await api<Label>('/api/v1/rap-labels', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					ownerPlayerId: currentPlayer.id,
					name: name.trim(),
					description: description.trim(),
					productionStyles
				})
			});

			// Store label data in global store
			label.set(response);

			// Navigate to label dashboard
			await goto('/labels/dashboard');
		} catch (err) {
			error = err instanceof Error ? err.message : 'An error occurred while creating the label';
		} finally {
			isLoading = false;
		}
	}

	const productionStyleOptions = [
		{ id: 0, name: 'Boom Bap' },
		{ id: 1, name: 'Trap' },
		{ id: 2, name: 'SynthWave' },
		{ id: 3, name: 'LoFi' },
		{ id: 4, name: 'Industrial' },
		{ id: 5, name: 'Orchestral' },
		{ id: 6, name: 'Drill' },
		{ id: 7, name: 'Afrobeat' },
		{ id: 8, name: 'Grime' },
		{ id: 9, name: 'Cloud Rap' },
		{ id: 10, name: 'Crunk' },
		{ id: 11, name: 'G-Funk' },
		{ id: 12, name: 'Alternative Hip Hop' }
	];
</script>

<div class="min-h-screen bg-gray-900 text-white p-8">
	<div class="max-w-2xl mx-auto">
		<h1 class="text-3xl font-bold mb-8">Create Your Label</h1>

		{#if error}
			<div class="mb-4 p-4 bg-red-900/50 border border-red-500 rounded text-red-200">
				{error}
			</div>
		{/if}

		{#if !currentPlayer}
			<div class="p-4 bg-yellow-900/50 border border-yellow-500 rounded text-yellow-200">
				Please register first before creating a label.
			</div>
		{:else}
			<div class="space-y-6">
				<div>
					<label for="name" class="block text-sm font-medium mb-2">Label Name</label>
					<input
						id="name"
						type="text"
						bind:value={name}
						disabled={isLoading}
						placeholder="Enter your label name"
						class="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:border-blue-500 disabled:opacity-50"
					/>
				</div>

				<div>
					<label for="description" class="block text-sm font-medium mb-2">Description</label>
					<textarea
						id="description"
						bind:value={description}
						disabled={isLoading}
						placeholder="Describe your label's vision and goals"
						rows="4"
						class="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:border-blue-500 disabled:opacity-50"
					/>
				</div>

				<div>
					<label class="block text-sm font-medium mb-4">Production Styles</label>
					<div class="grid grid-cols-2 md:grid-cols-3 gap-3">
						{#each productionStyleOptions as style (style.id)}
							<label class="flex items-center">
								<input
									type="checkbox"
									checked={productionStyles.includes(style.id)}
									on:change={() => toggleProductionStyle(style.id)}
									disabled={isLoading}
									class="w-4 h-4 rounded border-gray-700 bg-gray-800 disabled:opacity-50"
								/>
								<span class="ml-2">{style.name}</span>
							</label>
						{/each}
					</div>
				</div>

				<Button
					color="green"
					style="normal"
					text={isLoading ? 'Creating Label...' : 'Create Label'}
					altText="Create new label"
					fullWidth={true}
					loading={isLoading}
					disabled={isLoading}
					on:clicked={handleCreateLabel}
				/>
			</div>
		{/if}
	</div>
</div>
