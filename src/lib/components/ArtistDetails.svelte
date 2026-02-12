<script lang="ts">
	import type { Artist } from '$lib/types/nonPlayingCharacter';
	import type {
		ProducingBeatsTaskResponse,
		RecordingReleaseTaskResponse,
		RestingTaskResponse
	} from '$lib/types/task';
	import Chip from './Chip.svelte';
	import ProgressBar from './progress-bars/ProgressBar.svelte';
	import {
		getArtistSkillSections,
		getRarityClass,
		getRarityLabel,
		type SkillSection
	} from '$lib/utils';
	import BeatmakerIcon from '$lib/icons/BeatmakerIcon.svelte';
	import RapperIcon from '$lib/icons/RapperIcon.svelte';
	import ArtistActivityPanel from './ArtistActivityPanel.svelte';

	export let artist: Artist;
	export let beatProductionTasks: ProducingBeatsTaskResponse[] = [];
	export let recordingReleaseTasks: RecordingReleaseTaskResponse[] = [];
	export let restingTasks: RestingTaskResponse[] = [];
	let className = '';
	export { className as class };

	function getLegendItems(sections: SkillSection[]) {
		const seen = new Map<string, string>();
		sections.forEach((section) => {
			if (!seen.has(section.title)) {
				seen.set(section.title, section.colorClass);
			}
		});
		return Array.from(seen.entries()).map(([label, colorClass]) => ({ label, colorClass }));
	}

	const sections = getArtistSkillSections(artist);
</script>

<div
	class="flex select-none flex-col border-b border-white/5 pb-12 last:border-none last:pb-0 {className}"
>
	<div class="mb-4">
		<Chip class={getRarityClass(artist.rarity)}>{getRarityLabel(artist.rarity)}</Chip>
	</div>

	<!-- Artist Header -->
	<h3 class="text-3xl font-black uppercase leading-tight text-white sm:text-5xl lg:text-6xl">
		{artist.stageName}
		{#if artist.$type === 'rapper'}
			<RapperIcon class="pointer-events-auto relative bottom-2 top-auto inline-block size-8" />
		{:else if artist.$type === 'beatmaker'}
			<BeatmakerIcon class="pointer-events-auto relative bottom-2 top-auto inline-block size-8" />
		{/if}
	</h3>
	<p class="text-xl font-thin uppercase text-gray-400 sm:text-3xl lg:text-4xl">
		{artist.firstName}
		{artist.lastName}
	</p>

	<ArtistActivityPanel {artist} {beatProductionTasks} {recordingReleaseTasks} {restingTasks} />

	<!-- Artist Details -->
	<div class="flex flex-col gap-6 pt-6 text-sm lg:gap-8 lg:pt-8">
		<!-- Sex -->
		<div class="flex flex-col gap-2 sm:flex-row sm:gap-4 lg:gap-6">
			<div
				class="select-none text-xs uppercase tracking-[0.3em] text-primary-500 sm:w-32 sm:flex-none sm:text-right lg:w-40 lg:text-sm"
			>
				Sex
			</div>
			<p class="flex-1 text-xs leading-relaxed text-gray-300 lg:text-sm">
				{artist.sex}
			</p>
		</div>
		<!-- Age -->
		<div class="flex flex-col gap-2 sm:flex-row sm:gap-4 lg:gap-6">
			<div
				class="select-none text-xs uppercase tracking-[0.3em] text-primary-500 sm:w-32 sm:flex-none sm:text-right lg:w-40 lg:text-sm"
			>
				Age
			</div>
			<p class="flex-1 text-xs leading-relaxed text-gray-300 lg:text-sm">
				{artist.birthDate
					? new Date().getFullYear() - new Date(artist.birthDate).getFullYear()
					: 'Unknown'}
			</p>
		</div>
		<!-- Etnicity -->
		<div class="flex flex-col gap-2 sm:flex-row sm:gap-4 lg:gap-6">
			<div
				class="select-none text-xs uppercase tracking-[0.3em] text-primary-500 sm:w-32 sm:flex-none sm:text-right lg:w-40 lg:text-sm"
			>
				Etnicity
			</div>
			<p class="flex-1 text-xs leading-relaxed text-gray-300 lg:text-sm">
				{artist.ethnicity}
			</p>
		</div>
		<!-- Bio -->
		<div class="flex flex-col gap-2 sm:flex-row sm:gap-4 lg:gap-6">
			<div
				class="select-none text-xs uppercase tracking-[0.3em] text-primary-500 sm:w-32 sm:flex-none sm:text-right lg:w-40 lg:text-sm"
			>
				Bio
			</div>
			<p class="flex-1 text-xs leading-relaxed text-gray-300 lg:text-sm">
				{artist.bio}
			</p>
		</div>

		<!-- Background -->
		<div class="flex flex-col gap-2 sm:flex-row sm:gap-4 lg:gap-6">
			<div
				class="select-none text-xs uppercase tracking-[0.3em] text-primary-500 sm:w-32 sm:flex-none sm:text-right lg:w-40 lg:text-sm"
			>
				Background
			</div>
			<p class="flex-1 text-xs leading-relaxed text-gray-300 lg:text-sm">
				{artist.backgroundStory}
			</p>
		</div>

		<!-- Appearance -->
		<div class="flex flex-col gap-2 sm:flex-row sm:gap-4 lg:gap-6">
			<div
				class="select-none text-xs uppercase tracking-[0.3em] text-primary-500 sm:w-32 sm:flex-none sm:text-right lg:w-40 lg:text-sm"
			>
				Appearance
			</div>
			<p class="flex-1 text-xs leading-relaxed text-gray-300 lg:text-sm">
				{artist.physicalDescription}
			</p>
		</div>
	</div>

	<!-- Skills Section -->
	{#if sections.length}
		<div
			class="mt-8 rounded-xl border border-white/5 bg-[#080B12] p-4 shadow-lg shadow-black/30 sm:mt-10 sm:rounded-2xl sm:p-8 lg:mt-12 lg:p-10"
		>
			<!-- Legend -->
			<div
				class="flex flex-wrap gap-3 text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 sm:gap-4 sm:text-[11px] sm:tracking-[0.35em] lg:gap-5 lg:text-xs"
			>
				{#each getLegendItems(sections) as legend}
					<div class="flex items-center gap-1.5 sm:gap-2">
						<span class={`inline-block h-1.5 w-4 rounded-full sm:h-2 sm:w-6 ${legend.colorClass}`}
						></span>
						<span class="hidden sm:inline">{legend.label}</span>
					</div>
				{/each}
			</div>

			<!-- Skills Grid -->
			<div class="mt-4 grid gap-6 sm:mt-6 sm:gap-8 lg:mt-8 lg:grid-cols-2 lg:gap-10">
				{#each sections as section}
					<div>
						<p class="text-xs uppercase tracking-[0.35em] text-gray-500 lg:text-sm">
							{section.title}
						</p>
						<div class="mt-2 space-y-2 sm:mt-3 sm:space-y-3 lg:mt-4 lg:space-y-4">
							{#each section.skills as skill}
								<div class="flex items-center gap-2 sm:gap-4 lg:gap-5">
									<span
										class="w-24 truncate text-[10px] uppercase tracking-[0.1em] text-gray-400 sm:w-32 sm:text-[11px] sm:tracking-[0.2em] lg:w-40 lg:text-xs"
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
										class="w-10 text-right text-[11px] font-semibold text-gray-300 lg:w-12 lg:text-xs"
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
