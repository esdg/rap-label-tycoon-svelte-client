<script lang="ts">
	import { goto } from '$app/navigation';
	import { currentPlayer } from '$lib/stores/appState';
	import { createUpdatePlayerMutation } from '$lib/queries/playerQueries';
	import TextField from '$lib/components/formfields/TextField.svelte';
	import Button from '$lib/components/Button.svelte';

	let username = $currentPlayer?.username || '';
	let error = '';
	let isSubmitting = false;

	const updateMutation = createUpdatePlayerMutation();

	async function handleSubmit() {
		if (!$currentPlayer) {
			error = 'No player data found';
			return;
		}

		if (!username.trim()) {
			error = 'Username is required';
			return;
		}

		if (username.trim().length < 3) {
			error = 'Username must be at least 3 characters';
			return;
		}

		isSubmitting = true;
		error = '';

		try {
			await $updateMutation.mutateAsync({
				playerId: $currentPlayer.id,
				data: { username: username.trim() }
			});
			goto('/labels');
		} catch (err: any) {
			error = err.message || 'Failed to update username';
			isSubmitting = false;
		}
	}

	function handleCancel() {
		goto('/labels');
	}
</script>

<div class="flex min-h-screen items-center justify-center bg-gray-900 px-4 py-8">
	<div class="w-full max-w-md rounded-lg bg-gray-800 p-8 shadow-xl">
		<h1 class="mb-6 text-2xl font-bold text-white">Edit Player Profile</h1>

		<form on:submit|preventDefault={handleSubmit} class="space-y-6">
			<div>
				<TextField
					id="username"
					label="Username"
					bind:value={username}
					placeholder="Enter your username"
					required
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
	</div>
</div>
