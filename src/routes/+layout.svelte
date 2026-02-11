<script lang="ts">
	import '../app.css';
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { QueryClientProvider } from '@tanstack/svelte-query';
	import { queryClient } from '$lib/queries/queryClient';
	import Modal from '$lib/components/Modal.svelte';
	import ErrorAlert from '$lib/components/ErrorAlert.svelte';
	import { onFirebaseAuthStateChanged } from '$lib/firebase';
	import { initializeAuthState } from '$lib/services/auth';
	import {
		appState,
		currentPlayer,
		currentLabel,
		isAuthenticated,
		isAuthLoading
	} from '$lib/stores/appState';
	import MenuBar from '$lib/components/MenuBar.svelte';
	import LoadingScreen from '$lib/components/LoadingScreen.svelte';
	import { VERSION, GIT_HASH } from '$lib/version';
	import { taskClaimingService } from '$lib/services/taskClaimingService';
	import { globalTime } from '$lib/stores/globalTime';

	let initializingPlayer = false;

	// Public routes that don't require authentication
	const publicRoutes = ['/users/login', '/users/register', '/template', '/labels/create'];

	// Check if current route is public
	$: isPublicRoute = publicRoutes.some((route) => $page.url.pathname.startsWith(route));

	// Start/stop task claiming service based on auth and label state
	$: if ($isAuthenticated && $currentLabel?.id) {
		// User is authenticated and has a label - start the service
		taskClaimingService.start($currentLabel.id);
	} else {
		// User is not authenticated or has no label - stop the service
		taskClaimingService.stop();
	}

	onMount(() => {
		// Start global timer for synchronized time across all components
		globalTime.start();

		// Listen for Firebase auth state changes
		const unsubscribe = onFirebaseAuthStateChanged(async (user) => {
			if (user && !$currentPlayer && !initializingPlayer) {
				initializingPlayer = true;
				// Keep loading state active while fetching player data
				appState.setAuthLoading(true);

				// User is signed in, initialize player data
				const result = await initializeAuthState(user.uid);
				initializingPlayer = false;

				if (!result.success && !isPublicRoute) {
					// Failed to get player data, redirect to login
					appState.setFirebaseUser(null);
					await goto('/users/login');
				} else if (result.success && isPublicRoute) {
					// User is authenticated and on public route, redirect appropriately
					appState.setFirebaseUser(user);
					if (result.labels && result.labels.length > 0) {
						await goto('/labels');
					} else {
						await goto('/labels/create');
					}
				} else if (result.success) {
					// User is authenticated and on protected route - all good
					appState.setFirebaseUser(user);
				}
			} else if (user && $currentPlayer) {
				// User is already loaded, just update auth state
				appState.setFirebaseUser(user);
			} else if (!user && !isPublicRoute) {
				// User is signed out and on protected route, redirect to login
				// Keep loading state active during redirect
				appState.reset();
				await goto('/users/login');
				appState.setAuthLoading(false);
			} else if (!user) {
				// User is signed out but on public route, just update state
				appState.setFirebaseUser(null);
			}
		});

		return () => unsubscribe();
	});

	onDestroy(() => {
		// Stop global timer
		globalTime.stop();
		// Clean up task claiming service on unmount
		taskClaimingService.stop();
	});
</script>

<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="true" />
<link
	href="https://fonts.googleapis.com/css2?family=Roboto:ital,wdth,wght@0,75,100..900;1,75,100..900&display=swap"
	rel="stylesheet"
/>
<link
	href="https://fonts.googleapis.com/css2?family=Roboto:ital,wdth,wght@0,75..100,100..900;1,75..100,100..900&display=swap"
	rel="stylesheet"
/>

<QueryClientProvider client={queryClient}>
	<Modal />
	<ErrorAlert />

	<div class="flex flex-row antialiased">
		{#if $isAuthLoading}
			<!-- Show loading screen only during initial auth check -->
			<LoadingScreen />
		{:else}
			{#if $isAuthenticated && !isPublicRoute && $currentPlayer}
				<MenuBar />
			{/if}
			<main class="font-roboto min-h-screen flex-grow bg-primary-950 text-white">
				<slot />
			</main>
		{/if}
	</div>
	<div class="fixed bottom-2 right-4 select-none text-xs text-white">
		MVP v{VERSION} ({GIT_HASH})
	</div>
</QueryClientProvider>
