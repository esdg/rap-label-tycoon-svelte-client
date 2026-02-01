<script lang="ts">
	import { colors } from '$lib/theme';
	import Stepper from '$lib/components/Stepper.svelte';
	import ProgressBar from '$lib/components/progress-bars/ProgressBar.svelte';
	import { modalStore } from '$lib/stores/modal';
	import type { ScoutingArtistsResults, ScoutingTaskResponse } from '$lib/types/scouting';
	import type { Artist, Beatmaker, Rapper } from '$lib/types/nonPlayingCharacter';
	import ContentPanel from '$lib/components/ContentPanel.svelte';
	import ContentPanelItem from '$lib/components/ContentPanelItem.svelte';
	import Button from '$lib/components/Button.svelte';
	import Chip from '$lib/components/Chip.svelte';

	export let taskResult: ScoutingTaskResponse;

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
		results: ScoutingTaskResponse['results']
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

	function getLegendItems(sections: SkillSection[]) {
		const seen = new Map<string, string>();
		sections.forEach((section) => {
			if (!seen.has(section.title)) {
				seen.set(section.title, section.colorClass);
			}
		});
		return Array.from(seen.entries()).map(([label, colorClass]) => ({ label, colorClass }));
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

	function getRarityClass(rarity: number): string {
		const label = getRarityLabel(rarity);
		return rarityClasses[label as keyof typeof rarityClasses] ?? 'bg-gray-600 text-white';
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
									<div
										class="flex flex-col pb-12 border-b border-white/5 last:border-none last:pb-0"
									>
										<div class="mb-4">
											<Chip class={getRarityClass(artist.rarity)}
												>{getRarityLabel(artist.rarity)}</Chip
											>
										</div>

										<!-- Artist Header -->
										<h3
											class="text-3xl sm:text-5xl lg:text-6xl font-black text-white uppercase leading-tight"
										>
											{artist.stageName}
										</h3>
										<p class="text-xl sm:text-3xl lg:text-4xl font-thin text-gray-400 uppercase">
											{artist.firstName}
											{artist.lastName}
										</p>

										<!-- Artist Details -->
										<div class="pt-6 lg:pt-8 flex gap-6 lg:gap-8 flex-col text-sm">
											<!-- Bio -->
											<div class="flex flex-col sm:flex-row gap-2 sm:gap-4 lg:gap-6">
												<div
													class="text-primary-500 sm:flex-none sm:w-32 lg:w-40 sm:text-right uppercase tracking-[0.3em] text-xs lg:text-sm"
												>
													Bio
												</div>
												<p class="text-xs lg:text-sm text-gray-300 flex-1 leading-relaxed">
													{artist.bio}
												</p>
											</div>

											<!-- Background -->
											<div class="flex flex-col sm:flex-row gap-2 sm:gap-4 lg:gap-6">
												<div
													class="text-primary-500 sm:flex-none sm:w-32 lg:w-40 sm:text-right uppercase tracking-[0.3em] text-xs lg:text-sm"
												>
													Background
												</div>
												<p class="text-xs lg:text-sm text-gray-300 flex-1 leading-relaxed">
													{artist.backgroundStory}
												</p>
											</div>

											<!-- Appearance -->
											<div class="flex flex-col sm:flex-row gap-2 sm:gap-4 lg:gap-6">
												<div
													class="text-primary-500 sm:flex-none sm:w-32 lg:w-40 sm:text-right uppercase tracking-[0.3em] text-xs lg:text-sm"
												>
													Appearance
												</div>
												<p class="text-xs lg:text-sm text-gray-300 flex-1 leading-relaxed">
													{artist.physicalDescription}
												</p>
											</div>
										</div>

										<!-- Skills Section -->
										{#if sections.length}
											<div
												class="mt-8 sm:mt-10 lg:mt-12 rounded-xl sm:rounded-2xl border border-white/5 bg-[#080B12] p-4 sm:p-8 lg:p-10 shadow-lg shadow-black/30"
											>
												<!-- Legend -->
												<div
													class="flex flex-wrap gap-3 sm:gap-4 lg:gap-5 text-[10px] sm:text-[11px] lg:text-xs font-semibold uppercase tracking-[0.25em] sm:tracking-[0.35em] text-gray-400"
												>
													{#each getLegendItems(sections) as legend}
														<div class="flex items-center gap-1.5 sm:gap-2">
															<span
																class={`inline-block h-1.5 sm:h-2 w-4 sm:w-6 rounded-full ${legend.colorClass}`}
															></span>
															<span class="hidden sm:inline">{legend.label}</span>
														</div>
													{/each}
												</div>

												<!-- Skills Grid -->
												<div
													class="mt-4 sm:mt-6 lg:mt-8 grid gap-6 sm:gap-8 lg:gap-10 lg:grid-cols-2"
												>
													{#each sections as section}
														<div>
															<p
																class="text-xs lg:text-sm uppercase tracking-[0.35em] text-gray-500"
															>
																{section.title}
															</p>
															<div class="mt-2 sm:mt-3 lg:mt-4 space-y-2 sm:space-y-3 lg:space-y-4">
																{#each section.skills as skill}
																	<div class="flex items-center gap-2 sm:gap-4 lg:gap-5">
																		<span
																			class="w-24 sm:w-32 lg:w-40 text-[10px] sm:text-[11px] lg:text-xs uppercase tracking-[0.1em] sm:tracking-[0.2em] text-gray-400 truncate"
																		>
																			{skill.label}
																		</span>
																		<div class="flex-1">
																			<ProgressBar
																				value={skill.value}
																				lengthClass="w-full"
																				thicknessClass="h-1.5 lg:h-2"
																				progressClass={section.colorClass}
																				backgroundClass="bg-white/10"
																				ariaLabel={`${section.title} ${skill.label}`}
																			/>
																		</div>
																		<span
																			class="w-10 lg:w-12 text-right text-[11px] lg:text-xs font-semibold text-gray-300"
																		>
																			{skill.value}
																		</span>
																	</div>
																{/each}
															</div>
														</div>
													{/each}
												</div>
											</div>
										{/if}
									</div>
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
				on:clicked={null}
			>
				Sign contract
			</Button>
		</div>
	</div>
</section>
