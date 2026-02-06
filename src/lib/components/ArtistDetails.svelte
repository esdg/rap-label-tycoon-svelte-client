<script lang="ts">
	import type { Artist } from '$lib/types/nonPlayingCharacter';
	import Chip from './Chip.svelte';
	import ProgressBar from './progress-bars/ProgressBar.svelte';
	import {
		getArtistSkillSections,
		getRarityClass,
		getRarityLabel,
		type SkillSection
	} from '$lib/utils';

	export let artist: Artist;
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

<div class="flex flex-col pb-12 border-b border-white/5 last:border-none last:pb-0 {className}">
	<div class="mb-4">
		<Chip class={getRarityClass(artist.rarity)}>{getRarityLabel(artist.rarity)}</Chip>
	</div>

	<!-- Artist Header -->
	<h3 class="text-3xl sm:text-5xl lg:text-6xl font-black text-white uppercase leading-tight">
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
						<span class={`inline-block h-1.5 sm:h-2 w-4 sm:w-6 rounded-full ${legend.colorClass}`}
						></span>
						<span class="hidden sm:inline">{legend.label}</span>
					</div>
				{/each}
			</div>

			<!-- Skills Grid -->
			<div class="mt-4 sm:mt-6 lg:mt-8 grid gap-6 sm:gap-8 lg:gap-10 lg:grid-cols-2">
				{#each sections as section}
					<div>
						<p class="text-xs lg:text-sm uppercase tracking-[0.35em] text-gray-500">
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
