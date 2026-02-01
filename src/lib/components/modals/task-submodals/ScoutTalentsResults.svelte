<script lang="ts">
	import { colors } from '$lib/theme';
	import Stepper from '$lib/components/Stepper.svelte';
	import type { ScoutingArtistsResults, ScoutingTaskResponse } from '$lib/types/scouting';

	export let taskResult: ScoutingTaskResponse;

	let currentStep = 0;

	function isScoutingArtistsResults(
		results: ScoutingTaskResponse['results']
	): results is ScoutingArtistsResults {
		return Boolean(results && Array.isArray((results as ScoutingArtistsResults).discoveredArtists));
	}

	// Example: Go through all task results and apply a condition (not displayed)
	function getAllArtistsNames(): string[] {
		console.log(taskResult.results);
		if (!taskResult || !isScoutingArtistsResults(taskResult.results)) {
			return [];
		}

		return taskResult.results.discoveredArtists.map((artist) => artist.stageName);
	}

	// Call the function when needed (e.g., on mount or after receiving taskResult)
	// processAllTaskResults();

	function handleStepChange(event: { detail: number }) {
		currentStep = event.detail;
		console.log('Step changed to:', currentStep);
	}
</script>

<section class="flex flex-col h-full" aria-label="Scout Talents">
	<div class="w-full max-w-96 mx-auto mt-6">
		<Stepper
			selectedButtonColor={colors.primary[300]}
			selectedTextColor={colors.primary[500]}
			buttonColor="dimgray"
			stepLabels={getAllArtistsNames()}
			activeStepIndex={currentStep}
			on:stepClicked={handleStepChange}
		/>
	</div>
	<div class="flex-grow p-12">
		{#if isScoutingArtistsResults(taskResult.results)}
			{#if taskResult.results.discoveredArtists.length === 0}
				<p class="text-center text-gray-400">No artists were discovered during scouting.</p>
			{:else}
				<ul class="w-[500px]">
					{#each taskResult.results.discoveredArtists as artist}
						<h3 class="text-5xl font-black text-white uppercase">{artist.stageName}</h3>
						<p class="text-3xl font-thin text-gray-400 uppercase">
							{artist.firstName}
							{artist.lastName}
						</p>
						<div class="pt-6 flex gap-6 flex-col">
							<li class="flex gap-4">
								<div class="text-primary-500 flex-none w-28 text-right">Bio</div>
								<p class="text-xs text-gray-300 flex-1">{artist.bio}</p>
							</li>
							<li class="flex gap-4">
								<div class="text-primary-500 flex-none w-28 text-right">Background story</div>
								<p class="text-xs text-gray-300 flex-1">{artist.backgroundStory}</p>
							</li>
							<li class="flex gap-4">
								<div class="text-primary-500 flex-none w-28 text-right">Physical description</div>
								<p class="text-xs text-gray-300 flex-1">{artist.physicalDescription}</p>
							</li>
						</div>
					{/each}
				</ul>
			{/if}
		{/if}
	</div>
</section>
