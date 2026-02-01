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

	export let taskResult: ScoutingTaskResponse;

	let activeArtistIndex = 0;
	let taskArtists: Artist[] = [];
	let activeArtist: Artist | undefined;
	let lastImageUrl: string | null = null;

	function formatSkillLabel(key: string): string {
		return key
			.replace(/([a-z])([A-Z])/g, '$1 $2')
			.replace(/_/g, ' ')
			.split(' ')
			.filter(Boolean)
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
	}

	type SkillEntry = { label: string; value: number };
	type SkillSection = {
		title: string;
		colorClass: string;
		skills: SkillEntry[];
	};

	function isScoutingArtistsResults(
		results: ScoutingTaskResponse['results']
	): results is ScoutingArtistsResults {
		return Boolean(results && Array.isArray((results as ScoutingArtistsResults).discoveredArtists));
	}

	function handleCancel() {
		modalStore.close();
	}

	function isRapper(artist: Artist): artist is Rapper {
		return Boolean((artist as Rapper).songWritingSkills);
	}

	function isBeatmaker(artist: Artist): artist is Beatmaker {
		return Boolean((artist as Beatmaker).beatmakingSkills);
	}

	function buildSkillEntries(skillObj: Record<string, number> | undefined): SkillEntry[] {
		if (!skillObj) {
			return [];
		}

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

	function handleStepChange(event: { detail: number }) {
		activeArtistIndex = event.detail;
	}

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
</script>

<section class="flex flex-col h-screen overflow-hidden" aria-label="Scout Talents">
	<div class="w-full max-w-96 mx-auto mt-6">
		<Stepper
			selectedButtonColor={colors.primary[300]}
			selectedTextColor={colors.primary[500]}
			buttonColor="dimgray"
			stepLabels={getAllArtistsNames()}
			activeStepIndex={activeArtistIndex}
			on:stepClicked={handleStepChange}
		/>
	</div>

	<div class="flex-grow h-full overflow-x-auto">
		<ContentPanel
			class="pt-0 p-4 mx-auto h-full"
			activeStepIndex={activeArtistIndex}
			transition="slide"
			duration={300}
		>
			<div class="flex-grow p-12">
				{#if isScoutingArtistsResults(taskResult.results)}
					{#if taskResult.results.discoveredArtists.length === 0}
						<p class="text-center text-gray-400">No artists were discovered during scouting.</p>
					{:else}
						<ul class="w-full max-w-5xl mx-auto space-y-16">
							{#each taskResult.results.discoveredArtists as artist}
								<ContentPanelItem>
									{@const sections = getArtistSkillSections(artist)}
									<li class="list-none pb-12 border-b border-white/5 last:border-none last:pb-0">
										<h3 class="text-5xl font-black text-white uppercase">{artist.stageName}</h3>
										<p class="text-3xl font-thin text-gray-400 uppercase">
											{artist.firstName}
											{artist.lastName}
										</p>
										<div class="pt-6 flex gap-6 flex-col text-sm">
											<div class="flex gap-4">
												<div
													class="text-primary-500 flex-none w-32 text-right uppercase tracking-[0.3em] text-xs"
												>
													Bio
												</div>
												<p class="text-xs text-gray-300 flex-1 leading-relaxed">{artist.bio}</p>
											</div>
											<div class="flex gap-4">
												<div
													class="text-primary-500 flex-none w-32 text-right uppercase tracking-[0.3em] text-xs"
												>
													Background
												</div>
												<p class="text-xs text-gray-300 flex-1 leading-relaxed">
													{artist.backgroundStory}
												</p>
											</div>
											<div class="flex gap-4">
												<div
													class="text-primary-500 flex-none w-32 text-right uppercase tracking-[0.3em] text-xs"
												>
													Appearance
												</div>
												<p class="text-xs text-gray-300 flex-1 leading-relaxed">
													{artist.physicalDescription}
												</p>
											</div>
										</div>

										{#if sections.length}
											<div
												class="mt-10 rounded-2xl border border-white/5 bg-[#080B12] p-8 shadow-lg shadow-black/30"
											>
												<div
													class="flex flex-wrap gap-4 text-[11px] font-semibold uppercase tracking-[0.35em] text-gray-400"
												>
													{#each getLegendItems(sections) as legend}
														<div class="flex items-center gap-2">
															<span class={`inline-block h-2 w-6 rounded-full ${legend.colorClass}`}
															></span>
															{legend.label}
														</div>
													{/each}
												</div>
												<div class="mt-6 grid gap-8 lg:grid-cols-2">
													{#each sections as section}
														<div>
															<p class="text-xs uppercase tracking-[0.35em] text-gray-500">
																{section.title}
															</p>
															<div class="mt-3 space-y-3">
																{#each section.skills as skill}
																	<div class="flex items-center gap-4">
																		<span
																			class="w-32 text-[11px] uppercase tracking-[0.2em] text-gray-400"
																			>{skill.label}</span
																		>
																		<div class="flex-1">
																			<ProgressBar
																				value={skill.value}
																				lengthClass="w-full"
																				thicknessClass="h-1.5"
																				progressClass={section.colorClass}
																				backgroundClass="bg-white/10"
																				ariaLabel={`${section.title} ${skill.label}`}
																			/>
																		</div>
																		<span
																			class="w-10 text-right text-[11px] font-semibold text-gray-300"
																			>{skill.value}</span
																		>
																	</div>
																{/each}
															</div>
														</div>
													{/each}
												</div>
											</div>
										{/if}
									</li>
								</ContentPanelItem>
							{/each}
						</ul>
					{/if}
				{/if}
			</div>
		</ContentPanel>
	</div>
	<!-- Actions Bar -->
	<div class="w-full bg-black py-2 px-4 bt-2 border-t border-gray-700">
		<div class="flex gap-3 justify-end">
			<!-- Actions -->
			<Button
				class="min-w-32"
				color="blue"
				style="hollow"
				text="Cancel"
				altText="Cancel scouting task"
				on:clicked={handleCancel}
			/>
			<Button
				class="min-w-32"
				color="blue"
				text="Previous"
				altText="Proceed to next step"
				on:clicked={activeArtistIndex > 0 ? () => (activeArtistIndex -= 1) : null}
				disabled={activeArtistIndex === 0}
			/>
			<Button
				class="min-w-32"
				color="blue"
				text="Next"
				altText="Proceed to next step"
				on:clicked={isScoutingArtistsResults(taskResult.results) &&
				activeArtistIndex < taskResult.results.discoveredArtists.length - 1
					? () => (activeArtistIndex += 1)
					: null}
				disabled={!isScoutingArtistsResults(taskResult.results) ||
					activeArtistIndex >= taskResult.results.discoveredArtists.length - 1}
			/>
			<Button
				class="min-w-32"
				color="blue"
				text="Sign contract"
				altText="Proceed to next step"
				on:clicked={null}
			/>
		</div>
	</div>
</section>
