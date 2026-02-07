<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { isAuthenticated, isAuthLoading, currentLabel } from '$lib/stores/appState';

	onMount(() => {
		// Wait for auth to finish loading
		const unsubscribe = isAuthLoading.subscribe((loading) => {
			if (!loading) {
				// Auth finished loading, check authentication status
				const authenticated = $isAuthenticated;

				if (authenticated) {
					// User is authenticated, check if they have a label
					const label = $currentLabel;

					if (label) {
						// Has a label, redirect to label dashboard
						goto('/labels');
					} else {
						// No label yet, redirect to create label
						goto('/labels/create');
					}
				} else {
					// Not authenticated, redirect to login
					goto('/users/login');
				}
			}
		});

		return () => unsubscribe();
	});
</script>

<!-- Loading state while determining where to redirect -->
<div class="flex items-center justify-center min-h-screen">
	<div class="text-center">
		<p class="text-lg">Loading...</p>
	</div>
</div>
