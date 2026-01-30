<script lang="ts">
	import { goto } from '$app/navigation';
	import { getPlayerByFirebaseUserId, getPlayerLabels } from '$lib/api';
	import { player } from '$lib/stores/player';
	import { label } from '$lib/stores/label';
	import { firebaseSignIn } from '$lib/firebase';
	import Button from '$lib/components/Button.svelte';

	let email: string = '';
	let password: string = '';
	let isLoading: boolean = false;
	let error: string = '';

	async function handleLogin() {
		// Reset error
		error = '';

		// Validate inputs
		if (!email.trim()) {
			error = 'Email is required';
			return;
		}
		if (!password) {
			error = 'Password is required';
			return;
		}

		isLoading = true;

		try {
			// 1. Sign in with Firebase
			const firebaseUser = await firebaseSignIn(email.trim(), password);

			// 2. Get player data from backend using Firebase UID
			const playerData = await getPlayerByFirebaseUserId(firebaseUser.uid);
			player.set(playerData);

			// 3. Check if player has labels
			if (playerData.labelIds && playerData.labelIds.length > 0) {
				// Fetch first label and set it in the store
				const labels = await getPlayerLabels(playerData.labelIds);
				if (labels.length > 0) {
					label.set(labels[0]);
				}
				// Navigate to labels dashboard
				await goto('/labels');
			} else {
				// No labels - redirect to create label page
				await goto('/labels/create');
			}
		} catch (err: unknown) {
			// Handle Firebase specific errors
			if (err && typeof err === 'object' && 'code' in err) {
				const firebaseError = err as { code: string; message: string };
				switch (firebaseError.code) {
					case 'auth/user-not-found':
					case 'auth/wrong-password':
					case 'auth/invalid-credential':
						error = 'Invalid email or password';
						break;
					case 'auth/invalid-email':
						error = 'Invalid email address';
						break;
					case 'auth/too-many-requests':
						error = 'Too many failed attempts. Please try again later.';
						break;
					default:
						error = firebaseError.message || 'An error occurred during login';
				}
			} else {
				error = err instanceof Error ? err.message : 'An error occurred during login';
			}
		} finally {
			isLoading = false;
		}
	}
</script>

<div class="min-h-screen bg-gray-900 text-white p-8">
	<div class="max-w-md mx-auto">
		<h1 class="text-3xl font-bold mb-8">Sign In</h1>

		{#if error}
			<div class="mb-4 p-4 bg-red-900/50 border border-red-500 rounded text-red-200">
				{error}
			</div>
		{/if}

		<form on:submit|preventDefault={handleLogin} class="space-y-4">
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

			<div>
				<label for="password" class="block text-sm font-medium mb-2">Password</label>
				<input
					id="password"
					type="password"
					bind:value={password}
					disabled={isLoading}
					placeholder="Enter your password"
					class="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:border-blue-500 disabled:opacity-50"
				/>
			</div>

			<Button
				color="blue"
				style="normal"
				text={isLoading ? 'Signing In...' : 'Sign In'}
				altText="Sign in to your account"
				fullWidth={true}
				loading={isLoading}
				disabled={isLoading}
				on:clicked={handleLogin}
			/>

			<p class="text-center text-gray-400 mt-4">
				Don't have an account?
				<a href="/users/register" class="text-blue-400 hover:text-blue-300 underline">Create one</a>
			</p>
		</form>
	</div>
</div>
