<script lang="ts">
	import { goto } from '$app/navigation';
	import { createLabel } from '$lib/api';
	import { player } from '$lib/stores/player';
	import { label } from '$lib/stores/label';
	import Button from '$lib/components/Button.svelte';
	import Hero from '$lib/components/Hero.svelte';
	import SelectField from '$lib/components/formfields/SelectField.svelte';
	import TextField from '$lib/components/formfields/TextField.svelte';
	import { RapMusicStyle, RapMusicStyleNames } from '$lib/types/musicStyles';
	import heroImage from '$lib/assets/hero-create-label.png';

	let currentPlayer = $player;
	let name: string = '';
	let description: string = '';
	let productionStyles: number[] = [];
	let isLoading: boolean = false;
	let error: string = '';
	let selectedGenres: Set<RapMusicStyle> = new Set();

	// Subscribe to player store
	player.subscribe((value) => {
		currentPlayer = value;
	});

	async function handleCreateLabel() {
		// Reset error
		error = '';

		// Validate inputs
		if (!currentPlayer?.id) {
			error = 'Player data not found. Please log in first.';
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
			const response = await createLabel({
				ownerPlayerId: currentPlayer.id,
				name: name.trim(),
				description: description.trim(),
				productionStyles
			});

			// Store label data in global store
			label.set(response);

			// Navigate to label dashboard
			await goto('/labels');
		} catch (err) {
			error = err instanceof Error ? err.message : 'An error occurred while creating the label';
		} finally {
			isLoading = false;
		}
	}

	$: genreChoices = Object.values(RapMusicStyle)
		.filter((v) => typeof v === 'number')
		.map((genre) => ({
			name: RapMusicStyleNames[genre as RapMusicStyle],
			value: genre
		}));
</script>

<div class="flex md:flex-row flex-col-reverse h-full">
	<Hero image={heroImage}>
		<div class="w-112 mx-auto">
			<h1 class="text-5xl font-black mb-4 text-center">Every legend starts with a name</h1>
			<p class="max-w text-lg text-center">
				Build your brand, sign talent, and take over the game.
			</p>
			<p class="max-w text-4xl font-black text-center mt-6 text-primary-500">
				Name it. Own it. Run it.
			</p>
		</div>
	</Hero>
	<section class="md:basis-3/5">
		<div class="min-h-screen text-white p-8">
			<div class="max-w-2xl mx-auto">
				<h1 class="text-3xl font-bold mb-8 uppercase font-thin select-none">Create Your Label</h1>

				{#if error}
					<div class="mb-4 p-4 bg-red-900/50 border border-red-500 rounded text-red-200">
						{error}
					</div>
				{/if}

				{#if !currentPlayer}
					<div class="p-4 bg-yellow-900/50 border border-yellow-500 rounded text-yellow-200">
						Please <a href="/users/login" class="underline">sign in</a> or
						<a href="/users/register" class="underline">create an account</a> before creating a label.
					</div>
				{:else}
					<div class="space-y-6">
						<TextField
							label="Label Name"
							id="name"
							inputType="text"
							bind:value={name}
							disabled={isLoading}
							placeholder="Enter your label name"
						/>

						<TextField
							label="Description"
							id="description"
							inputType="textarea"
							rows={4}
							bind:value={description}
							disabled={isLoading}
							placeholder="Describe your label's vision and goals"
						/>

						<SelectField
							label="Genre(s)"
							choices={genreChoices}
							mode="multi"
							bind:value={selectedGenres}
							labelFor="genre-btn"
						/>

						<Button
							color="blue"
							style="normal"
							text={isLoading ? 'Creating your Label...' : 'Create your Label'}
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
	</section>
</div>
