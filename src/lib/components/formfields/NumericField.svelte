<script lang="ts">
	import FormLabel from './FormLabel.svelte';

	export let label: string;
	export let id: string;
	export let value: number | null = null;
	export let placeholder = '';
	export let disabled = false;
	export let required = false;
	export let min: number | undefined = undefined;
	export let max: number | undefined = undefined;
	export let step = 1;
	export let suffix: string | null = null;

	const formatValue = (val: number | null) => (val === null ? '' : val);

	const clamp = (next: number) => {
		if (min !== undefined && next < min) return min;
		if (max !== undefined && next > max) return max;
		return next;
	};

	const handleInput = (event: Event) => {
		const target = event.currentTarget as HTMLInputElement;
		const nextValue = target.value === '' ? null : target.valueAsNumber;
		value = Number.isNaN(nextValue) ? null : nextValue;
	};

	const increment = (delta: number) => {
		if (disabled) return;
		const base = value === null ? 0 : value;
		value = clamp(base + delta);
	};
</script>

<div class="relative">
	<FormLabel {id}>{label}</FormLabel>

	<div class="relative">
		<input
			{id}
			type="number"
			class="w-full h-11 px-4 pr-16 bg-primary-950 border border-primary-200 rounded-md focus:outline-none focus:border-secondary-500 focus:bg-black disabled:opacity-50 disabled:cursor-not-allowed"
			value={formatValue(value)}
			{placeholder}
			{required}
			{disabled}
			{min}
			{max}
			{step}
			on:input={handleInput}
			inputmode="decimal"
		/>

		{#if suffix}
			<span
				class="absolute inset-y-0 right-12 flex items-center text-sm text-primary-100 select-none"
			>
				{suffix}
			</span>
		{/if}

		<div class="absolute inset-y-0 right-0 w-11 border-l border-primary-200 flex flex-col">
			<button
				type="button"
				class="flex-1 flex items-center justify-center text-primary-100 hover:text-secondary-500 disabled:text-primary-500 disabled:cursor-not-allowed"
				on:click={() => increment(step)}
				{disabled}
				aria-label="Increase value"
			>
				<span class="triangle triangle-up" aria-hidden="true"></span>
			</button>
			<button
				type="button"
				class="flex-1 flex items-center justify-center text-primary-100 hover:text-secondary-500 disabled:text-primary-500 disabled:cursor-not-allowed"
				on:click={() => increment(-step)}
				{disabled}
				aria-label="Decrease value"
			>
				<span class="triangle triangle-down" aria-hidden="true"></span>
			</button>
		</div>
	</div>
</div>

<style>
	input[type='number']::-webkit-inner-spin-button,
	input[type='number']::-webkit-outer-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}

	input[type='number'] {
		-moz-appearance: textfield;
	}

	.triangle {
		width: 0;
		height: 0;
		border-left: 6px solid transparent;
		border-right: 6px solid transparent;
	}

	.triangle-up {
		border-bottom: 8px solid currentColor;
	}

	.triangle-down {
		border-top: 8px solid currentColor;
	}
</style>
