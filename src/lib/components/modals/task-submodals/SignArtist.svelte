<script lang="ts">
	import Button from '$lib/components/Button.svelte';
</script>

<section class="task-modal__section" aria-label="Sign Artist">
	<h2 class="task-modal__title">Sign Artist</h2>
	<div class="task-modal__actions">
		<Button color="indigo" style="normal" altText="Execute primary action" on:clicked={() => {}}>
			Primary Action
		</Button>
		<Button color="gray" style="hollow" altText="Execute secondary action" on:clicked={() => {}}>
			Secondary Action
		</Button>
	</div>
</section>
