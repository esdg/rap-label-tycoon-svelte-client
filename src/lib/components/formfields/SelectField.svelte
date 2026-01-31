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

<div class="flex flex-col gap-3 {className}">
	<label
		class="text-xs font-semibold text-gray-600 uppercase tracking-wider uppercase font-thin select-none"
		for={labelFor}
	>
		{label}
		{#if mode === 'multi'}
			<span class="text-gray-500 normal-case">(multi-select)</span>
		{/if}
	</label>
	<div class="flex flex-wrap gap-2">
		{#each choices as choice, index}
			{@const selected =
				mode === 'toggle'
					? value === choice.value
					: value instanceof Set && value.has(choice.value)}
			<button
				id={index === 0 && labelFor ? labelFor : undefined}
				class="px-5 py-2.5 border rounded transition-all duration-200 font-medium text-sm uppercase font-thin select-none
					{selected
					? 'bg-primary-600 border-primary-600 text-white shadow-sm'
					: 'border-primary-500 text-primary-500 hover:border-primary-600 hover:text-primary-600 hover:shadow-sm'}"
				on:click={() => handleToggle(choice.value)}
				title={choice.title}
			>
				{choice.name}
			</button>
		{/each}
	</div>
</div>
