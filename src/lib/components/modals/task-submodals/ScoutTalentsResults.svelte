<script lang="ts">
	import { colors } from '$lib/theme';
	import Stepper from '$lib/components/Stepper.svelte';
	import { modalStore } from '$lib/stores/modal';
	import type { ScoutingArtistsResults } from '$lib/types/scoutingArtistsTask';
	import type { Artist } from '$lib/types/nonPlayingCharacter';
	import ContentPanel from '$lib/components/ContentPanel.svelte';
	import ContentPanelItem from '$lib/components/ContentPanelItem.svelte';
	import Button from '$lib/components/Button.svelte';
	import ArtistDetails from '$lib/components/ArtistDetails.svelte';
	import type { TaskResponse } from '$lib/types/task';
	import { discoveredArtists } from '$lib/stores/artists';
	import ScrollableContainer from '$lib/components/ScrollableContainer.svelte';

	export let taskResult: TaskResponse;

	// State
	let activeArtistIndex = 0;
	let taskArtists: Artist[] = [];
	let activeArtist: Artist | undefined;
	let lastImageUrl: string | null = null;

	// Reactive statements
	$: taskArtists = isScoutingArtistsResults(taskResult.results)
		? $discoveredArtists
				.filter(
					(item) =>
						taskResult.results &&
						'discoveredArtistsIds' in taskResult.results &&
						(taskResult.results as ScoutingArtistsResults).discoveredArtistsIds.includes(
							item.artist.id
						)
				)
				.map((item) => item.artist)
		: [];

	$: {
		const lastIndex = taskArtists.length - 1;
		if (taskArtists.length === 0 && activeArtistIndex !== 0) {
			activeArtistIndex = 0;
		} else if (lastIndex >= 0 && activeArtistIndex > lastIndex) {
			activeArtistIndex = lastIndex;
		}
	}

	$: activeArtist = taskArtists.length > 0 ? taskArtists[activeArtistIndex] : undefined;

	$: if (activeArtist?.profileImage && activeArtist.profileImage !== lastImageUrl) {
		modalStore.updateData({ imageUrl: activeArtist.profileImage });
		lastImageUrl = activeArtist.profileImage;
	}

	// Type guards
	function isScoutingArtistsResults(
		results: TaskResponse['results']
	): results is ScoutingArtistsResults {
		return Boolean(
			results && Array.isArray((results as ScoutingArtistsResults).discoveredArtistsIds)
		);
	}

	function getAllArtistsNames(): string[] {
		return taskArtists.map((artist) => artist.stageName);
	}

	// Event handlers
	function handleCancel() {
		modalStore.close();
	}

	function handleStepChange(event: { detail: number }) {
		activeArtistIndex = event.detail;
	}

	function handlePrevious() {
		if (activeArtistIndex > 0) {
			activeArtistIndex -= 1;
		}
	}

	function handleNext() {
		if (activeArtistIndex < taskArtists.length - 1) {
			activeArtistIndex += 1;
		}
	}

	function openSignContractModal(artist: Artist) {
		modalStore.transition('task-modal', {
			subModal: 'sign-contract',
			artist: artist,
			title: 'Signing Contract',
			imageUrl:
				artist.profileImage ??
				'https://res.cloudinary.com/dig430oem/image/upload/v1769554993/artists/profile_images/fpuc64oh9s5w8uoc9u5s.jpg'
		});
	}
</script>

<ScrollableContainer showHeader={taskArtists.length > 1}>
	<svelte:fragment slot="header">
		{#if taskArtists.length > 1}
			<Stepper
				selectedButtonColor={colors.primary[300]}
				selectedTextColor={colors.primary[500]}
				buttonColor="dimgray"
				stepLabels={getAllArtistsNames()}
				activeStepIndex={activeArtistIndex}
				hideLabelsOnMobile={true}
				on:stepClicked={handleStepChange}
			/>
		{/if}
	</svelte:fragment>

	<svelte:fragment>
		<ContentPanel
			class="pt-0 p-4 mx-auto h-full"
			activeStepIndex={activeArtistIndex}
			transition="slide"
			duration={300}
		>
			<div class="flex-grow p-4 sm:p-12">
				{#if isScoutingArtistsResults(taskResult.results)}
					{#if taskArtists.length === 0}
						<p class="text-center text-gray-400">No artists were discovered during scouting.</p>
					{:else}
						<div class="w-full max-w-5xl mx-auto space-y-12 sm:space-y-16">
							{#each taskArtists as artist}
								<ContentPanelItem>
									<ArtistDetails {artist} />
								</ContentPanelItem>
							{/each}
						</div>
					{/if}
				{/if}
			</div>
		</ContentPanel>
	</svelte:fragment>
	<svelte:fragment slot="footer">
		<Button
			class="w-full sm:w-auto sm:min-w-32 order-last sm:order-first sm:ml-auto"
			color="primary"
			style="hollow"
			altText="Cancel scouting task"
			on:clicked={handleCancel}
		>
			Cancel
		</Button>

		{#if taskArtists.length > 1}
			<div class="flex gap-2 sm:gap-3">
				<Button
					class="flex-1 sm:flex-none sm:min-w-32"
					color="primary"
					altText="View previous artist"
					on:clicked={handlePrevious}
					disabled={activeArtistIndex === 0}
				>
					Previous
				</Button>
				<Button
					class="flex-1 sm:flex-none sm:min-w-32"
					color="primary"
					altText="View next artist"
					on:clicked={handleNext}
					disabled={activeArtistIndex >= taskArtists.length - 1}
				>
					Next
				</Button>
			</div>
		{/if}

		<Button
			class="w-full sm:w-auto sm:min-w-32"
			color="secondary"
			altText="Sign contract with this artist"
			on:clicked={() => openSignContractModal(taskArtists[activeArtistIndex])}
		>
			Sign contract
		</Button>
	</svelte:fragment>
</ScrollableContainer>
