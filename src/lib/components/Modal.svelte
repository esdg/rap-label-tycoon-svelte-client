<script lang="ts">
	import { modalStore } from '$lib/stores/modal';
	import TaskModal from './modals/TaskModal.svelte';
	import ExampleModal2 from './modals/ExampleModal2.svelte';

	// Get the current modal state from the store
	let modalState = $modalStore;

	// Subscribe to store changes
	$: modalState = $modalStore;

	/**
	 * Close modal when clicking on the backdrop
	 */
	const handleBackdropClick = (e: MouseEvent) => {
		if (e.target === e.currentTarget) {
			modalStore.close();
		}
	};
</script>

<!-- Modal container - only render if a modal is open -->
{#if modalState.isOpen && modalState.type}
	<!-- Backdrop with fade animation -->
	<div
		class="fixed inset-0 z-40 bg-black bg-opacity-50 transition-opacity duration-300"
		on:click={handleBackdropClick}
		role="button"
		tabindex="0"
		on:keydown={(e) => e.key === 'Escape' && modalStore.close()}
	/>

	<!-- Modal container -->
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
		{#if modalState.type === 'task-modal'}
			<div
				class="task-modal-shell relative w-full bg-white shadow-lg transition-all duration-300 animate-in fade-in zoom-in-95"
				role="dialog"
				aria-modal="true"
				aria-label="Task modal"
			>
				<TaskModal data={modalState.data} />
			</div>
		{:else}
			<div
				class="relative w-full max-w-md rounded-lg bg-white shadow-lg transition-all duration-300 animate-in fade-in zoom-in-95"
				role="dialog"
				aria-modal="true"
				aria-label="Application modal"
			>
				<!-- Modal header with close button -->
				<div class="flex items-center justify-between border-b border-gray-200 px-6 py-4">
					<h2 class="text-xl font-semibold text-gray-900">
						{#if modalState.type === 'example2'}
							Example Modal 2
						{/if}
					</h2>
					<button
						on:click={() => modalStore.close()}
						class="text-gray-400 hover:text-gray-600 transition-colors"
						aria-label="Close modal"
					>
						<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>
				</div>

				<!-- Modal content - dynamically rendered based on type -->
				<div class="px-6 py-4">
					{#if modalState.type === 'example2'}
						<ExampleModal2 data={modalState.data} />
					{/if}
				</div>
			</div>
		{/if}
	</div>
{/if}

<style global>
	@keyframes in {
		from {
			opacity: 0;
			transform: scale(0.95);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}

	.animate-in {
		animation: in 0.3s ease-out;
	}

	.fade-in {
		animation: fadeIn 0.3s ease-out;
	}

	.zoom-in-95 {
		animation: zoomIn95 0.3s ease-out;
	}

	.task-modal-shell {
		--task-scale: min(calc(100vw / 1920), calc(100vh / 1080));
		width: min(1408px, calc(100vw - 2rem));
		height: min(704px, calc(100vh - 2rem));
		overflow: hidden;
		border-radius: 9px;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes zoomIn95 {
		from {
			transform: scale(0.95);
		}
		to {
			transform: scale(1);
		}
	}
</style>
