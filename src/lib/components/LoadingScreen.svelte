<script lang="ts">
	import { VERSION } from '$lib/version';
	import gameLogo from '$lib/assets/game-logo.png';
</script>

<div class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-primary-950">
	<!-- Logo/Branding area -->
	<div class="mb-8 text-center">
		<img src={gameLogo} alt="Game Logo" class="mx-auto mb-8 select-none" />
		<p class="text-lg text-gray-400">Loading your empire...</p>
	</div>

	<!-- Animated spinner -->
	<div class="relative h-16 w-16">
		<div
			class="absolute inset-0 animate-spin rounded-full border-4 border-gray-700 border-t-purple-500"
		></div>
	</div>

	<!-- Optional flavor text -->
	<div class="mt-8 max-w-md text-center">
		<p class="text-sm text-gray-500">Checking studios, counting beats, syncing artists...</p>
	</div>

	<!-- Version info -->
	<div class="absolute bottom-4 right-4 text-xs text-gray-600">
		v{VERSION}
	</div>
</div>

<style>
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
	.animate-spin {
		animation: spin 1s linear infinite;
	}
</style>
