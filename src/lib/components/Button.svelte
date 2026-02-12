<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	let className = '';
	export { className as class };
	export let color: string = 'indigo'; // Background color theme
	export let style: 'normal' | 'hollow' = 'normal'; // Button style
	export let altText: string = ''; // Alternative text for accessibility
	export let disabled: boolean = false; // Disabled state
	export let loading: boolean = false; // Loading state
	export let fullWidth: boolean = false; // Full width button

	const dispatch = createEventDispatcher<{ clicked: void }>();

	function handleClick() {
		if (!disabled && !loading) {
			dispatch('clicked');
		}
	}

	// Color mapping for normal style
	const normalColorMap: Record<string, string> = {
		primary: 'bg-primary-500 text-white hover:bg-primary-600 border-primary-600',
		secondary: 'bg-secondary-500 text-white hover:bg-secondary-600 border-secondary-600',
		gray: 'bg-gray-600 text-white hover:bg-gray-700 border-gray-600',
		groupNavigation:
			'bg-gray-900 text-white hover:border-primary-500 border-gray-600 hover:!border-l-primary-500 font-thin',
		groupNavigationActive:
			'bg-gray-900 text-white border-primary-500 !border-l-primary-500 font-thin'
	};

	// Color mapping for hollow style
	const hollowColorMap: Record<string, string> = {
		primary: 'text-gray-200 border-gray-200 hover:border-primary-400 hover:text-primary-500',
		secondary: 'text-gray-500 border-gray-500 hover:border-secondary-400 hover:text-secondary-500',
		gray: 'text-gray-800 border-gray-300 hover:border-gray-400 hover:bg-gray-50',
		groupNavigation:
			'bg-gray-900 text-white hover:border-primary-500 border-gray-600 hover:!border-l-primary-500 font-thin',
		groupNavigationActive:
			'bg-gray-900 text-white border-primary-500 !border-l-primary-500 font-thin'
	};

	$: baseClasses =
		'px-6 py-3 lg:px-8 lg:py-3 xl:px-10 rounded-md font-semibold text-base border transition-all duration-200';
	$: widthClass = fullWidth ? 'w-full' : '';
	$: colorClasses =
		style === 'normal'
			? normalColorMap[color] || normalColorMap.indigo
			: hollowColorMap[color] || hollowColorMap.gray;
	$: stateClasses =
		disabled || loading ? 'cursor-not-allowed opacity-50' : 'hover:shadow-lg active:scale-95';
	$: loadingClass = loading ? 'cursor-wait' : '';
	$: ariaLabel = altText || undefined; // Allow native label from slot text when altText is empty
</script>

<button
	on:click={handleClick}
	class="{baseClasses} {colorClasses} {stateClasses} {loadingClass} {widthClass} {className} select-none font-normal uppercase"
	{disabled}
	aria-label={ariaLabel}
	type="button"
>
	<slot>Button</slot>
</button>
