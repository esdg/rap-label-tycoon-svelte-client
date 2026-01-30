<script lang="ts">
	import { goto } from '$app/navigation';
	import { getPlayerByFirebaseUserId, getPlayerLabels } from '$lib/api';
	import { player } from '$lib/stores/player';
	import { label } from '$lib/stores/label';
	import { firebaseSignIn } from '$lib/firebase';
	import { googleSignInAndRedirect } from '$lib/services/auth';
	import Button from '$lib/components/Button.svelte';

	let email: string = '';
	let password: string = '';
	let isLoading: boolean = false;
	let isGoogleLoading: boolean = false;
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
				disabled={isLoading || isGoogleLoading}
				on:clicked={handleLogin}
			/>

			<div class="relative my-6">
				<div class="absolute inset-0 flex items-center">
					<div class="w-full border-t border-gray-700"></div>
				</div>
				<div class="relative flex justify-center text-sm">
					<span class="px-2 bg-gray-900 text-gray-400">Or continue with</span>
				</div>
			</div>

			<button
				type="button"
				on:click={handleGoogleSignIn}
				disabled={isLoading || isGoogleLoading}
				class="w-full flex items-center justify-center gap-3 px-4 py-2 bg-white text-gray-900 rounded hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
			>
				<svg class="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
					<path
						d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
						fill="#4285F4"
					/>
					<path
						d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
						fill="#34A853"
					/>
					<path
						d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
						fill="#FBBC05"
					/>
					<path
						d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
						fill="#EA4335"
					/>
				</svg>
				{isGoogleLoading ? 'Signing in with Google...' : 'Sign in with Google'}
			</button>

			<p class="text-center text-gray-400 mt-4">
				Don't have an account?
				<a href="/users/register" class="text-blue-400 hover:text-blue-300 underline">Create one</a>
			</p>
		</form>
	</div>
</div>
