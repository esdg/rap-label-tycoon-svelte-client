<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import Modal from '$lib/components/Modal.svelte';
	import { authStore, authLoading, isAuthenticated } from '$lib/stores/auth';
	import { onFirebaseAuthStateChanged } from '$lib/firebase';
	import { initializeAuthState, logoutAndRedirect } from '$lib/services/auth';
	import { player } from '$lib/stores/player';
	import Button from '$lib/components/Button.svelte';
	import MenuBar from '$lib/components/MenuBar.svelte';

	let currentPlayer = $player;
	let initializingPlayer = false;

	// Subscribe to player changes
	player.subscribe((value) => {
		currentPlayer = value;
	});

	// Public routes that don't require authentication
	const publicRoutes = ['/users/login', '/users/register', '/template', '/labels/create'];

	// Check if current route is public
	$: isPublicRoute = publicRoutes.some((route) => $page.url.pathname.startsWith(route));

	onMount(() => {
		// Listen for Firebase auth state changes
		const unsubscribe = onFirebaseAuthStateChanged(async (user) => {
			if (user && !currentPlayer && !initializingPlayer) {
				initializingPlayer = true;
				// User is signed in, initialize player data
				const result = await initializeAuthState(user.uid);
				initializingPlayer = false;

				if (!result.success && !isPublicRoute) {
					// Failed to get player data, redirect to login
					await goto('/users/login');
				} else if (result.success && isPublicRoute) {
					// User is authenticated and on public route, redirect appropriately
					if (result.labels && result.labels.length > 0) {
						await goto('/labels');
					} else {
						await goto('/labels/create');
					}
				}
			} else if (!user && !isPublicRoute) {
				// User is signed out and on protected route, redirect to login
				await goto('/users/login');
			}
		});

		return () => unsubscribe();
	});
</script>

<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
<link
	href="https://fonts.googleapis.com/css2?family=Roboto:wght@100;300;400;500;700;900&display=swap"
	rel="stylesheet"
/>
<Modal />

<div class="flex flex-row">
	{#if $authLoading && !isPublicRoute}
		<div class="min-h-screen bg-gray-900 flex items-center justify-center">
			<div class="text-white text-xl">Loading...</div>
		</div>
	{:else}
		{#if $isAuthenticated && !isPublicRoute && currentPlayer}
			<MenuBar username={currentPlayer.username} />
		{/if}
		<main
			class="bg-app flex-grow min-h-screen text-white"
			style="font-family: 'Roboto', sans-serif;"
		>
			<slot />
		</main>
	{/if}
</div>
