<script lang="ts">
	import { registerAndRedirect, googleSignInAndRedirect } from '$lib/services/auth';
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
			const result = await registerAndRedirect(username.trim(), email.trim(), password);
			if (!result.success && result.error) {
				error = result.error;
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
						altText="Create new account"
						fullWidth={true}
						loading={isLoading}
						disabled={isLoading || isGoogleLoading}
						on:clicked={handleCreateAccount}
					>
						{isLoading ? 'Creating Account...' : 'Create Account'}
					</Button>

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
