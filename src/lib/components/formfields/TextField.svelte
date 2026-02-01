<script lang="ts">
	export let label: string;
	export let id: string;
	export let inputType: 'text' | 'email' | 'password' | 'textarea' = 'text';
	export let value: string = '';
	export let placeholder: string = '';
	export let disabled: boolean = false;
	export let required: boolean = false;
	export let autocomplete: string | undefined = undefined;
	export let rows: number = 4;
</script>

<div class="relative">
	<label
		for={id}
		class="2xl:flex-row-reverse 2xl:w-24 2xl:h-10 mr-4 2xl:absolute 2xl:right-full block text-base font-medium mb-2 flex items-center text-right uppercase font-thin select-none"
	>
		{label}
	</label>
	{#if inputType === 'textarea'}
		<textarea
			{id}
			bind:value
			{disabled}
			{placeholder}
			{required}
			{rows}
			class="w-full px-4 py-2 bg-primary-950 border border-primary-200 rounded-md focus:outline-none focus:border-secondary-500 disabled:opacity-50 focus:bg-black"
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
			class="w-full px-4 py-2 bg-primary-950 border border-primary-200 rounded-md focus:outline-none focus:border-secondary-500 disabled:opacity-50 focus:bg-black"
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
			class="w-full px-4 py-2 bg-primary-950 border border-primary-200 rounded-md focus:outline-none focus:border-secondary-500 disabled:opacity-50 focus:bg-black"
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
			class="w-full px-4 py-2 bg-primary-950 border border-primary-200 rounded-md focus:outline-none focus:border-secondary-500 disabled:opacity-50 focus:bg-black"
		/>
	{/if}
</div>
