<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	let className = '';
	export { className as class };
	export let color: string = 'indigo'; // Background color theme
	export let style: 'normal' | 'hollow' = 'normal'; // Button style
	export let text: string = 'Button'; // Button text
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
		indigo: 'bg-indigo-600 text-white hover:bg-indigo-700 border-indigo-600',
		blue: 'bg-primary-500 text-white hover:bg-primary-600 border-primary-600',
		green: 'bg-green-600 text-white hover:bg-green-700 border-green-600',
		red: 'bg-red-600 text-white hover:bg-red-700 border-red-600',
		gray: 'bg-gray-600 text-white hover:bg-gray-700 border-gray-600'
	};

	// Color mapping for hollow style
	const hollowColorMap: Record<string, string> = {
		indigo: 'bg-white text-indigo-600 border-indigo-300 hover:border-indigo-400 hover:bg-indigo-50',
		blue: 'bg-white text-primary-600 border-primary-300 hover:border-primary-400 hover:bg-primary-50',
		green: 'bg-white text-green-600 border-green-300 hover:border-green-400 hover:bg-green-50',
		red: 'bg-white text-red-600 border-red-300 hover:border-red-400 hover:bg-red-50',
		gray: 'bg-white text-gray-800 border-gray-300 hover:border-gray-400 hover:bg-gray-50'
	};

	$: baseClasses =
		'px-6 py-3 rounded-md font-semibold text-base border transition-all duration-200';
	$: widthClass = fullWidth ? 'w-full' : '';
	$: colorClasses =
		style === 'normal'
			? normalColorMap[color] || normalColorMap.indigo
			: hollowColorMap[color] || hollowColorMap.gray;
	$: stateClasses =
		disabled || loading ? 'cursor-not-allowed opacity-50' : 'hover:shadow-lg active:scale-95';
	$: loadingClass = loading ? 'cursor-wait' : '';
</script>

<button
	on:click={handleClick}
	class="{baseClasses} {colorClasses} {stateClasses} {loadingClass} {widthClass} {className} uppercase font-normal select-none"
	{disabled}
	aria-label={altText || text}
	type="button"
>
	{text}
</button>
