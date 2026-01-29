<script lang="ts">
	import Button from '$lib/components/Button.svelte';
</script>

<section class="task-modal__section" aria-label="Sign Artist">
	<h2 class="task-modal__title">Sign Artist</h2>
	<div class="task-modal__actions">
		<Button
			color="indigo"
			style="normal"
			text="Primary Action"
			altText="Execute primary action"
			on:clicked={() => {}}
		/>
		<Button
			color="gray"
			style="hollow"
			text="Secondary Action"
			altText="Execute secondary action"
			on:clicked={() => {}}
		/>
	</div>
</section>
