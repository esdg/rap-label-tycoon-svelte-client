<script lang="ts">
	import { colors } from '$lib/theme';
	import Stepper from '$lib/components/Stepper.svelte';
	import { modalStore } from '$lib/stores/modal';
	import type { ScoutingArtistsResults } from '$lib/types/scoutingArtistsTask';
	import type { Artist, Beatmaker, Rapper } from '$lib/types/nonPlayingCharacter';
	import ContentPanel from '$lib/components/ContentPanel.svelte';
	import ContentPanelItem from '$lib/components/ContentPanelItem.svelte';
	import Button from '$lib/components/Button.svelte';
	import ArtistDetails from '$lib/components/ArtistDetails.svelte';
	import type { TaskResponse } from '$lib/types/task';

	export let taskResult: TaskResponse;

	// State
	let activeArtistIndex = 0;
	let taskArtists: Artist[] = [];
	let activeArtist: Artist | undefined;
	let lastImageUrl: string | null = null;

	// Types
	type SkillEntry = { label: string; value: number };
	type SkillSection = {
		title: string;
		colorClass: string;
		skills: SkillEntry[];
	};

	// Reactive statements
	$: taskArtists = isScoutingArtistsResults(taskResult.results)
		? taskResult.results.discoveredArtists
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
		return Boolean(results && Array.isArray((results as ScoutingArtistsResults).discoveredArtists));
	}

	function isRapper(artist: Artist): artist is Rapper {
		return Boolean((artist as Rapper).songWritingSkills);
	}

	function isBeatmaker(artist: Artist): artist is Beatmaker {
		return Boolean((artist as Beatmaker).beatmakingSkills);
	}

	// Utility functions
	function formatSkillLabel(key: string): string {
		return key
			.replace(/([a-z])([A-Z])/g, '$1 $2')
			.replace(/_/g, ' ')
			.split(' ')
			.filter(Boolean)
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
	}

	function buildSkillEntries(skillObj: Record<string, number> | undefined): SkillEntry[] {
		if (!skillObj) return [];
		return Object.entries(skillObj).map(([key, value]) => ({
			label: formatSkillLabel(key),
			value: Math.round(value ?? 0)
		}));
	}

	function getArtistSkillSections(artist: Artist): SkillSection[] {
		const sections: SkillSection[] = [];

		if (isRapper(artist)) {
			sections.push({
				title: 'Song writing skills',
				colorClass: 'bg-pink-500',
				skills: buildSkillEntries(artist.songWritingSkills)
			});
			sections.push({
				title: 'Interpretation skills',
				colorClass: 'bg-amber-400',
				skills: buildSkillEntries(artist.interpretationSkills)
			});
		}

		if (isBeatmaker(artist)) {
			sections.push({
				title: 'Beatmaking skills',
				colorClass: 'bg-emerald-400',
				skills: buildSkillEntries(artist.beatmakingSkills)
			});
		}

		sections.push({
			title: 'Personal skills',
			colorClass: 'bg-sky-400',
			skills: buildSkillEntries(artist.personalSkills)
		});

		return sections.filter((section) => section.skills.length > 0);
	}

	function getAllArtistsNames(): string[] {
		return taskArtists.map((artist) => artist.stageName);
	}

	const rarityLabels = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'] as const;
	const rarityClasses = {
		Common: 'bg-gray-500 text-black',
		Uncommon: 'bg-primary-600 text-white',
		Rare: 'bg-category-1-500 text-white',
		Epic: 'bg-category-2-500 text-white',
		Legendary: 'bg-category-3-500 text-white'
	} as const;

	function getRarityLabel(rarity: number): string {
		const index = Number.isFinite(rarity) ? Math.trunc(rarity) : -1;
		return rarityLabels[index] ?? 'Unknown';
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
		if (
			isScoutingArtistsResults(taskResult.results) &&
			activeArtistIndex < taskResult.results.discoveredArtists.length - 1
		) {
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

<section class="flex flex-col h-full overflow-hidden" aria-label="Scout Talents Results">
	<!-- Stepper -->
	{#if taskArtists.length > 1}
		<div
			class="flex-shrink-0 w-full max-w-96 lg:max-w-2xl mx-auto mt-4 sm:mt-6 lg:mt-8 mb-6 px-4 sm:px-0"
		>
			<Stepper
				selectedButtonColor={colors.primary[300]}
				selectedTextColor={colors.primary[500]}
				buttonColor="dimgray"
				stepLabels={getAllArtistsNames()}
				activeStepIndex={activeArtistIndex}
				hideLabelsOnMobile={true}
				on:stepClicked={handleStepChange}
			/>
		</div>
	{/if}

	<!-- Main Content - Scrollable -->
	<div class="flex-1 overflow-y-auto">
		<ContentPanel
			class="pt-0 p-4 mx-auto h-full"
			activeStepIndex={activeArtistIndex}
			transition="slide"
			duration={300}
		>
			<div class="flex-grow p-4 sm:p-12">
				{#if isScoutingArtistsResults(taskResult.results)}
					{#if taskResult.results.discoveredArtists.length === 0}
						<p class="text-center text-gray-400">No artists were discovered during scouting.</p>
					{:else}
						<div class="w-full max-w-5xl mx-auto space-y-12 sm:space-y-16">
							{#each taskResult.results.discoveredArtists as artist}
								<ContentPanelItem>
									{@const sections = getArtistSkillSections(artist)}
									<ArtistDetails {artist} />
								</ContentPanelItem>
							{/each}
						</div>
					{/if}
				{/if}
			</div>
		</ContentPanel>
	</div>

	<!-- Sticky Actions Bar -->
	<div
		class="flex-shrink-0 w-full bg-black py-2 sm:py-3 px-3 sm:px-4 border-t border-gray-700 sticky bottom-0"
	>
		<div class="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-end">
			<Button
				class="w-full sm:w-auto sm:min-w-32 order-last sm:order-first"
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
						disabled={!isScoutingArtistsResults(taskResult.results) ||
							activeArtistIndex >= taskResult.results.discoveredArtists.length - 1}
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
		</div>
	</div>
</section>
