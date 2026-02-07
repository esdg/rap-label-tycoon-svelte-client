<script lang="ts">
	import { currentLabel } from '$lib/stores/appState';
	import { createLabelBeatsQuery } from '$lib/queries/beatQueries';
	import Stepper from '$lib/components/Stepper.svelte';
	import ContentPanel from '$lib/components/ContentPanel.svelte';
	import ContentPanelItem from '$lib/components/ContentPanelItem.svelte';

	// Tab management
	let activeTabIndex = 0;
	const tabLabels = ['Releases', 'Tracks', 'Beats'];

	function handleTabClick(event: CustomEvent<number>) {
		activeTabIndex = event.detail;
	}

	// Fetch beats when label is available
	$: beatsQuery = createLabelBeatsQuery($currentLabel?.id ?? null);
	$: beats = $beatsQuery.data ?? [];
	$: isLoadingBeats = $beatsQuery.isLoading;
	$: beatsError = $beatsQuery.error;
</script>

<div class="music-and-release-page p-4 md:p-6 lg:p-8">
	<h1 class="text-3xl font-bold mb-6 text-primary-100">Music & Release</h1>

	<!-- Tabs -->
	<div class="mb-6">
		<Stepper
			stepLabels={tabLabels}
			activeStepIndex={activeTabIndex}
			on:stepClicked={handleTabClick}
			selectedButtonColor="#10b981"
			selectedTextColor="#10b981"
		/>
	</div>

	<!-- Tab Content -->
	<ContentPanel activeStepIndex={activeTabIndex} transition="fade" duration={200}>
		<!-- Releases Tab -->
		<ContentPanelItem>
			<div class="bg-primary-950 border border-primary-200 rounded-lg p-6">
				<h2 class="text-xl font-semibold text-primary-100 mb-4">Releases</h2>
				<p class="text-primary-300 text-center py-8">Coming soon...</p>
			</div>
		</ContentPanelItem>

		<!-- Tracks Tab -->
		<ContentPanelItem>
			<div class="bg-primary-950 border border-primary-200 rounded-lg p-6">
				<h2 class="text-xl font-semibold text-primary-100 mb-4">Tracks</h2>
				<p class="text-primary-300 text-center py-8">Coming soon...</p>
			</div>
		</ContentPanelItem>

		<!-- Beats Tab -->
		<ContentPanelItem>
			<div class="bg-primary-950 border border-primary-200 rounded-lg p-6">
				<h2 class="text-xl font-semibold text-primary-100 mb-4">Beats</h2>

				{#if isLoadingBeats}
					<p class="text-primary-300 text-center py-8">Loading beats...</p>
				{:else if beatsError}
					<p class="text-red-400 text-center py-8">Error loading beats: {beatsError.message}</p>
				{:else if beats.length === 0}
					<p class="text-primary-300 text-center py-8">No beats owned by this label yet.</p>
				{:else}
					<div class="space-y-2">
						<!-- Header -->
						<div
							class="grid grid-cols-[2fr_1fr_80px_80px_80px_120px_100px] gap-4 px-4 py-3 text-xs uppercase bg-primary-900 text-primary-300 border-b border-primary-300 rounded-t"
						>
							<div>Title</div>
							<div>Genre</div>
							<div class="text-center">BPM</div>
							<div class="text-center">Rating</div>
							<div class="text-center">Rarity</div>
							<div class="text-center">Type</div>
							<div class="text-center">Status</div>
						</div>

						<!-- Beats List -->
						{#each beats as beat (beat.id)}
							<div
								class="grid grid-cols-[2fr_1fr_80px_80px_80px_120px_100px] gap-4 px-4 py-3 items-center border-b border-primary-800 hover:bg-primary-900 transition-colors text-sm"
							>
								<div class="font-medium text-primary-100 truncate">{beat.title}</div>
								<div class="text-primary-200 truncate">{beat.genre}</div>
								<div class="text-center text-primary-200">{beat.bpm}</div>
								<div class="text-center text-primary-200">{beat.rating.toFixed(1)}/10</div>
								<div class="text-center text-primary-200">{beat.rarity}</div>
								<div class="flex justify-center">
									{#if beat.isExclusive}
										<span class="px-2 py-1 text-xs bg-secondary-500 text-primary-950 rounded">
											Exclusive
										</span>
									{:else}
										<span class="px-2 py-1 text-xs bg-primary-700 text-primary-200 rounded">
											Non-Exclusive
										</span>
									{/if}
								</div>
								<div class="flex justify-center">
									{#if beat.isSold}
										<span class="px-2 py-1 text-xs bg-red-600 text-white rounded">Sold</span>
									{:else}
										<span class="px-2 py-1 text-xs bg-green-600 text-white rounded">
											Available
										</span>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</ContentPanelItem>
	</ContentPanel>
</div>
