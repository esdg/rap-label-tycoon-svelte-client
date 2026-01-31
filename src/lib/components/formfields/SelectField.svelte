<script lang="ts">
	let className = '';
	export { className as class };
	export let label: string;
	export let choices: Array<{ name: string; value: any; title?: string }>;
	export let mode: 'toggle' | 'multi' = 'toggle';
	export let value: any;
	export let defaultValue: any = undefined;
	export let labelFor: string | undefined = undefined;

	// Initialize default value only if value is undefined
	if (defaultValue !== undefined && (value === undefined || value === null)) {
		value = defaultValue;
	}

	function handleToggle(selectedValue: any) {
		if (mode === 'toggle') {
			value = selectedValue;
		} else {
			const newValue = new Set(value);
			if (newValue.has(selectedValue)) {
				newValue.delete(selectedValue);
			} else {
				newValue.add(selectedValue);
			}
			value = newValue;
		}
	}
</script>

<div class="relative {className}">
	<div
		class="2xl:flex-row-reverse 2xl:w-24 2xl:h-10 mr-4 2xl:absolute 2xl:right-full block flex items-center text-right"
	>
		<label
			for={labelFor}
			class="text-base font-medium mb-2 uppercase tracking-wider uppercase font-thin
			select-none"
		>
			{label}
			{#if mode === 'multi'}
				<span class="text-xs text-primary-300 normal-case">(multi-select)</span>
			{/if}
		</label>
	</div>
	<div class="flex flex-wrap gap-1">
		{#each choices as choice, index}
			{@const selected =
				mode === 'toggle'
					? value === choice.value
					: value instanceof Set && value.has(choice.value)}
			<button
				id={index === 0 && labelFor ? labelFor : undefined}
				class=" pt-1 pb-1 px-4 min-w-32 border rounded transition-all duration-200 font-medium text-sm uppercase font-thin select-none
					{selected
					? 'border-secondary-600 text-white shadow-sm'
					: 'border-gray-700 text-white hover:border-secondary-600 hover:shadow-sm'}"
				on:click={() => handleToggle(choice.value)}
				title={choice.title}
			>
				{choice.name}
			</button>
		{/each}
	</div>
</div>
