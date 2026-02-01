<script lang="ts">
	import { goto } from '$app/navigation';
	import { createPlayer } from '$lib/api';
	import { player } from '$lib/stores/player';
	import { firebaseCreateAccount } from '$lib/firebase';
	import { googleSignInAndRedirect } from '$lib/services/auth';
	import Button from '$lib/components/Button.svelte';
	import GoogleSignInButton from '$lib/components/GoogleSignInButton.svelte';
	import TextField from '$lib/components/formfields/TextField.svelte';
	import gameLogo from '$lib/assets/game-logo.png';
	import Hero from '$lib/components/Hero.svelte';
	import heroImage from '$lib/assets/hero-register.png';
	import Separator from '$lib/components/Separator.svelte';
	import FormError from '$lib/components/formfields/FormError.svelte';

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

<div class="flex md:flex-row flex-col-reverse h-full">
	<Hero image={heroImage}>
		<div class="max-w-112 mx-auto pb-24">
			<h1 class="text-5xl font-black mb-4 text-center">Start your journey as a label boss</h1>
			<p class="max-w text-lg text-center">
				Sign artists, build your roster, and turn raw talent into legends.
			</p>
			<p class="max-w text-4xl font-black text-center mt-6 text-primary-500">
				Your story starts now.
			</p>
		</div>
	</Hero>
	<section class="md:basis-3/5">
		<div class="min-h-screen text-white p-8">
			<div class="max-w-md mx-auto">
				<img src={gameLogo} alt="Game Logo" class="mx-auto mb-8 select-none" />

				{#if error}
					<FormError {error} />
				{/if}

				<form on:submit|preventDefault={handleCreateAccount} class="space-y-4">
					<TextField
						label="Username"
						id="username"
						inputType="text"
						bind:value={username}
						disabled={isLoading}
						placeholder="Enter your username"
					/>

					<TextField
						label="Email"
						id="email"
						inputType="email"
						bind:value={email}
						disabled={isLoading}
						placeholder="Enter your email"
						autocomplete="email"
					/>

					<TextField
						label="Password"
						id="password"
						inputType="password"
						bind:value={password}
						disabled={isLoading}
						placeholder="Enter your password (min 6 characters)"
						autocomplete="new-password"
					/>

					<TextField
						label="Confirm Password"
						id="confirmPassword"
						inputType="password"
						bind:value={confirmPassword}
						disabled={isLoading}
						placeholder="Confirm your password"
						autocomplete="new-password"
					/>

					<Button
						color="primary"
						style="normal"
						text={isLoading ? 'Creating Account...' : 'Create Account'}
						altText="Create new account"
						fullWidth={true}
						loading={isLoading}
						disabled={isLoading || isGoogleLoading}
						on:clicked={handleCreateAccount}
					/>

					<Separator />

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
	</section>
</div>
