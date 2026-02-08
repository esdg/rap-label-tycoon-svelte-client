<script lang="ts">
	import { errorNotifications } from '$lib/stores/errorNotifications';
	import { fly, fade } from 'svelte/transition';
	import { flip } from 'svelte/animate';

	function dismiss(id: string) {
		errorNotifications.dismiss(id);
	}
</script>

<!-- Error notifications container -->
<div class="pointer-events-none fixed right-4 top-4 z-[9999] flex max-w-md flex-col gap-3">
	{#each $errorNotifications as notification (notification.id)}
		<div
			class="pointer-events-auto rounded-lg border-l-4 border-red-500 bg-red-50 p-4 shadow-lg"
			in:fly={{ x: 300, duration: 300 }}
			out:fade={{ duration: 200 }}
			animate:flip={{ duration: 200 }}
		>
			<div class="flex items-start gap-3">
				<!-- Error icon -->
				<div class="flex-shrink-0">
					<svg
						class="h-5 w-5 text-red-500"
						fill="currentColor"
						viewBox="0 0 20 20"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							fill-rule="evenodd"
							d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
							clip-rule="evenodd"
						/>
					</svg>
				</div>

				<!-- Content -->
				<div class="min-w-0 flex-1">
					<h3 class="text-sm font-medium text-red-800">
						{notification.title}
					</h3>
					<p class="mt-1 text-sm text-red-700">
						{notification.message}
					</p>
				</div>

				<!-- Dismiss button -->
				<button
					type="button"
					class="flex-shrink-0 text-red-400 transition-colors hover:text-red-600"
					on:click={() => dismiss(notification.id)}
					aria-label="Dismiss notification"
				>
					<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
							clip-rule="evenodd"
						/>
					</svg>
				</button>
			</div>
		</div>
	{/each}
</div>
