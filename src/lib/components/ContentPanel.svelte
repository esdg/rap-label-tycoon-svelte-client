<script lang="ts">
	import { setContext, onMount } from 'svelte';
	import { writable } from 'svelte/store';

	// Props
	export let activeStepIndex: number = 0;
	export let transition: 'none' | 'fade' | 'slide' = 'fade';
	export let duration: number = 300;

	// Track previous step to determine direction
	let previousStepIndex = activeStepIndex;
	let direction: 'forward' | 'backward' = 'forward';

	// Stores for child components
	const activeStore = writable(activeStepIndex);
	const directionStore = writable<'forward' | 'backward'>('forward');

	// Item registration with stable indices using a Map
	const itemRegistry = new Map<symbol, number>();
	let nextIndex = 0;

	function registerItem(id: symbol): number {
		if (itemRegistry.has(id)) {
			return itemRegistry.get(id)!;
		}
		const index = nextIndex++;
		itemRegistry.set(id, index);
		return index;
	}

	function unregisterItem(id: symbol): void {
		itemRegistry.delete(id);
	}

	// Set context for child components
	setContext('contentPanel', {
		activeStore,
		directionStore,
		transition,
		duration,
		registerItem,
		unregisterItem
	});

	// Update stores and direction when activeStepIndex changes
	$: {
		if (activeStepIndex !== previousStepIndex) {
			direction = activeStepIndex > previousStepIndex ? 'forward' : 'backward';
			directionStore.set(direction);
			previousStepIndex = activeStepIndex;
		}
		activeStore.set(activeStepIndex);
	}
</script>

<div class="content-panel">
	<slot />
</div>

<style>
	.content-panel {
		position: relative;
		width: 100%;
		overflow: hidden;
	}
</style>
