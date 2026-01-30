<script lang="ts">
	import { goto } from '$app/navigation';
	import { createPlayer } from '$lib/api';
	import { player } from '$lib/stores/player';
	import { firebaseCreateAccount } from '$lib/firebase';
	import { googleSignInAndRedirect } from '$lib/services/auth';
	import Button from '$lib/components/Button.svelte';
	import GoogleSignInButton from '$lib/components/GoogleSignInButton.svelte';

	let username: string = '';
	let email: string = '';
	let password: string = '';
	let confirmPassword: string = '';
	let isLoading: boolean = false;
	let isGoogleLoading: boolean = false;
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
		if (!password) {
			error = 'Password is required';
			return;
		}
		if (password.length < 6) {
			error = 'Password must be at least 6 characters';
			return;
		}
		if (password !== confirmPassword) {
			error = 'Passwords do not match';
			return;
		}

		isLoading = true;

		try {
			// 1. Create Firebase account
			const firebaseUser = await firebaseCreateAccount(email.trim(), password);

			// 2. Create player in backend API with Firebase UID
			const response = await createPlayer({
				firebaseUserId: firebaseUser.uid,
				username: username.trim(),
				email: email.trim()
			});

			// Store player data in global store
			player.set(response);

			// Navigate to label creation page (new users don't have labels)
			await goto('/labels/create');
		} catch (err: unknown) {
			// Handle Firebase specific errors
			if (err && typeof err === 'object' && 'code' in err) {
				const firebaseError = err as { code: string; message: string };
				switch (firebaseError.code) {
					case 'auth/email-already-in-use':
						error = 'An account with this email already exists';
						break;
					case 'auth/invalid-email':
						error = 'Invalid email address';
						break;
					case 'auth/weak-password':
						error = 'Password is too weak';
						break;
					default:
						error = firebaseError.message || 'An error occurred during registration';
				}
			} else {
				error = err instanceof Error ? err.message : 'An error occurred during registration';
			}
		} finally {
			isLoading = false;
		}
	}

	async function handleGoogleSignIn() {
		error = '';
		isGoogleLoading = true;

		try {
			const result = await googleSignInAndRedirect();
			if (!result.success && result.error) {
				error = result.error;
			}
		} catch (err: unknown) {
			if (err && typeof err === 'object' && 'code' in err) {
				const firebaseError = err as { code: string; message: string };
				if (firebaseError.code === 'auth/popup-closed-by-user') {
					error = 'Sign-in cancelled';
				} else {
					error = firebaseError.message || 'Google sign-in failed';
				}
			} else {
				error = err instanceof Error ? err.message : 'Google sign-in failed';
			}
		} finally {
			isGoogleLoading = false;
		}
	}
</script>

<div class="min-h-screen bg-gray-900 text-white p-8">
	<div class="max-w-md mx-auto">
		<h1 class="text-3xl font-bold mb-8">Create Account</h1>

		{#if error}
			<div class="mb-4 p-4 bg-red-900/50 border border-red-500 rounded text-red-200">
				{error}
			</div>
		{/if}

		<form on:submit|preventDefault={handleCreateAccount} class="space-y-4">
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

			<div>
				<label for="password" class="block text-sm font-medium mb-2">Password</label>
				<input
					id="password"
					type="password"
					bind:value={password}
					disabled={isLoading}
					placeholder="Enter your password (min 6 characters)"
					class="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:border-blue-500 disabled:opacity-50"
				/>
			</div>

			<div>
				<label for="confirmPassword" class="block text-sm font-medium mb-2">Confirm Password</label>
				<input
					id="confirmPassword"
					type="password"
					bind:value={confirmPassword}
					disabled={isLoading}
					placeholder="Confirm your password"
					class="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:border-blue-500 disabled:opacity-50"
				/>
			</div>

			<Button
				color="blue"
				style="normal"
				text={isLoading ? 'Creating Account...' : 'Create Account'}
				altText="Create new account"
				fullWidth={true}
				loading={isLoading}
				disabled={isLoading || isGoogleLoading}
				on:clicked={handleCreateAccount}
			/>

			<div class="relative my-6">
				<div class="absolute inset-0 flex items-center">
					<div class="w-full border-t border-gray-700"></div>
				</div>
				<div class="relative flex justify-center text-sm">
					<span class="px-2 bg-gray-900 text-gray-400">Or continue with</span>
				</div>
			</div>

			<GoogleSignInButton
				loading={isGoogleLoading}
				disabled={isLoading || isGoogleLoading}
				on:click={handleGoogleSignIn}
			/>

			<p class="text-center text-gray-400 mt-4">
				Already have an account?
				<a href="/users/login" class="text-blue-400 hover:text-blue-300 underline">Sign in</a>
			</p>
		</form>
	</div>
</div>
