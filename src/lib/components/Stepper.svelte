<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	// Props
	export let padding: string = '8px';
	export let activeStepIndex: number = 0;
	export let buttonColor: string = '#e5e7eb';
	export let selectedButtonColor: string = '#3b82f6';
	export let textColor: string = '#6b7280';
	export let selectedTextColor: string = '#1f2937';
	export let stepLabels: string[] = [];

	const dispatch = createEventDispatcher<{ stepClicked: number }>();

	$: numberOfSteps = stepLabels.length;

	function handleStepClick(index: number) {
		dispatch('stepClicked', index);
	}

	// Calculate step width based on container and padding
	function getStepStyle(index: number) {
		// Calculate width: (100% - total padding) / numberOfSteps
		const totalPaddingPercent = numberOfSteps > 1 ? `${numberOfSteps - 1} * ${padding}` : '0px';
		const width = `calc((100% - (${numberOfSteps - 1} * ${padding})) / ${numberOfSteps})`;

		return `width: ${width};`;
	}
</script>

<div class="stepper-container w-full">
	<div class="flex items-end" style="gap: {padding};">
		{#each stepLabels as label, index}
			<div class="step-wrapper flex flex-col items-center" style={getStepStyle(index)}>
				<!-- Step Label -->
				<button
					type="button"
					on:click={() => handleStepClick(index)}
					class="text-xs mb-2 w-full text-center transition-colors cursor-pointer hover:opacity-80"
					style="color: {index === activeStepIndex ? selectedTextColor : textColor};"
				>
					{label}
				</button>

				<!-- Step Button/Bar -->
				<button
					type="button"
					on:click={() => handleStepClick(index)}
					class="w-full rounded transition-all cursor-pointer hover:opacity-90"
					style="height: 7px; background-color: {index === activeStepIndex
						? selectedButtonColor
						: buttonColor};"
					aria-label="Step {index + 1}: {label}"
					aria-current={index === activeStepIndex ? 'step' : undefined}
				/>
			</div>
		{/each}
	</div>
</div>

<style>
	.stepper-container {
		/* Container can be sized via parent/class */
	}

	.step-wrapper {
		/* Individual step wrapper */
	}
</style>
