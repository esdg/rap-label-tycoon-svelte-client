<script lang="ts">
	import Hero from '../Hero.svelte';
	import ProducingBeat from './task-submodals/ProducingBeat.svelte';
	import RecordingRelease from './task-submodals/RecordingRelease.svelte';
	import ScoutTalents from './task-submodals/ScoutTalents.svelte';
	import ScoutTalentsResults from './task-submodals/ScoutTalentsResults.svelte';
	import SignContract from './task-submodals/SignContract.svelte';

	export let data: Record<string, any> | undefined = undefined;

	const DEFAULT_IMAGE_URL =
		'https://res.cloudinary.com/dig430oem/image/upload/v1769554993/artists/profile_images/fpuc64oh9s5w8uoc9u5s.jpg';

	const VALID_SUBMODALS = new Set([
		'scout',
		'sign-contract',
		'scout-results',
		'producing-beats',
		'recording-release'
	]);

	let imageOverride: string | null = null;

	$: imageUrl = imageOverride ?? (data?.imageUrl as string | undefined) ?? DEFAULT_IMAGE_URL;
	$: activeSubModal = VALID_SUBMODALS.has((data?.subModal as string | undefined) ?? '')
		? (data?.subModal as string)
		: 'scout';

	$: if (activeSubModal !== 'scout-results' && imageOverride !== null) {
		imageOverride = null;
	}

	function handleImageChange(event: CustomEvent<string | null>) {
		imageOverride = event.detail;
	}
</script>

<div
	class="flex flex-col lg:flex-row h-full w-full rounded-lg overflow-hidden bg-primary-950 border border-gray-700 shadow-lg"
>
	<!-- Hero section - hidden on mobile, visible on larger screens -->
	<div
		class="hidden md:grid md:h-auto md:basis-1/3 md:overflow-hidden relative select-none"
		aria-hidden="true"
	>
		<Hero
			class="absolute inset-0 h-full w-full object-cover"
			image={imageUrl}
			gradientClass="bg-gradient-to-t from-primary-500 to-transparent"
		>
			<div class="relative z-10 mx-auto flex h-full max-w-6xl items-end text-white pb-6">
				<h2 class="text-7xl font-thin text-right uppercase">{data?.title}</h2>
			</div>
		</Hero>
	</div>

	<div class="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
		{#if activeSubModal === 'sign-contract'}
			<SignContract />
		{:else if activeSubModal === 'scout-results'}
			<ScoutTalentsResults
				taskResult={data?.scoutingTaskResponse}
				on:imageChange={handleImageChange}
			/>
		{:else if activeSubModal === 'producing-beats'}
			<ProducingBeat />
		{:else if activeSubModal === 'recording-release'}
			<RecordingRelease />
		{:else}
			<ScoutTalents />
		{/if}
	</div>
</div>
