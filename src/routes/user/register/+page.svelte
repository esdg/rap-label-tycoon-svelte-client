<script lang="ts">
	import { goto } from '$app/navigation';
	import { api } from '$lib/api';
	import { player } from '$lib/stores/player';
	import type { Player } from '$lib/types/player';

	let username: string = '';
	let email: string = '';
	let isLoading: boolean = false;
	let error: string = '';

	async function handleCreateAccount() {
		// Reset error
		error = '';

		// Validate inputs
		if (!username.trim()) {
			error = 'Username is required';
			return;
		}
		if (!email.trim()) {
			error = 'Email is required';
			return;
		}
		if (!email.includes('@')) {
			error = 'Please enter a valid email address';
			return;
		}

		isLoading = true;

		try {
			const response = await api<Player>('/api/v1/players', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					username: username.trim(),
					email: email.trim()
				})
			});

			// Store player data in global store
			player.set(response);

			// Navigate to label creation page
			await goto('/label/create');
		} catch (err) {
			error = err instanceof Error ? err.message : 'An error occurred during registration';
		} finally {
			isLoading = false;
		}
	}
</script>

<div class="min-h-screen bg-gray-900 text-white p-8">
	<div class="max-w-md mx-auto">
		<h1 class="text-3xl font-bold mb-8">Register</h1>

		{#if error}
			<div class="mb-4 p-4 bg-red-900/50 border border-red-500 rounded text-red-200">
				{error}
			</div>
		{/if}

		<div class="space-y-4">
			<div>
				<label for="username" class="block text-sm font-medium mb-2">Username</label>
				<input
					id="username"
					type="text"
					bind:value={username}
					disabled={isLoading}
					placeholder="Enter your username"
					class="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:border-blue-500 disabled:opacity-50"
				/>
			</div>

			<div>
				<label for="email" class="block text-sm font-medium mb-2">Email</label>
				<input
					id="email"
					type="email"
					bind:value={email}
					disabled={isLoading}
					placeholder="Enter your email"
					class="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:border-blue-500 disabled:opacity-50"
				/>
			</div>

			<button
				on:click={handleCreateAccount}
				disabled={isLoading}
				class="w-full mt-6 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded font-medium transition-colors"
			>
				{isLoading ? 'Creating Account...' : 'Create Account'}
			</button>
		</div>
	</div>
</div>
