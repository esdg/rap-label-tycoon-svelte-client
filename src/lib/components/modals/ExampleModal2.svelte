<script lang="ts">
	import Button from '$lib/components/Button.svelte';

	export let data: Record<string, any> | undefined = undefined;
</script>

<!-- Example Modal 2 Content -->
<div class="space-y-4">
	<p class="text-gray-600">
		This is the content for Example Modal 2. Each modal can have completely different content and
		functionality.
	</p>

	{#if data}
		<div class="rounded-md bg-green-50 p-3">
			<p class="text-sm text-green-900">
				<strong>Passed Data:</strong>
				{JSON.stringify(data, null, 2)}
			</p>
		</div>
	{/if}

	<div class="flex gap-2 pt-4">
		<Button
			color="green"
			style="normal"
			text="Confirm"
			altText="Confirm action"
			fullWidth={true}
			on:clicked={() => {}}
		/>
		<Button
			color="gray"
			style="hollow"
			text="Cancel"
			altText="Cancel action"
			fullWidth={true}
			on:clicked={() => {}}
		/>
	</div>
</div>
