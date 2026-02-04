<script lang="ts">
	import { loginAndRedirect, googleSignInAndRedirect } from '$lib/services/auth';
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
			const result = await loginAndRedirect(email.trim(), password);
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
