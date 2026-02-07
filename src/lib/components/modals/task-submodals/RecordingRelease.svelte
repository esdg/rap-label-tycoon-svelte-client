<script lang="ts">
	import { onMount } from 'svelte';
	import { colors } from '$lib/theme';
	import { modalStore } from '$lib/stores/modal';
	import { appState, currentLabel, currentPlayer } from '$lib/stores/appState';
	import { createLabelTasksQuery, createTasksByType } from '$lib/queries/taskQueries';
	import { createContractsByIdsQuery } from '$lib/queries/contractQueries';
	import { createArtistsByIdsQuery } from '$lib/queries/artistQueries';
	import { createLabelBeatsQuery } from '$lib/queries/beatQueries';
	import { createLabelTracksQuery } from '$lib/queries/releaseQueries';
	import { queryKeys, queryClient } from '$lib/queries/queryClient';
	import { loadClientConfig } from '$lib/services/config';
	import { ContractStatus } from '$lib/types/contracts';
	import { RapMusicStyle, RapMusicStyleNames } from '$lib/types/musicStyles';
	import {
		predictRecordingReleaseCost,
		createRecordingReleaseTask,
		TaskCreationError,
		type RecordingReleaseRequest
	} from '$lib/api';
	import type { Rapper } from '$lib/types/nonPlayingCharacter';
	import type { Beat } from '$lib/types/beat';
	import type { ReleaseType } from '$lib/types/config';
	import type { TaskCostPrediction } from '$lib/types/task';
	import { getTaskErrorMessage } from '$lib/utils';
	import Stepper from '$lib/components/Stepper.svelte';
	import ContentPanel from '$lib/components/ContentPanel.svelte';
	import ContentPanelItem from '$lib/components/ContentPanelItem.svelte';
	import ScrollableContainer from '$lib/components/ScrollableContainer.svelte';
	import Dropdown from '$lib/components/Dropdown.svelte';
	import SelectField from '$lib/components/formfields/SelectField.svelte';
	import Button from '$lib/components/Button.svelte';
	import CostEstimation from './CostEstimation.svelte';
	import Chip from '$lib/components/Chip.svelte';

	// State
	let activeStepIndex = 0;
	let totalSteps = 3;
	let error: string | null = null;
	let loading = false;
	let loadingCost = false;
	let costPrediction: TaskCostPrediction | null = null;
	let costPredictionRequestId = 0;

	// Step 1 state
	let rappersSelection: Array<{ name: string; value: string }> = [];
	let selectedRapperId: string | null = null;
	let releaseTypes: ReleaseType[] = [];
	let selectedReleaseTypeId: string | null = null;
	let selectedGenre: RapMusicStyle | null = null;

	// Step 2 state
	let selectedBeatIds: Set<string> = new Set();
	let filteredBeats: Beat[] = [];

	// Reactive queries
	$: labelId = $currentLabel?.id || null;
	$: tasksQuery = createLabelTasksQuery(labelId);
	$: beatsQuery = createLabelBeatsQuery(labelId);
	$: tracksQuery = createLabelTracksQuery(labelId);

	// Split tasks by type
	$: taskData = $tasksQuery.data
		? createTasksByType($tasksQuery.data)
		: { scoutingTasks: [], contractTasks: [] };
	$: contractTasks = taskData.contractTasks;

	// Extract contract IDs from tasks
	$: contractIds = contractTasks
		.map((task) => task.contractId)
		.filter((id): id is string => typeof id === 'string' && id.length > 0);

	// Deduplicate contract IDs
	$: uniqueContractIds = [...new Set(contractIds)];

	// Create contracts query based on unique IDs
	$: contractsQuery = createContractsByIdsQuery(uniqueContractIds);

	// Filter for valid signed contracts (status = signed, end date not passed)
	$: validContracts = ($contractsQuery.data ?? []).filter((contract) => {
		if (contract.status !== ContractStatus.Signed) return false;
		if (!contract.endDate) return true; // No end date means active
		const endDate = new Date(contract.endDate).getTime();
		return endDate > Date.now();
	});

	// Extract artist IDs from valid contracts
	$: validArtistIds = validContracts
		.map((contract) => contract.artistId)
		.filter((id): id is string => typeof id === 'string' && id.length > 0);

	// Create artists query based on valid contract artist IDs
	$: artistsQuery = createArtistsByIdsQuery(validArtistIds);

	// Filter only rappers and map to dropdown format
	$: rappersSelection = (
		($artistsQuery.data?.filter((artist): artist is Rapper => 'songWritingSkills' in artist) ||
			[]) as Rapper[]
	).map((rapper) => ({
		name: rapper.stageName,
		value: rapper.id
	}));

	// Auto-select if only one rapper available
	$: if (rappersSelection.length === 1 && !selectedRapperId) {
		selectedRapperId = rappersSelection[0].value;
	}

	// Release type choices for dropdown
	$: releaseTypeChoices = releaseTypes.map((rt) => ({
		name: rt.name,
		value: rt.id,
		title: rt.description
	}));

	// Genre choices
	$: genreChoices = Object.values(RapMusicStyle)
		.filter((v) => typeof v === 'number')
		.map((genre) => ({
			name: RapMusicStyleNames[genre as RapMusicStyle],
			value: genre
		}));

	// Get selected release type object
	$: selectedReleaseType = releaseTypes.find((rt) => rt.id === selectedReleaseTypeId);

	// Get set of beat IDs that are already used in tracks
	$: usedBeatIds = new Set(($tracksQuery.data ?? []).map((track) => track.beatId));

	// Filter beats by selected genre and exclude beats that are sold or already used
	$: filteredBeats =
		selectedGenre !== null
			? ($beatsQuery.data ?? []).filter(
					(beat) => beat.genre === selectedGenre && !beat.isSold && !usedBeatIds.has(beat.id)
				)
			: [];

	// Clear selected beats when genre changes
	$: if (selectedGenre !== null) {
		selectedBeatIds = new Set();
	}

	// Check if minimum tracks selected
	$: minTracksRequired = selectedReleaseType?.minTracks ?? 1;
	$: maxTracksAllowed = selectedReleaseType?.maxTracks ?? 99;
	$: beatsSelectionValid =
		selectedBeatIds.size >= minTracksRequired && selectedBeatIds.size <= maxTracksAllowed;

	// Ready for cost prediction when on step 2 with valid data
	$: readyForCostPrediction =
		Boolean($currentLabel && $currentPlayer && selectedRapperId && selectedReleaseTypeId) &&
		activeStepIndex >= 2 &&
		selectedGenre !== null &&
		beatsSelectionValid;

	$: if (!readyForCostPrediction) {
		costPrediction = null;
	}

	$: if (readyForCostPrediction) {
		fetchCostPrediction();
	}

	// Set loading/error states
	$: if (
		$tasksQuery.isLoading ||
		$contractsQuery.isLoading ||
		$artistsQuery.isLoading ||
		$tracksQuery.isLoading
	) {
		error = null;
	} else if ($tasksQuery.error) {
		error = `Failed to load tasks: ${$tasksQuery.error.message}`;
	} else if ($contractsQuery.error) {
		error = `Failed to load contracts: ${$contractsQuery.error.message}`;
	} else if ($artistsQuery.error) {
		error = `Failed to load rappers: ${$artistsQuery.error.message}`;
	} else if ($beatsQuery.error) {
		error = `Failed to load beats: ${$beatsQuery.error.message}`;
	} else if ($tracksQuery.error) {
		error = `Failed to load tracks: ${$tracksQuery.error.message}`;
	}

	// Lifecycle
	onMount(async () => {
		try {
			const config = await loadClientConfig();
			releaseTypes = config.releaseTypes;
			if (releaseTypes.length > 0 && !selectedReleaseTypeId) {
				selectedReleaseTypeId = releaseTypes[0].id;
			}
		} catch (err) {
			error = 'Failed to load release types';
			console.error(err);
		}
	});

	// Functions
	function buildRecordingReleaseRequest(): RecordingReleaseRequest | null {
		if (
			!$currentLabel ||
			!selectedRapperId ||
			!selectedReleaseTypeId ||
			selectedGenre === null ||
			selectedBeatIds.size === 0
		) {
			return null;
		}

		return {
			labelId: $currentLabel.id,
			releaseTypeId: selectedReleaseTypeId,
			productionStyle: selectedGenre,
			rapperId: selectedRapperId,
			beatIds: Array.from(selectedBeatIds)
		};
	}

	async function fetchCostPrediction() {
		const payload = buildRecordingReleaseRequest();
		if (!payload) return;

		const requestId = ++costPredictionRequestId;
		loadingCost = true;
		costPrediction = null;

		try {
			const prediction = await predictRecordingReleaseCost(payload);
			if (requestId === costPredictionRequestId) {
				costPrediction = prediction;
			}
		} catch (err) {
			if (requestId === costPredictionRequestId) {
				costPrediction = null;
			}
			console.error('Failed to fetch recording release cost prediction', err);
		} finally {
			if (requestId === costPredictionRequestId) {
				loadingCost = false;
			}
		}
	}

	async function handleStartRecording() {
		const payload = buildRecordingReleaseRequest();
		if (!payload) {
			error = 'Missing recording details. Please fill out the form.';
			return;
		}

		loading = true;
		error = null;

		try {
			const response = await createRecordingReleaseTask(payload);

			// Update bankroll in appState
			appState.updateCurrentLabelBankroll(-response.budgetRequired);

			// Invalidate tasks and beats queries to refetch
			if ($currentLabel) {
				queryClient.invalidateQueries({ queryKey: queryKeys.tasks.byLabel($currentLabel.id) });
				queryClient.invalidateQueries({ queryKey: queryKeys.beats.byLabel($currentLabel.id) });
			}

			modalStore.close();
		} catch (err) {
			if (err instanceof TaskCreationError) {
				error = getTaskErrorMessage(err.errorResponse.code, err.errorResponse.message);
			} else {
				error = 'Failed to create recording release task. Please try again.';
			}
			console.error(err);
		} finally {
			loading = false;
		}
	}

	// Event handlers
	function handleCancel() {
		modalStore.close();
	}

	function handleStepChange(event: { detail: number }) {
		activeStepIndex = event.detail;
	}

	function handlePreviousStep() {
		if (activeStepIndex > 0) {
			activeStepIndex -= 1;
		}
	}

	function handleNextStep() {
		if (activeStepIndex < totalSteps - 1) {
			activeStepIndex += 1;
		}
	}

	function toggleBeatSelection(beatId: string) {
		if (selectedBeatIds.has(beatId)) {
			selectedBeatIds.delete(beatId);
		} else {
			selectedBeatIds.add(beatId);
		}
		selectedBeatIds = selectedBeatIds; // Trigger reactivity
	}

	// Step validation
	$: step1Valid =
		selectedRapperId !== null && selectedReleaseTypeId !== null && selectedGenre !== null;
	$: step2Valid = beatsSelectionValid;
</script>

<ScrollableContainer {error}>
	<svelte:fragment slot="header">
		<Stepper
			selectedButtonColor={colors.primary[300]}
			selectedTextColor={colors.primary[500]}
			buttonColor="dimgray"
			stepLabels={['Artist & Style', 'Beats Selection', 'Start Recording']}
			{activeStepIndex}
			hideLabelsOnMobile={true}
			on:stepClicked={handleStepChange}
		/>
	</svelte:fragment>
	<svelte:fragment>
		<ContentPanel
			class="pt-0 p-4 max-w-xl lg:max-w-3xl xl:max-w-4xl mx-auto h-full"
			{activeStepIndex}
			transition="slide"
			duration={300}
		>
			<!-- Step 1: Release Configuration -->
			<ContentPanelItem class="space-y-8 text-white pb-8">
				<div class="space-y-4">
					<p class="text-sm sm:text-base text-gray-300 leading-relaxed max-w-3xl">
						Configure your release by selecting the release type (single, album, EP, mixtape), the
						music style, and the artist who will record it. Each release type has different track
						requirements and will affect production costs and duration.
					</p>

					<div class="space-y-6 pt-4">
						<!-- Release Type Selection -->
						<div class="space-y-2">
							<label
								class="text-xs lg:text-sm xl:text-base font-semibold text-gray-400 uppercase tracking-wider"
								for="release-type-btn"
							>
								Release Type
							</label>
							<Dropdown
								options={releaseTypeChoices}
								disabled={releaseTypeChoices.length === 0}
								bind:value={selectedReleaseTypeId}
								placeholder="Choose release type..."
								direction="down"
							/>
							{#if selectedReleaseType}
								<p class="text-xs text-gray-400 mt-1">
									{selectedReleaseType.description} (Requires {selectedReleaseType.minTracks}-{selectedReleaseType.maxTracks}
									tracks)
								</p>
							{/if}
						</div>

						<!-- Genre Selection -->
						<SelectField
							label="Music Style / Genre"
							choices={genreChoices}
							mode="toggle"
							bind:value={selectedGenre}
							labelFor="genre-btn"
						/>
					</div>
				</div>
			</ContentPanelItem>

			<!-- Step 2: Beats Selection -->
			<ContentPanelItem class="space-y-6 text-white pb-8">
				<div class="space-y-4">
					<p class="text-sm sm:text-base text-gray-300 leading-relaxed max-w-3xl">
						Select the beats for your release. Only beats matching the chosen genre and that are not
						already sold are available. You must select at least {minTracksRequired}
						{minTracksRequired === 1 ? 'beat' : 'beats'}
						{#if maxTracksAllowed < 99}and at most {maxTracksAllowed} beats{/if}.
					</p>

					<div class="flex items-center gap-3 text-sm">
						<span class="text-gray-400">
							Selected: <span class="font-semibold text-white"
								>{selectedBeatIds.size} / {minTracksRequired}</span
							>
						</span>
						{#if !beatsSelectionValid && selectedBeatIds.size > 0}
							<span class="text-red-400">
								{selectedBeatIds.size < minTracksRequired
									? `Need ${minTracksRequired - selectedBeatIds.size} more`
									: `Too many selected (max ${maxTracksAllowed})`}
							</span>
						{/if}
					</div>

					{#if filteredBeats.length === 0}
						<div class="text-center py-8">
							<p class="text-gray-400">
								No beats available for the selected genre. Please produce some beats first or choose
								a different genre.
							</p>
						</div>
					{:else}
						<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
							{#each filteredBeats as beat (beat.id)}
								<button
									type="button"
									class="p-4 rounded-lg border-2 transition-all text-left {selectedBeatIds.has(
										beat.id
									)
										? 'border-purple-500 bg-purple-500/10'
										: 'border-gray-600 bg-gray-800 hover:border-gray-500'}"
									on:click={() => toggleBeatSelection(beat.id)}
								>
									<div class="flex items-start justify-between gap-2">
										<div class="flex-1 min-w-0">
											<h4 class="font-semibold text-white truncate">{beat.title}</h4>
											<p class="text-xs text-gray-400 mt-1">
												BPM: {beat.bpm} • Rating: {beat.rating}/100
											</p>
										</div>
										{#if selectedBeatIds.has(beat.id)}
											<Chip class="flex-shrink-0">Selected</Chip>
										{/if}
									</div>
								</button>
							{/each}
						</div>
					{/if}
				</div>
			</ContentPanelItem>

			<!-- Step 3: Review & Cost -->
			<ContentPanelItem class="pb-8">
				<div class="space-y-4 sm:space-y-6 lg:space-y-8">
					<p class="text-sm sm:text-base text-gray-300 leading-relaxed max-w-3xl">
						Review the estimated costs for your release. Once you start recording, the selected
						beats will be used and the budget will be deducted from your label's bankroll.
					</p>
					<CostEstimation {costPrediction} loading={loadingCost} />
				</div>
			</ContentPanelItem>
		</ContentPanel>
	</svelte:fragment>

	<svelte:fragment slot="footer">
		<!-- Rapper Selection in Footer -->
		<div class="flex gap-3 lg:gap-4 items-center sm:mr-auto">
			<label
				class="text-xs lg:text-sm xl:text-base font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap"
				for="rapper-btn"
			>
				Rapper
			</label>
			<Dropdown
				options={rappersSelection}
				disabled={rappersSelection.length <= 1}
				bind:value={selectedRapperId}
				placeholder="Choose rapper..."
				direction="up"
			/>
		</div>

		<!-- Action Buttons -->
		<ContentPanel {activeStepIndex} class="w-full sm:w-auto">
			<!-- Step 1 Actions -->
			<ContentPanelItem class="flex flex-col sm:flex-row gap-2 sm:gap-3 lg:gap-4 justify-end">
				<Button
					class="w-full sm:w-auto sm:min-w-32 lg:min-w-40 xl:min-w-44"
					color="primary"
					style="hollow"
					altText="Cancel recording release"
					on:clicked={handleCancel}
				>
					Cancel
				</Button>
				<Button
					disabled={!step1Valid || !selectedRapperId}
					class="w-full sm:w-auto sm:min-w-32 lg:min-w-40 xl:min-w-44"
					color="primary"
					altText="Proceed to beats selection"
					on:clicked={handleNextStep}
				>
					Next
				</Button>
			</ContentPanelItem>

			<!-- Step 2 Actions -->
			<ContentPanelItem class="flex flex-col sm:flex-row gap-2 sm:gap-3 lg:gap-4 justify-end">
				<Button
					class="w-full sm:w-auto sm:min-w-32 lg:min-w-40 xl:min-w-44"
					color="primary"
					style="hollow"
					altText="Cancel recording release"
					on:clicked={handleCancel}
				>
					Cancel
				</Button>
				<Button
					class="w-full sm:w-auto sm:min-w-32 lg:min-w-40 xl:min-w-44"
					color="primary"
					altText="Go back to release configuration"
					on:clicked={handlePreviousStep}
				>
					Previous
				</Button>
				<Button
					disabled={!step2Valid}
					class="w-full sm:w-auto sm:min-w-32 lg:min-w-40 xl:min-w-44"
					color="primary"
					altText="Proceed to cost review"
					on:clicked={handleNextStep}
				>
					Next
				</Button>
			</ContentPanelItem>

			<!-- Step 3 Actions -->
			<ContentPanelItem class="flex flex-col sm:flex-row gap-2 sm:gap-3 lg:gap-4 justify-end">
				<Button
					class="w-full sm:w-auto sm:min-w-32 lg:min-w-40 xl:min-w-44"
					color="primary"
					style="hollow"
					altText="Cancel recording release"
					on:clicked={handleCancel}
				>
					Cancel
				</Button>
				<Button
					class="w-full sm:w-auto sm:min-w-32 lg:min-w-40 xl:min-w-44"
					color="primary"
					altText="Go back to beats selection"
					on:clicked={handlePreviousStep}
				>
					Previous
				</Button>
				<Button
					class="w-full sm:w-auto sm:min-w-48 lg:min-w-56 xl:min-w-64"
					color="secondary"
					style="normal"
					altText="Start recording release"
					{loading}
					disabled={!readyForCostPrediction || loading}
					on:clicked={handleStartRecording}
				>
					{loading ? 'Starting...' : 'Start Recording'}
				</Button>
			</ContentPanelItem>
		</ContentPanel>
	</svelte:fragment>
</ScrollableContainer>
