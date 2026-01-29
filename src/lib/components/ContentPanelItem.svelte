<script lang="ts">
	import { getContext, onDestroy } from 'svelte';
	import { cubicOut, cubicIn } from 'svelte/easing';
	import type { Writable } from 'svelte/store';
	import type { FlyParams, FadeParams } from 'svelte/transition';

	type TransitionType = 'none' | 'fade' | 'slide';
	type Direction = 'forward' | 'backward';

	interface ContentPanelContext {
		activeStore: Writable<number>;
		directionStore: Writable<Direction>;
		transition: TransitionType;
		duration: number;
		registerItem: (id: symbol) => number;
		unregisterItem: (id: symbol) => void;
	}

	// Get context from parent ContentPanel
	const context = getContext<ContentPanelContext>('contentPanel');

	if (!context) {
		throw new Error('ContentPanelItem must be used inside a ContentPanel');
	}

	const { activeStore, directionStore, transition, duration, registerItem, unregisterItem } =
		context;

	// Create a unique identifier for this item instance
	const itemId = Symbol();
	const itemIndex = registerItem(itemId);

	// Local state from stores
	let activeStepIndex = 0;
	let direction: Direction = 'forward';

	// Subscribe to stores
	const unsubActive = activeStore.subscribe((value) => (activeStepIndex = value));
	const unsubDirection = directionStore.subscribe((value) => (direction = value));

	// Cleanup on destroy
	onDestroy(() => {
		unsubActive();
		unsubDirection();
		unregisterItem(itemId);
	});

	$: isActive = itemIndex === activeStepIndex;

	// Custom transition function that reads direction at transition time
	function slideTransition(node: HTMLElement, { isIn }: { isIn: boolean }) {
		const currentDirection = direction;
		const x = isIn
			? currentDirection === 'forward'
				? 80
				: -80
			: currentDirection === 'forward'
				? -80
				: 80;

		return {
			duration: isIn ? duration : duration * 0.5,
			delay: isIn ? duration * 0.3 : 0,
			easing: isIn ? cubicOut : cubicIn,
			css: (t: number) => {
				const eased = t;
				return `
					transform: translateX(${(1 - eased) * x}px);
					opacity: ${eased};
				`;
			}
		};
	}

	function fadeTransition(node: HTMLElement, { isIn }: { isIn: boolean }) {
		return {
			duration: isIn ? duration : duration * 0.5,
			delay: isIn ? duration * 0.3 : 0,
			easing: isIn ? cubicOut : cubicIn,
			css: (t: number) => `opacity: ${t}`
		};
	}

	function noTransition() {
		return { duration: 0, css: () => '' };
	}

	// Select transition based on type
	function transitionIn(node: HTMLElement) {
		if (transition === 'slide') return slideTransition(node, { isIn: true });
		if (transition === 'fade') return fadeTransition(node, { isIn: true });
		return noTransition();
	}

	function transitionOut(node: HTMLElement) {
		if (transition === 'slide') return slideTransition(node, { isIn: false });
		if (transition === 'fade') return fadeTransition(node, { isIn: false });
		return noTransition();
	}
</script>

{#if isActive}
	<div class="content-panel-item" in:transitionIn out:transitionOut>
		<slot />
	</div>
{/if}

<style>
	.content-panel-item {
		width: 100%;
	}
</style>
