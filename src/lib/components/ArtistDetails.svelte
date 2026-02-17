<script lang="ts">
	import type { Artist } from '$lib/types/nonPlayingCharacter';
	import Chip from './Chip.svelte';
	import ProgressBar from './progress-bars/ProgressBar.svelte';
	import {
		formatCurrency,
		formatDuration,
		getArtistSkillSections,
		getRarityClass,
		getRarityLabel,
		getArtistRankLabel,
		type SkillSection
	} from '$lib/utils';
	import { appState } from '$lib/stores/appState';
	import BeatmakerIcon from '$lib/icons/BeatmakerIcon.svelte';
	import RapperIcon from '$lib/icons/RapperIcon.svelte';
	import ArtistActivityPanel from './ArtistActivityPanel.svelte';
	import { createQuery } from '@tanstack/svelte-query';
	import { fetchContractsByArtistId } from '$lib/api/contracts';
	import { ContractStatus } from '$lib/types/contracts';
	import type { Contract } from '$lib/types/contracts';
	import { currentLabel } from '$lib/stores/appState';

	export let artist: Artist;
	let className = '';
	export { className as class };

	// Fetch contracts for this artist
	$: artistContractsQuery = createQuery({
		queryKey: ['contracts', 'by-artist', artist.id],
		queryFn: () => fetchContractsByArtistId(artist.id),
		enabled: !!artist.id
	});

	$: labelId = $currentLabel?.id ?? null;
	$: allContracts = $artistContractsQuery.data ?? [];

	// Find active signed contract (if any)
	$: activeContract =
		allContracts.find((c) => {
			if (c.status !== ContractStatus.Signed) return false;
			if (!c.endDate) return true;
			return new Date(c.endDate).getTime() > Date.now();
		}) ?? null;

	$: isWithCurrentLabel = activeContract ? activeContract.labelId === labelId : false;

	function formatContractDate(dateStr: string | null | undefined): string {
		if (!dateStr) return 'N/A';
		return new Date(dateStr).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	function getRemainingDuration(endDate: string | null | undefined): string {
		if (!endDate) return 'Indefinite';
		const remaining = new Date(endDate).getTime() - Date.now();
		if (remaining <= 0) return 'Expired';
		const days = Math.ceil(remaining / (1000 * 60 * 60 * 24));
		if (days > 365) return `${Math.floor(days / 365)}y ${Math.floor((days % 365) / 30)}m`;
		if (days > 30) return `${Math.floor(days / 30)}m ${days % 30}d`;
		return `${days}d`;
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

	const sections = getArtistSkillSections(artist);

	$: rankLabel = getArtistRankLabel(artist.rankId, $appState.clientConfig);
</script>

<div
	class="flex select-none flex-col border-b border-white/5 pb-12 last:border-none last:pb-0 {className}"
>
	<div class="mb-4 flex flex-wrap gap-1">
		<Chip class={getRarityClass(artist.rarity) + ' lowercase'}>{getRarityLabel(artist.rarity)}</Chip
		>
		{#if rankLabel}
			<Chip class="bg-gray-700 text-black">{rankLabel}</Chip>
		{/if}
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

	<ArtistActivityPanel class="mt-6" {artist} />

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
		<!-- Current contract -->
		<div class="flex flex-col gap-2 sm:flex-row sm:gap-4 lg:gap-6">
			<div
				class="select-none text-xs uppercase tracking-[0.3em] text-category-2-500 sm:w-32 sm:flex-none sm:text-right lg:w-40 lg:text-sm"
			>
				Contract
			</div>
			<div class="flex-1 text-xs leading-relaxed text-gray-300 lg:text-sm">
				{#if $artistContractsQuery.isLoading}
					<div class="flex items-center gap-2">
						<div
							class="h-3 w-3 animate-spin rounded-full border-2 border-gray-600 border-t-category-2-500"
						></div>
						<span class="text-gray-500">Loading contract...</span>
					</div>
				{:else if activeContract}
					<div
						class="overflow-hidden rounded-lg border {isWithCurrentLabel
							? 'border-secondary-500/30 bg-secondary-500/5'
							: 'border-red-500/30 bg-red-500/5'}"
					>
						<!-- Contract header -->
						<div
							class="flex items-center justify-between px-3 py-2 sm:px-4 {isWithCurrentLabel
								? 'bg-secondary-500/10'
								: 'bg-red-500/10'}"
						>
							<div class="flex items-center gap-2">
								<span
									class="inline-block h-2 w-2 rounded-full {isWithCurrentLabel
										? 'bg-secondary-400'
										: 'bg-red-400'}"
								></span>
								<span
									class="text-[10px] font-bold uppercase tracking-[0.2em] sm:text-xs {isWithCurrentLabel
										? 'text-secondary-400'
										: 'text-red-400'}"
								>
									{isWithCurrentLabel ? 'Your Label' : 'Another Label'}
								</span>
							</div>
							<span
								class="rounded-full bg-green-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-green-400"
							>
								Active
							</span>
						</div>

						<!-- Contract body -->
						<div class="px-3 py-3 sm:px-4 sm:py-4">
							<!-- Date info -->
							<div
								class="flex flex-wrap gap-x-4 gap-y-1 border-b border-white/5 pb-3 text-[10px] text-gray-500 sm:text-[11px]"
							>
								<span>
									Since <span class="text-gray-300"
										>{formatContractDate(activeContract.startDate)}</span
									>
								</span>
								<span>
									Remaining <span class="text-gray-300"
										>{getRemainingDuration(activeContract.endDate)}</span
									>
								</span>
							</div>

							<!-- Terms grid -->
							{#if activeContract.currentTerms}
								<div class="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
									<!-- Royalty -->
									<div class="flex flex-col">
										<span
											class="text-[9px] font-medium uppercase tracking-[0.15em] text-gray-600 sm:text-[10px]"
											>Royalty</span
										>
										<span class="mt-0.5 text-sm font-semibold text-white sm:text-base">
											{activeContract.currentTerms.royaltyPercentage}<span class="text-gray-500"
												>%</span
											>
										</span>
									</div>
									<!-- Advance -->
									<div class="flex flex-col">
										<span
											class="text-[9px] font-medium uppercase tracking-[0.15em] text-gray-600 sm:text-[10px]"
											>Advance</span
										>
										<span class="mt-0.5 text-sm font-semibold text-white sm:text-base">
											<span class="text-gray-500"></span>{formatCurrency(
												activeContract.currentTerms.advance
											)}
										</span>
									</div>
									<!-- Signing Bonus -->
									<div class="flex flex-col">
										<span
											class="text-[9px] font-medium uppercase tracking-[0.15em] text-gray-600 sm:text-[10px]"
											>Signing Bonus</span
										>
										<span class="mt-0.5 text-sm font-semibold text-white sm:text-base">
											<span class="text-gray-500"></span>{formatCurrency(
												activeContract.currentTerms.signingBonus
											)}
										</span>
									</div>
									<!-- Duration -->
									{#if activeContract.currentTerms.contractDuration}
										<div class="flex flex-col">
											<span
												class="text-[9px] font-medium uppercase tracking-[0.15em] text-gray-600 sm:text-[10px]"
												>Duration</span
											>
											<span class="mt-0.5 text-sm font-semibold text-white sm:text-base">
												{formatDuration(activeContract.currentTerms.contractDuration)}
											</span>
										</div>
									{/if}
								</div>

								<!-- Releases breakdown -->
								{#if activeContract.currentTerms.numberOfReleases}
									{@const releases = Object.entries(
										activeContract.currentTerms.numberOfReleases
									).filter(([_, v]) => v != null)}
									{#if releases.length > 0}
										<div class="mt-3 border-t border-white/5 pt-3">
											<span
												class="text-[9px] font-medium uppercase tracking-[0.15em] text-gray-600 sm:text-[10px]"
											>
												Required Releases
											</span>
											<div class="mt-1.5 flex flex-wrap gap-2">
												{#each releases as [type, count]}
													<span
														class="rounded-md bg-white/5 px-2 py-1 text-[10px] text-gray-300 sm:text-[11px]"
													>
														{type} <span class="font-semibold text-white">{count}</span>
													</span>
												{/each}
											</div>
										</div>
									{/if}
								{/if}
							{/if}
						</div>
					</div>
				{:else}
					<div
						class="flex items-center gap-2 rounded-lg border border-dashed border-white/10 px-3 py-2.5 text-gray-500"
					>
						<span class="inline-block h-2 w-2 rounded-full bg-gray-600"></span>
						<span class="text-xs italic">Free Agent — No active contract</span>
					</div>
				{/if}
			</div>
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
