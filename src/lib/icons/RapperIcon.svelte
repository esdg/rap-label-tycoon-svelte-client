<script lang="ts">
	import Tooltip from '$lib/components/Tooltip.svelte';

	let className = '';
	export { className as class };
</script>

<Tooltip position="right">
	<svg
		slot="trigger"
		xmlns="http://www.w3.org/2000/svg"
		fill="currentColor"
		viewBox="0 0 357.81 384.3"
		class={className}
	>
		<path
			d="M358.99,290.94c-0.74-33.31-0.17-168.3-0.13-202.47c0.69-48.87-40.44-90.09-89.37-88.81C209-0.81,148.51-0.51,88.02-0.42
	C38.07,0.19-1.66,39.69-1.04,90.03c-0.12,65.82-0.1,131.65,0.04,197.47c-3.14,46.2,32.71,92.08,79.98,95.04
	c13.12,0.85,26.31,0.73,39.46,0.76C202.3,378.68,358.23,415.09,358.99,290.94z M177.17,254.59c-13.23,17.96-26.86,35.63-39.62,53.91
	c-14.78,20.04-35.36,8.7-50.58-4.42c-6.74-5.75-8.28-15.17-4.52-23.26c17.5-37.08,34.1-74.35,52.13-111.2
	c24.89,14.21,49.23,28.1,73.93,42.2C197.81,226.44,187.53,240.54,177.17,254.59z M226.57,197.34c-6.07,2.78-11.21,2.55-17.19-0.97
	c-21.5-12.65-43.38-24.66-64.97-37.17c-9.45-8.63-6.97-26.35-4.68-38.74c37.07,20.84,73.43,41.28,110.25,61.98
	C243.24,189.42,235.02,193.48,226.57,197.34z M257.48,174.95c-38.04-21.31-75.67-42.39-114.07-63.91c2.36-3.83,4.51-7.32,7-11.37
	c38.02,21.26,75.67,42.32,113.89,63.69C261.98,167.3,259.84,170.94,257.48,174.95z M267.89,151.79
	c-36.6-20.55-73.18-41.08-110.09-61.8C203.67,38.56,288.81,90.74,267.89,151.79z"
		/>
	</svg>
	<p class="mb-1 font-bold text-white">🎤 Rapper</p>
	<p class="text-xs font-light normal-case">
		Performs vocals and represents the face of the project. Rappers write lyrics, record songs,
		build fanbases, and drive popularity. Their charisma, flow, and consistency directly impact
		streams, reputation, and chart success.
	</p>
</Tooltip>
