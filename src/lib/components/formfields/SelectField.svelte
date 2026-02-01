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
			class="text-base lg:text-lg xl:text-xl font-medium mb-2 uppercase tracking-wider uppercase font-thin
			select-none"
		>
			{label}
			{#if mode === 'multi'}
				<span class="text-xs lg:text-sm xl:text-base text-primary-300 normal-case"
					>(multi-select)</span
				>
			{/if}
		</label>
	</div>
	<div class="flex flex-wrap gap-y-2 lg:gap-y-3 xl:gap-y-4 gap-x-1 lg:gap-x-2 xl:gap-x-3">
		{#each choices as choice, index}
			{@const selected =
				mode === 'toggle'
					? value === choice.value
					: value instanceof Set && value.has(choice.value)}
			<button
				id={index === 0 && labelFor ? labelFor : undefined}
				class="h-8 lg:h-10 xl:h-12 px-4 lg:px-6 xl:px-8 min-w-32 lg:min-w-36 xl:min-w-44 border rounded transition-all duration-200 font-medium text-sm lg:text-base xl:text-lg uppercase font-thin select-none flex items-center justify-center
					{selected
					? 'border-secondary-600 text-white shadow-sm'
					: 'border-gray-700 text-white hover:border-secondary-600 hover:shadow-sm'}"
				on:click={() => handleToggle(choice.value)}
				title={choice.title}
			>
				<span class="relative top-[1px]">{choice.name}</span>
			</button>
		{/each}
	</div>
</div>
