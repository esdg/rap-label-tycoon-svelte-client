<script lang="ts">
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

<div
	class="flex flex-col lg:flex-row h-full w-full rounded-lg overflow-hidden bg-app border border-gray-700 shadow-lg"
>
	<div
		class="h-128 md:h-auto md:basis-2/5 md:overflow-hidden relative select-none"
		aria-hidden="true"
	>
		<img src={imageUrl} alt="" class="absolute inset-0 h-full w-full object-cover" />
	</div>

	<div class="flex-1 flex flex-col gap-6 min-w-0 min-h-0 relative overflow-hidden">
		<div class="h-full">
			<div
				class="flex flex-col gap-6 flex-1 min-h-0 overflow-y-auto h-full"
				role="region"
				aria-live="polite"
			>
				{#if activeSubModal === 'sign'}
					<SignArtist />
				{:else}
					<ScoutTalents />
				{/if}
			</div>
		</div>
	</div>
</div>
