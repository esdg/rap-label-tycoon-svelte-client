<script lang="ts">
	import { goto } from '$app/navigation';
	import { getPlayerByFirebaseUserId, getPlayerLabels } from '$lib/api';
	import { player } from '$lib/stores/player';
	import { label } from '$lib/stores/label';
	import { firebaseSignIn } from '$lib/firebase';
	import { googleSignInAndRedirect } from '$lib/services/auth';
	import Button from '$lib/components/Button.svelte';
	import GoogleSignInButton from '$lib/components/GoogleSignInButton.svelte';
	import gameLogo from '$lib/assets/game-logo.png';
	import Hero from '$lib/components/Hero.svelte';
	import heroImage from '$lib/assets/hero-login.png';
	import Separator from '$lib/components/Separator.svelte';
	import FormError from '$lib/components/formfields/FormError.svelte';
	import TextField from '$lib/components/formfields/TextField.svelte';

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

<div class="flex md:flex-row flex-col-reverse h-full">
	<Hero image={heroImage}>
		<div class="max-w-112 mx-auto pb-24">
			<h1 class="text-5xl font-black mb-4 text-center">Welcome back</h1>
			<p class="max-w text-lg text-center">The game never stopped.</p>
			<p class="max-w text-4xl font-black text-center mt-6 text-primary-500">Take back control.</p>
		</div>
	</Hero>
	<section class="md:basis-3/5">
		<div class="md:min-h-screen text-white p-8">
			<div class="max-w-md mx-auto">
				<img src={gameLogo} alt="Game Logo" class="mx-auto mb-8 select-none" />

				{#if error}
					<FormError {error} />
				{/if}

				<form on:submit|preventDefault={handleLogin} class="space-y-4">
					<TextField
						label="Email"
						id="email"
						inputType="text"
						bind:value={email}
						disabled={isLoading}
						placeholder="Enter your email"
					/>

					<TextField
						label="Password"
						id="password"
						inputType="password"
						bind:value={password}
						disabled={isLoading}
						placeholder="Enter your password"
					/>

					<Button
						color="primary"
						style="normal"
						altText="Sign in to your account"
						fullWidth={true}
						loading={isLoading}
						disabled={isLoading || isGoogleLoading}
						on:clicked={handleLogin}
					>
						{isLoading ? 'Signing In...' : 'Sign In'}
					</Button>

					<Separator />

					<GoogleSignInButton
						loading={isGoogleLoading}
						disabled={isLoading || isGoogleLoading}
						on:click={handleGoogleSignIn}
					/>

					<p class="text-center text-primary-200 mt-4 select-none">
						Don't have an account?
						<a href="/users/register" class="text-primary-400 hover:text-primary-500 underline"
							>Create one</a
						>
					</p>
				</form>
			</div>
		</div>
	</section>
</div>
