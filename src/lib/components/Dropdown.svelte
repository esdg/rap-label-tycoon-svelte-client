<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { clickOutside } from '$lib/utils/clickOutside';

	// Props
	let className = '';
	export { className as class };
	export let options: Array<{ name: string; value: any; disabled?: boolean }> = [];
	export let value: any = null;
	export let placeholder: string = 'Select an option';
	export let disabled: boolean = false;
	export let searchable: boolean = false;
	export let label: string = '';
	export let direction: 'up' | 'down' = 'down';

	const dispatch = createEventDispatcher<{ change: any }>();

	let isOpen = false;
	let searchQuery = '';
	let dropdownElement: HTMLDivElement;
	let searchInput: HTMLInputElement;
	let dropdownId = `dropdown-${Math.random().toString(36).substr(2, 9)}`;

	$: selectedOption = options.find((opt) => opt.value === value);
	$: displayText = selectedOption?.name || placeholder;

	$: filteredOptions =
		searchable && searchQuery
			? options.filter((opt) => opt.name.toLowerCase().includes(searchQuery.toLowerCase()))
			: options;

	function toggleDropdown() {
		if (disabled) return;
		isOpen = !isOpen;
		searchQuery = '';

		if (isOpen && searchable) {
			setTimeout(() => searchInput?.focus(), 50);
		}
	}

	function selectOption(option: any) {
		if (option.disabled) return;
		value = option.value;
		dispatch('change', option.value);
		isOpen = false;
		searchQuery = '';
	}

	function handleClickOutside() {
		isOpen = false;
		searchQuery = '';
	}

	function handleKeydown(event: KeyboardEvent, option: any) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			selectOption(option);
		}
	}
</script>

{#if label}
	<label
		for={dropdownId}
		class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2"
	>
		{label}
	</label>
{/if}

<div
	class="relative w-full {className}"
	use:clickOutside
	on:click_outside={handleClickOutside}
	bind:this={dropdownElement}
	role="button"
	tabindex="-1"
>
	<!-- Dropdown Button -->
	<button
		id={dropdownId}
		type="button"
		on:click={toggleDropdown}
		{disabled}
		class="h-8 lg:h-10 xl:h-12 px-4 lg:px-5 xl:px-6 min-w-32 lg:min-w-40 xl:min-w-48 border rounded-lg text-left flex items-center justify-between
			transition-all duration-200 text-sm lg:text-base xl:text-lg font-medium font-thin select-none
			{disabled
			? 'bg-gray-900 border-gray-700 text-gray-300 cursor-not-allowed'
			: isOpen
				? 'border-secondary-600 ring-2 ring-secondary-600 shadow-sm'
				: 'border-gray-700 hover:border-secondary-600 hover:shadow-sm'}"
		aria-haspopup="listbox"
		aria-expanded={isOpen}
	>
		<span
			class="block truncate {selectedOption && !disabled ? 'text-white' : 'text-gray-400'}"
			title={displayText}
		>
			{displayText}
		</span>
		<svg
			class="w-5 h-5 lg:w-6 lg:h-6 xl:w-7 xl:h-7 transition-transform duration-200 {isOpen &&
			direction === 'down'
				? 'rotate-180'
				: isOpen && direction === 'up'
					? 'rotate-0'
					: direction === 'up'
						? 'rotate-180'
						: ''} {!disabled ? 'text-white' : 'text-gray-500'}"
			fill="none"
			stroke="currentColor"
			viewBox="0 0 24 24"
		>
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
		</svg>
	</button>

	<!-- Dropdown Menu -->
	{#if isOpen}
		<div
			class="absolute z-50 w-full bg-primary-950 border border-gray-200 rounded-lg shadow-lg
				{direction === 'up' ? 'bottom-full mb-1 animate-in-up' : 'mt-1 animate-in-down'}"
		>
			<!-- Search Input -->
			{#if searchable}
				<div class="p-2 border-b border-gray-200">
					<input
						bind:this={searchInput}
						bind:value={searchQuery}
						type="text"
						placeholder="Search..."
						class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm
							focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
					/>
				</div>
			{/if}

			<!-- Options List -->
			<div class="max-h-60 overflow-y-auto py-1" role="listbox">
				{#if filteredOptions.length === 0}
					<div class="px-4 py-3 text-sm text-gray-500 text-center">No options found</div>
				{:else}
					{#each filteredOptions as option}
						{@const isSelected = value === option.value}
						<button
							type="button"
							role="option"
							aria-selected={isSelected}
							disabled={option.disabled}
							on:click={() => selectOption(option)}
							on:keydown={(e) => handleKeydown(e, option)}
							class="w-full px-4 py-2.5 text-left text-sm flex items-center justify-between font-thin
								transition-colors duration-150
								{option.disabled
								? 'text-gray-400 cursor-not-allowed'
								: isSelected
									? 'text-primary-500 font-medium'
									: 'text-white hover:bg-primary-500 hover:text-white cursor-pointer'}"
						>
							<span class="block truncate" title={option.name}>
								{option.name}
							</span>
							{#if isSelected}
								<svg class="w-5 h-5 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
									<path
										fill-rule="evenodd"
										d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
										clip-rule="evenodd"
									/>
								</svg>
							{/if}
						</button>
					{/each}
				{/if}
			</div>
		</div>
	{/if}
</div>

<style>
	@keyframes slide-in-from-top {
		from {
			opacity: 0;
			transform: translateY(-8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@keyframes slide-in-from-bottom {
		from {
			opacity: 0;
			transform: translateY(8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.animate-in-down {
		animation: slide-in-from-top 0.2s ease-out;
	}

	.animate-in-up {
		animation: slide-in-from-bottom 0.2s ease-out;
	}
</style>
