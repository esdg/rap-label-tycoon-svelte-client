<script lang="ts">
	export let data: Record<string, any> | undefined = undefined;
</script>

<!-- Example Modal 1 Content -->
<div class="space-y-4">
	<p class="text-gray-600">
		This is the content for Example Modal 1. You can add any content here such as forms, text,
		images, or other interactive elements.
	</p>

	{#if data}
		<div class="rounded-md bg-blue-50 p-3">
			<p class="text-sm text-blue-900">
				<strong>Passed Data:</strong>
				{JSON.stringify(data, null, 2)}
			</p>
		</div>
	{/if}

	<div class="flex gap-2 pt-4">
		<button
			class="flex-1 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition-colors"
		>
			Primary Action
		</button>
		<button
			class="flex-1 rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
		>
			Secondary Action
		</button>
	</div>
</div>
