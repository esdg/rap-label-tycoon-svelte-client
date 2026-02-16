<script lang="ts">
	import { goto } from '$app/navigation';
	import { currentLabel } from '$lib/stores/appState';
	import { createUpdateLabelMutation } from '$lib/queries/labelQueries';
	import TextField from '$lib/components/formfields/TextField.svelte';
	import Button from '$lib/components/Button.svelte';

	let name = $currentLabel?.name || '';
	let description = $currentLabel?.description || '';
	let error = '';
	let isSubmitting = false;

	const updateMutation = createUpdateLabelMutation();

	async function handleSubmit() {
		if (!$currentLabel) {
			error = 'No label selected';
			return;
		}

		if (!name.trim()) {
			error = 'Label name is required';
			return;
		}

		if (name.trim().length < 3) {
			error = 'Label name must be at least 3 characters';
			return;
		}

		isSubmitting = true;
		error = '';

		try {
			await $updateMutation.mutateAsync({
				labelId: $currentLabel.id,
				data: {
					name: name.trim(),
					description: description.trim()
				}
			});
			goto('/labels');
		} catch (err: any) {
			error = err.message || 'Failed to update label';
			isSubmitting = false;
		}
	}

	function handleCancel() {
		goto('/labels');
	}
</script>

<div class="flex min-h-screen items-center justify-center bg-gray-900 px-4 py-8">
	<div class="w-full max-w-md rounded-lg bg-gray-800 p-8 shadow-xl">
		<h1 class="mb-6 text-2xl font-bold text-white">Edit Label Information</h1>

		{#if $currentLabel}
			<form on:submit|preventDefault={handleSubmit} class="space-y-6">
				<div>
					<TextField
						id="name"
						label="Label Name"
						bind:value={name}
						placeholder="Enter label name"
						required
						disabled={isSubmitting}
					/>
				</div>

				<div>
					<TextField
						id="description"
						label="Description"
						inputType="textarea"
						bind:value={description}
						placeholder="Enter label description"
						disabled={isSubmitting}
					/>
				</div>

				{#if error}
					<div class="rounded-lg border border-red-500 bg-red-500/10 p-4 text-red-400">
						{error}
					</div>
				{/if}

				<div class="flex gap-4">
					<button
						type="submit"
						disabled={isSubmitting}
						class="flex-1 rounded-lg bg-primary-500 px-4 py-2 text-white hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
					>
						{isSubmitting ? 'Saving...' : 'Save Changes'}
					</button>
					<button
						type="button"
						on:click={handleCancel}
						disabled={isSubmitting}
						class="flex-1 rounded-lg bg-gray-600 px-4 py-2 text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
					>
						Cancel
					</button>
				</div>
			</form>
		{:else}
			<div class="rounded-lg border border-red-500 bg-red-500/10 p-4 text-red-400">
				No label selected. Please select a label from the dashboard.
			</div>
			<Button on:clicked={handleCancel} class="mt-4 w-full">Go to Dashboard</Button>
		{/if}
	</div>
</div>
