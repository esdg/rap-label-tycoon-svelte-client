<script lang="ts">
	export let value: number = 0; // 0 to 100
	export let strokeWidth: number = 5;
	export let progressClass: string = 'stroke-blue-500'; // Tailwind class for progress color
	export let backgroundClass: string = 'stroke-gray-700'; // Tailwind class for background track

	// Optional gradient configuration
	export let useGradient: boolean = false;
	export let gradientFrom: string = '#8b5cf6'; // purple-500
	export let gradientTo: string = '#ec4899'; // pink-500
	export let gradientId: string = `gradient-${Math.random().toString(36).substr(2, 9)}`;

	// Clamp value between 0 and 100
	$: clampedValue = Math.max(0, Math.min(100, value));

	// SVG circle calculations
	const size = 100; // SVG viewBox size
	const center = size / 2;
	const radius = (size - strokeWidth) / 2;
	const circumference = 2 * Math.PI * radius;

	// Calculate stroke-dashoffset based on progress (starts from top, goes clockwise)
	$: strokeDashoffset = circumference - (clampedValue / 100) * circumference;
</script>

<div class="relative w-40 h-40 aspect-square">
	<svg
		viewBox="0 0 {size} {size}"
		class="w-full h-full -rotate-90"
		xmlns="http://www.w3.org/2000/svg"
	>
		<!-- Gradient definition -->
		{#if useGradient}
			<defs>
				<linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
					<stop offset="0%" style="stop-color:{gradientFrom};stop-opacity:1" />
					<stop offset="100%" style="stop-color:{gradientTo};stop-opacity:1" />
				</linearGradient>
			</defs>
		{/if}

		<!-- Background circle -->
		<circle
			cx={center}
			cy={center}
			r={radius}
			fill="none"
			stroke-width={strokeWidth}
			class={backgroundClass}
		/>

		<!-- Progress circle -->
		<circle
			cx={center}
			cy={center}
			r={radius}
			fill="none"
			stroke-width={strokeWidth}
			stroke-dasharray={circumference}
			stroke-dashoffset={strokeDashoffset}
			stroke-linecap="round"
			class={useGradient ? '' : progressClass}
			stroke={useGradient ? `url(#${gradientId})` : undefined}
		/>
	</svg>

	<!-- Center content slot -->
	<div class="absolute inset-0 flex items-center justify-center">
		<slot />
	</div>
</div>
