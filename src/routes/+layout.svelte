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
	import MenuBar from '$lib/components/navigation/MenuBar.svelte';
	import LoadingScreen from '$lib/components/LoadingScreen.svelte';
	import { VERSION, GIT_HASH } from '$lib/version';
	import { taskClaimingService } from '$lib/services/taskClaimingService';
	import { globalTime } from '$lib/stores/globalTime';

	let initializingPlayer = false;
	let firstAuthCheckComplete = false;

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
			// Mark that first auth check is complete
			if (!firstAuthCheckComplete) {
				firstAuthCheckComplete = true;
			}

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
					appState.setAuthLoading(false);
					await goto('/users/login');
				} else if (result.success && isPublicRoute && $page.url.pathname !== '/labels/create') {
					// User is authenticated and on public route (except label creation), redirect appropriately
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
				// User is already loaded, just update auth state and clear loading
				appState.setFirebaseUser(user);
				appState.setAuthLoading(false);
			} else if (!user && !isPublicRoute && firstAuthCheckComplete) {
				// User is signed out and on protected route, redirect to login
				// Only redirect after first auth check to avoid flash on page load
				appState.reset();
				await goto('/users/login');
			} else if (!user) {
				// User is signed out but on public route, just update state and clear loading
				appState.setFirebaseUser(null);
				appState.setAuthLoading(false);
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
	href="https://fonts.googleapis.com/css2?family=Roboto:ital,wdth,wght@100;200;300;400;500;700;800;900&display=swap"
	rel="stylesheet"
/>
<link
	href="https://fonts.googleapis.com/css2?family=Roboto:ital,wdth,wght@100;200;300;400;500;700;800;900&display=swap"
	rel="stylesheet"
/>

<QueryClientProvider client={queryClient}>
	<Modal />
	<ErrorAlert />

	<div class="flex flex-row font-roboto antialiased">
		{#if $isAuthLoading}
			<!-- Show loading screen only during initial auth check -->
			<LoadingScreen />
		{:else}
			{#if $isAuthenticated && !isPublicRoute && $currentPlayer}
				<MenuBar />
			{/if}
			<main class="min-h-screen flex-grow bg-primary-950 text-white">
				<slot />
			</main>
		{/if}
	</div>
	<div class="fixed bottom-2 right-4 select-none text-xs text-white">
		MVP v{VERSION} ({GIT_HASH})
	</div>
</QueryClientProvider>
