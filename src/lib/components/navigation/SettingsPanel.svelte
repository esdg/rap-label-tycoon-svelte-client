<script lang="ts">
	import { XMarkIcon, UserIcon, BuildingOfficeIcon } from 'heroicons-svelte/24/outline';
	import { fly } from 'svelte/transition';

	export let isOpen: boolean = false;
	export let onClose: () => void;
</script>

{#if isOpen}
	<!-- Backdrop -->
	<div
		class="fixed inset-0 z-40 bg-black bg-opacity-50"
		on:click={onClose}
		on:keydown={(e) => e.key === 'Escape' && onClose()}
		role="button"
		tabindex="0"
		aria-label="Close settings panel"
	/>

	<!-- Settings Panel -->
	<div
		class="fixed right-0 top-0 z-50 flex h-full w-80 flex-col bg-gray-900 shadow-xl"
		transition:fly={{ x: 320, duration: 300 }}
	>
		<!-- Header -->
		<div class="flex items-center justify-between border-b border-gray-700 px-6 py-4">
			<h2 class="text-xl font-semibold text-white">Settings</h2>
			<button
				on:click={onClose}
				class="rounded-lg p-1 text-gray-400 hover:bg-gray-800 hover:text-white"
				aria-label="Close"
			>
				<XMarkIcon class="h-6 w-6" />
			</button>
		</div>

		<!-- Settings Options -->
		<div class="flex-1 overflow-y-auto px-4 py-4">
			<nav class="space-y-2">
				<!-- Edit Player Profile -->
				<a
					href="/users/edit"
					class="flex items-center gap-3 rounded-lg px-4 py-3 text-gray-200 transition-colors hover:bg-gray-800 hover:text-white"
					on:click={onClose}
				>
					<UserIcon class="h-5 w-5" />
					<div>
						<p class="font-medium">Edit Player Profile</p>
						<p class="text-sm text-gray-400">Update your username and settings</p>
					</div>
				</a>

				<!-- Edit Label Information -->
				<a
					href="/labels/edit"
					class="flex items-center gap-3 rounded-lg px-4 py-3 text-gray-200 transition-colors hover:bg-gray-800 hover:text-white"
					on:click={onClose}
				>
					<BuildingOfficeIcon class="h-5 w-5" />
					<div>
						<p class="font-medium">Edit Label Information</p>
						<p class="text-sm text-gray-400">Update label name and description</p>
					</div>
				</a>
			</nav>
		</div>
	</div>
{/if}
