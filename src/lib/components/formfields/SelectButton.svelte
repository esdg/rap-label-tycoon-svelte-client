<script lang="ts">
	export let label: string;
	export let value: any;
	export let selected: boolean = false;
	export let disabled: boolean = false;
	export let title: string | undefined = undefined;
	export let id: string | undefined = undefined;
</script>

<button
	{id}
	class="px-5 py-2.5 border rounded transition-all duration-200 font-medium text-sm
		{selected
		? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
		: 'bg-white border-gray-300 text-gray-700 hover:border-indigo-500 hover:text-indigo-600 hover:shadow-sm'}
		{disabled ? 'opacity-75 cursor-not-allowed' : ''}"
	on:click
	{disabled}
	{title}
>
	{label}
</button>
