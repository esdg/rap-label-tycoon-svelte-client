<script lang="ts">
	import { colors } from '$lib/theme';
	import { modalStore } from '$lib/stores/modal';
	import { appState, currentLabel, currentPlayer } from '$lib/stores/appState';
	import { createLabelTasksQuery, createTasksByType } from '$lib/queries/taskQueries';
	import { createContractsByIdsQuery } from '$lib/queries/contractQueries';
	import { createArtistsByIdsQuery } from '$lib/queries/artistQueries';
	import { queryKeys, queryClient } from '$lib/queries/queryClient';
	import { ContractStatus } from '$lib/types/contracts';
	import { RapMusicStyle, RapMusicStyleNames } from '$lib/types/musicStyles';
	import Stepper from '$lib/components/Stepper.svelte';
	import ContentPanel from '$lib/components/ContentPanel.svelte';
	import ContentPanelItem from '$lib/components/ContentPanelItem.svelte';
	import ScrollableContainer from '$lib/components/ScrollableContainer.svelte';
	import Dropdown from '$lib/components/Dropdown.svelte';
	import NumericField from '$lib/components/formfields/NumericField.svelte';
	import SelectField from '$lib/components/formfields/SelectField.svelte';
	import Button from '$lib/components/Button.svelte';
	import CostEstimation from './CostEstimation.svelte';
	import {
		predictProducingBeatsCost,
		createProducingBeatsTask,
		TaskCreationError,
		type ProducingBeatsRequest
	} from '$lib/api';
	import type { Beatmaker } from '$lib/types/nonPlayingCharacter';
	import type { TaskCostPrediction } from '$lib/types/task';
	import { getTaskErrorMessage } from '$lib/utils';

	// State
	let activeStepIndex = 0;
	let totalSteps = 2;
	let error: string | null = null;
	let loading = false;
	let loadingCost = false;
	let costPrediction: TaskCostPrediction | null = null;
	let costPredictionRequestId = 0;

	let beatmakersSelection: Array<{ name: string; value: string }> = [];
	let selectedBeatmakerId: string | null = null;
	let numberOfBeats: number | null = 1;
	let selectedGenres: Set<RapMusicStyle> = new Set();

	// Reactive queries - using the same pattern as label dashboard
	$: labelId = $currentLabel?.id || null;
	$: tasksQuery = createLabelTasksQuery(labelId);

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

	// Filter only beatmakers and map to dropdown format
	$: beatmakersSelection = (
		($artistsQuery.data?.filter((artist): artist is Beatmaker => 'beatmakingSkills' in artist) ||
			[]) as Beatmaker[]
	).map((beatmaker) => ({
		name: beatmaker.stageName,
		value: beatmaker.id
	}));

	// Auto-select if only one beatmaker available
	$: if (beatmakersSelection.length === 1 && !selectedBeatmakerId) {
		selectedBeatmakerId = beatmakersSelection[0].value;
	}

	// Genre choices for the beat
	$: genreChoices = Object.values(RapMusicStyle)
		.filter((v) => typeof v === 'number')
		.map((genre) => ({
			name: RapMusicStyleNames[genre as RapMusicStyle],
			value: genre
		}));

	// Ready for cost prediction when on step 1 with valid data
	$: readyForCostPrediction =
		Boolean($currentLabel && $currentPlayer && selectedBeatmakerId) &&
		activeStepIndex >= 1 &&
		numberOfBeats !== null &&
		numberOfBeats > 0 &&
		selectedGenres.size > 0;

	$: if (!readyForCostPrediction) {
		costPrediction = null;
	}

	$: if (readyForCostPrediction) {
		fetchCostPrediction();
	}

	// Set loading/error states
	$: if ($tasksQuery.isLoading || $contractsQuery.isLoading || $artistsQuery.isLoading) {
		error = null;
	} else if ($tasksQuery.error) {
		error = `Failed to load tasks: ${$tasksQuery.error.message}`;
	} else if ($contractsQuery.error) {
		error = `Failed to load contracts: ${$contractsQuery.error.message}`;
	} else if ($artistsQuery.error) {
		error = `Failed to load beatmakers: ${$artistsQuery.error.message}`;
	}

	// Functions
	function buildProducingBeatsRequest(): ProducingBeatsRequest | null {
		if (!$currentLabel || !selectedBeatmakerId || !numberOfBeats || selectedGenres.size === 0) {
			return null;
		}

		return {
			labelId: $currentLabel.id,
			beatmakerId: selectedBeatmakerId,
			numberOfBeats: numberOfBeats,
			productionStyles: Array.from(selectedGenres)
		};
	}

	async function fetchCostPrediction() {
		const payload = buildProducingBeatsRequest();
		if (!payload) return;

		const requestId = ++costPredictionRequestId;
		loadingCost = true;
		costPrediction = null;

		try {
			const prediction = await predictProducingBeatsCost(payload);
			if (requestId === costPredictionRequestId) {
				costPrediction = prediction;
			}
		} catch (err) {
			if (requestId === costPredictionRequestId) {
				costPrediction = null;
			}
			console.error('Failed to fetch beat production cost prediction', err);
		} finally {
			if (requestId === costPredictionRequestId) {
				loadingCost = false;
			}
		}
	}

	async function handleProduceBeat() {
		const payload = buildProducingBeatsRequest();
		if (!payload) {
			error = 'Missing production details. Please fill out the form.';
			return;
		}

		loading = true;
		error = null;

		try {
			const response = await createProducingBeatsTask(payload);

			// Update bankroll in appState
			appState.updateCurrentLabelBankroll(-response.budgetRequired);

			// Invalidate tasks query to refetch
			if ($currentLabel) {
				queryClient.invalidateQueries({ queryKey: queryKeys.tasks.byLabel($currentLabel.id) });
			}

			modalStore.close();
		} catch (err) {
			if (err instanceof TaskCreationError) {
				error = getTaskErrorMessage(err.errorResponse.code, err.errorResponse.message);
			} else {
				error = 'Failed to create producing beats task. Please try again.';
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
</script>

<ScrollableContainer {error}>
	<svelte:fragment slot="header">
		<Stepper
			selectedButtonColor={colors.primary[300]}
			selectedTextColor={colors.primary[500]}
			buttonColor="dimgray"
			stepLabels={['Beat Production', 'Review & Produce']}
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
			<!-- Step 1: Production Parameters -->
			<ContentPanelItem class="space-y-8 text-white pb-8">
				<div class="space-y-4">
					<p class="text-sm sm:text-base text-gray-300 leading-relaxed max-w-3xl">
						Select a beatmaker and choose how many beats you want to produce. Each beatmaker has
						different efficiency, affecting the total cost, production time, and stamina
						consumption. The number of beats you request will directly scale these values. Before
						starting production, review the summary carefully to make sure your resources and
						stamina can handle the workload. Smart planning keeps your label moving forward.
					</p>
					<div class="flex flex-col items-center gap-4 pt-4">
						<NumericField
							label="Number of Beats"
							id="number-of-beats"
							bind:value={numberOfBeats}
							step={1}
							min={1}
							max={20}
							class="w-full max-w-xs"
						/>
					</div>
				</div>

				<SelectField
					label="Production Style(s)"
					choices={genreChoices}
					mode="multi"
					bind:value={selectedGenres}
					labelFor="genre-btn"
				/>
			</ContentPanelItem>

			<!-- Step 2: Review & Cost -->
			<ContentPanelItem class="pb-8">
				<div class="space-y-4 sm:space-y-6 lg:space-y-8">
					<CostEstimation {costPrediction} loading={loadingCost} />
				</div>
			</ContentPanelItem>
		</ContentPanel>
	</svelte:fragment>

	<svelte:fragment slot="footer">
		<!-- Prospector -->
		<div class="flex gap-3 lg:gap-4 items-center sm:mr-auto">
			<label
				class="text-xs lg:text-sm xl:text-base font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap"
				for="prospector-btn"
			>
				Beatmaker
			</label>
			<Dropdown
				options={beatmakersSelection}
				disabled={beatmakersSelection.length <= 1}
				bind:value={selectedBeatmakerId}
				placeholder="Choose..."
				direction="up"
				on:change={(e) => console.log('Selected:', e.detail)}
			/>
		</div>

		<!-- Action Buttons -->
		<ContentPanel {activeStepIndex} class="w-full sm:w-auto">
			<ContentPanelItem class="flex flex-col sm:flex-row gap-2 sm:gap-3 lg:gap-4 justify-end">
				<Button
					class="w-full sm:w-auto sm:min-w-32 lg:min-w-40 xl:min-w-44"
					color="primary"
					style="hollow"
					altText="Cancel producing beats"
					on:clicked={handleCancel}
				>
					Cancel
				</Button>
				<Button
					disabled={!selectedBeatmakerId ||
						numberOfBeats === null ||
						numberOfBeats <= 0 ||
						selectedGenres.size === 0}
					class="w-full sm:w-auto sm:min-w-32 lg:min-w-40 xl:min-w-44"
					color="primary"
					altText="Proceed to next step"
					on:clicked={handleNextStep}
				>
					Next
				</Button>
			</ContentPanelItem>

			<ContentPanelItem class="flex flex-col sm:flex-row gap-2 sm:gap-3 lg:gap-4 justify-end">
				<Button
					class="w-full sm:w-auto sm:min-w-32 lg:min-w-40 xl:min-w-44"
					color="primary"
					style="hollow"
					altText="Cancel producing beats"
					on:clicked={handleCancel}
				>
					Cancel
				</Button>
				<Button
					class="w-full sm:w-auto sm:min-w-32 lg:min-w-40 xl:min-w-44"
					color="primary"
					altText="Proceed to previous step"
					on:clicked={handlePreviousStep}
				>
					Previous
				</Button>
				<Button
					class="w-full sm:w-auto sm:min-w-48 lg:min-w-56 xl:min-w-64"
					color="secondary"
					style="normal"
					altText="Start producing beats"
					{loading}
					disabled={!readyForCostPrediction || loading}
					on:clicked={handleProduceBeat}
				>
					{loading ? 'Starting...' : 'Produce Beats'}
				</Button>
			</ContentPanelItem>
		</ContentPanel>
	</svelte:fragment>
</ScrollableContainer>
