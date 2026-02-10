<script lang="ts">
	import FormLabel from './FormLabel.svelte';

	export let label: string;
	export let id: string;
	export let inputType: 'text' | 'email' | 'password' | 'textarea' = 'text';
	export let value: string = '';
	export let placeholder: string = '';
	export let disabled: boolean = false;
	export let required: boolean = false;
	export let autocomplete: string | undefined = undefined;
	export let rows: number = 4;
	export let maxlength: number | undefined = undefined;
</script>

<div class="relative">
	<FormLabel {id}>{label}</FormLabel>
	{#if inputType === 'textarea'}
		<textarea
			{id}
			bind:value
			{disabled}
			{placeholder}
			{required}
			{rows}
			{maxlength}
			class="w-full rounded-md border border-primary-200 bg-primary-950 px-4 py-2 focus:border-secondary-500 focus:bg-black focus:outline-none focus:ring-2 focus:ring-secondary-500 disabled:opacity-50"
		/>
	{:else if inputType === 'email'}
		<input
			{id}
			type="email"
			bind:value
			{disabled}
			{placeholder}
			{required}
			{autocomplete}
			{maxlength}
			class="w-full rounded-md border border-primary-200 bg-primary-950 px-4 py-2 focus:border-secondary-500 focus:bg-black focus:outline-none focus:ring-2 focus:ring-secondary-500 disabled:opacity-50"
		/>
	{:else if inputType === 'password'}
		<input
			{id}
			type="password"
			bind:value
			{disabled}
			{placeholder}
			{required}
			{autocomplete}
			{maxlength}
			class="w-full rounded-md border border-primary-200 bg-primary-950 px-4 py-2 focus:border-secondary-500 focus:bg-black focus:outline-none focus:ring-2 focus:ring-secondary-500 disabled:opacity-50"
		/>
	{:else}
		<input
			{id}
			type="text"
			bind:value
			{disabled}
			{placeholder}
			{required}
			{autocomplete}
			{maxlength}
			class="w-full rounded-md border border-primary-200 bg-primary-950 px-4 py-2 focus:border-secondary-500 focus:bg-black focus:outline-none focus:ring-2 focus:ring-secondary-500 disabled:opacity-50"
		/>
	{/if}
</div>
