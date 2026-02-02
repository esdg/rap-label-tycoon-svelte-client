<script lang="ts" context="module">
	export type SelectGroupChoice = 0 | 1;
</script>

<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	type SelectGroupChoice = 0 | 1;

	export let selected: SelectGroupChoice = 0;
	export let disabled = false;

	const dispatch = createEventDispatcher<{ change: { selected: SelectGroupChoice } }>();

	const select = (choice: SelectGroupChoice) => {
		if (disabled) return;
		if (selected === choice) return;
		selected = choice;
		dispatch('change', { selected });
	};

	const onKeydown = (choice: SelectGroupChoice, event: KeyboardEvent) => {
		if (disabled) return;
		const isActivateKey = event.key === 'Enter' || event.key === ' ';
		if (isActivateKey) {
			event.preventDefault();
			select(choice);
		}
	};
</script>

<div
	class="flex flex-col md:flex-row items-center gap-4 md:gap-6"
	role="radiogroup"
	aria-disabled={disabled}
>
	<div
		class="choice flex-1 bg-primary-950 border border-primary-200 rounded-xl px-6 py-5 min-h-[12rem] cursor-pointer transition duration-150 ease-out text-primary-100 outline-none focus-visible:outline focus-visible:outline-[2px] focus-visible:outline-secondary-300 focus-visible:outline-offset-2"
		class:border-secondary-400={selected === 0}
		class:selected={selected === 0}
		class:inactive={selected !== 0}
		role="radio"
		aria-checked={selected === 0}
		tabindex={disabled ? -1 : 0}
		on:click={() => select(0)}
		on:keydown={(event) => onKeydown(0, event)}
	>
		<fieldset
			disabled={disabled || selected !== 0}
			class:opacity-60={disabled || selected !== 0}
			class="border-0 p-0 m-0 min-h-full"
		>
			<slot name="left"></slot>
		</fieldset>
	</div>

	<div
		class="divider text-primary-200 text-sm tracking-widest uppercase select-none text-center px-2"
		aria-hidden="true"
	>
		- OR -
	</div>

	<div
		class="choice flex-1 bg-primary-950 border border-primary-200 rounded-xl px-6 py-5 min-h-[12rem] cursor-pointer transition duration-150 ease-out text-primary-100 outline-none focus-visible:outline focus-visible:outline-[2px] focus-visible:outline-secondary-300 focus-visible:outline-offset-2"
		class:border-secondary-400={selected === 1}
		class:selected={selected === 1}
		class:inactive={selected !== 1}
		role="radio"
		aria-checked={selected === 1}
		tabindex={disabled ? -1 : 0}
		on:click={() => select(1)}
		on:keydown={(event) => onKeydown(1, event)}
	>
		<fieldset
			disabled={disabled || selected !== 1}
			class:opacity-60={disabled || selected !== 1}
			class="border-0 p-0 m-0 min-h-full"
		>
			<slot name="right"></slot>
		</fieldset>
	</div>
</div>
