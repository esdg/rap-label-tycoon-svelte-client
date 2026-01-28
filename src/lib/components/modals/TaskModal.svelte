<script lang="ts">
	import { modalStore } from '$lib/stores/modal';
	import ScoutTalents from './task-submodals/ScoutTalents.svelte';
	import SignArtist from './task-submodals/SignArtist.svelte';

	export let data: Record<string, any> | undefined = undefined;

	const DEFAULT_IMAGE_URL =
		'https://res.cloudinary.com/dig430oem/image/upload/v1769554993/artists/profile_images/fpuc64oh9s5w8uoc9u5s.jpg';

	const VALID_SUBMODALS = new Set(['scout', 'sign']);

	$: imageUrl = (data?.imageUrl as string | undefined) ?? DEFAULT_IMAGE_URL;
	$: activeSubModal = VALID_SUBMODALS.has((data?.subModal as string | undefined) ?? '')
		? (data?.subModal as string)
		: 'scout';
</script>

<div class="task-modal">
	<div
		class="task-modal__image"
		style="background-image: url({imageUrl});"
		aria-hidden="true"
	></div>

	<div class="task-modal__content">
		<button
			class="task-modal__close"
			on:click={() => modalStore.close()}
			aria-label="Close task modal"
		>
			<svg class="task-modal__close-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M6 18L18 6M6 6l12 12"
				/>
			</svg>
		</button>

		<div class="task-modal__panel" role="region" aria-live="polite">
			{#if activeSubModal === 'sign'}
				<SignArtist />
			{:else}
				<ScoutTalents />
			{/if}
		</div>
	</div>
</div>

<style>
	.task-modal {
		display: flex;
		height: 100%;
		width: 100%;
		background: white;
		border-radius: 9px;
		overflow: hidden;
	}

	.task-modal__image {
		flex: 0 0 448px;
		width: 448px;
		max-width: 448px;
		height: 100%;
		overflow: hidden;
		background-color: #111827;
		background-size: cover;
		background-position: center;
		background-repeat: no-repeat;
	}

	.task-modal__content {
		flex: 1;
		display: flex;
		flex-direction: column;
		padding: calc(32px * var(--task-scale));
		gap: calc(24px * var(--task-scale));
		min-width: 0;
		min-height: 0;
		position: relative;
		overflow: hidden;
	}

	.task-modal__close {
		height: calc(40px * var(--task-scale));
		width: calc(40px * var(--task-scale));
		border-radius: 999px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border: 1px solid #e5e7eb;
		background: #ffffff;
		color: #6b7280;
		transition:
			color 0.2s ease,
			border-color 0.2s ease;
		align-self: flex-end;
	}

	.task-modal__close:hover {
		color: #111827;
		border-color: #111827;
	}

	.task-modal__close-icon {
		height: calc(18px * var(--task-scale));
		width: calc(18px * var(--task-scale));
	}

	.task-modal__panel {
		display: flex;
		flex-direction: column;
		gap: calc(24px * var(--task-scale));
		margin-top: calc(8px * var(--task-scale));
		flex: 1;
		min-height: 0;
		overflow-y: auto;
	}

	.task-modal__title {
		font-size: calc(28px * var(--task-scale));
		font-weight: 700;
		color: #111827;
	}

	.task-modal__actions {
		display: flex;
		gap: calc(16px * var(--task-scale));
		flex-wrap: wrap;
	}

	.task-modal__action {
		border-radius: 999px;
		padding: calc(12px * var(--task-scale)) calc(24px * var(--task-scale));
		font-weight: 600;
		font-size: calc(16px * var(--task-scale));
		transition:
			background 0.2s ease,
			border-color 0.2s ease,
			color 0.2s ease;
	}

	.task-modal__action--primary {
		background: #4f46e5;
		color: #ffffff;
		border: 1px solid #4f46e5;
	}

	.task-modal__action--secondary {
		background: #ffffff;
		color: #111827;
		border: 1px solid #e5e7eb;
	}

	@media (max-width: 1024px) {
		.task-modal {
			flex-direction: column;
		}

		.task-modal__image {
			flex: 0 0 auto;
			width: 100%;
			max-width: 100%;
			min-height: 200px;
			height: 40vh;
			max-height: 400px;
			background-position-y: -90px;
		}

		.task-modal__content {
			padding: 24px;
			overflow: hidden;
		}
	}

	@media (max-width: 640px) {
		.task-modal__image {
			min-height: 180px;
			height: 35vh;
			max-height: 300px;
			background-position-y: 0;
		}

		.task-modal__content {
			padding: 16px;
		}
	}
</style>
