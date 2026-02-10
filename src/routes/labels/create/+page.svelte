<script lang="ts">
	import { goto } from '$app/navigation';
	import { createLabel } from '$lib/api/labels';
	import { appState, currentPlayer } from '$lib/stores/appState';
	import Button from '$lib/components/Button.svelte';
	import Hero from '$lib/components/Hero.svelte';
	import SelectField from '$lib/components/formfields/SelectField.svelte';
	import TextField from '$lib/components/formfields/TextField.svelte';
	import { RapMusicStyle, RapMusicStyleNames } from '$lib/types/musicStyles';
	import heroImage from '$lib/assets/hero-create-label.png';

	let name: string = '';
	let description: string = '';
	let productionStyles: Set<RapMusicStyle> = new Set();
	let isLoading: boolean = false;
	let error: string = '';

	async function handleCreateLabel() {
		// Reset error
		error = '';

		// Validate inputs
		if (!$currentPlayer?.id) {
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
		if (productionStyles.size === 0) {
			error = 'Select at least one production style';
			return;
		}

		isLoading = true;

		try {
			const response = await createLabel({
				ownerPlayerId: $currentPlayer.id,
				name: name.trim(),
				description: description.trim(),
				productionStyles: Array.from(productionStyles)
			});

			// Add new label to app state and set as current
			appState.addLabel(response);

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

<div class="flex h-full flex-col-reverse md:flex-row">
	<Hero image={heroImage}>
		<div class="mx-auto max-w-112 pb-24">
			<h1 class="mb-4 text-center text-5xl font-black">Every legend starts with a name</h1>
			<p class="max-w text-center text-lg">
				Build your brand, sign talent, and take over the game.
			</p>
			<p class="max-w mt-6 text-center text-4xl font-black text-primary-500">
				Name it. Own it. Run it.
			</p>
		</div>
	</Hero>
	<section class="md:basis-3/5">
		<div class="min-h-screen p-8 text-white">
			<div class="mx-auto max-w-2xl">
				<h1 class="mb-16 flex select-none flex-col font-thin uppercase">
					<span class="text-3xl/6 font-thin">Create</span>
					<span class="text-6xl font-black">your label</span>
				</h1>

				{#if error}
					<div class="mb-4 rounded border border-red-500 bg-red-900/50 p-4 text-red-200">
						{error}
					</div>
				{/if}

				{#if !$currentPlayer}
					<div class="rounded border border-yellow-500 bg-yellow-900/50 p-4 text-yellow-200">
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
							maxlength={50}
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
							bind:value={productionStyles}
							labelFor="genre-btn"
						/>

						<Button
							color="primary"
							style="normal"
							altText="Create new label"
							fullWidth={true}
							loading={isLoading}
							disabled={isLoading}
							on:clicked={handleCreateLabel}
						>
							{isLoading ? 'Creating your Label...' : 'Create your Label'}
						</Button>
					</div>
				{/if}
			</div>
		</div>
	</section>
</div>
