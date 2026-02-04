<script lang="ts">
	import { onMount } from 'svelte';
	import { modalStore } from '$lib/stores/modal';
	import { appState, currentLabel, currentPlayer } from '$lib/stores/appState';
	import { createScoutingTask, predictScoutingCost, TaskCreationError } from '$lib/api';
	import { loadClientConfig } from '$lib/services/config';
	import { queryKeys, queryClient } from '$lib/queries/queryClient';
	import { RapMusicStyle, RapMusicStyleNames } from '$lib/types/musicStyles';
	import {
		ScoutingType,
		ScoutingTypeNames,
		type ScoutingScope
	} from '$lib/types/scoutingArtistsTask';
	import SelectField from '$lib/components/formfields/SelectField.svelte';
	import Button from '$lib/components/Button.svelte';
	import Stepper from '$lib/components/Stepper.svelte';
	import Dropdown from '$lib/components/Dropdown.svelte';
	import ContentPanel from '$lib/components/ContentPanel.svelte';
	import ContentPanelItem from '$lib/components/ContentPanelItem.svelte';
	import { colors } from '$lib/theme';
	import CostEstimation from './CostEstimation.svelte';
	import { TaskCreationErrorType, type TaskCostPrediction } from '$lib/types/task';
	import ScrollableContainer from '$lib/components/ScrollableContainer.svelte';

	// State
	let scoutingType: ScoutingType = ScoutingType.Rappers;
	let selectedScope: string | null = null;
	let selectedGenres: Set<RapMusicStyle> = new Set();
	let scoutingScopes: ScoutingScope[] = [];
	let loading = false;
	let error: string | null = null;
	let costPrediction: TaskCostPrediction | null = null;
	let loadingCost = false;
	let readyForPrediction = false;
	let selectedProspectorId = 1;
	let currentStep = 0;
	let costPredictionRequestId = 0;

	const stepLabels = ['scouting parameters', 'review & start scouting'];
	const lastStepIndex = stepLabels.length - 1;
	const prospectorOptions = [{ name: 'you', value: 1 }];

	// Computed choices
	$: scoutingTypeChoices = [
		{ name: ScoutingTypeNames[ScoutingType.Rappers], value: ScoutingType.Rappers },
		{ name: ScoutingTypeNames[ScoutingType.Beatmakers], value: ScoutingType.Beatmakers }
	];

	$: scopeChoices = scoutingScopes.map((scope) => ({
		name: scope.displayName,
		value: scope.id,
		title: scope.description
	}));

	$: genreChoices = Object.values(RapMusicStyle)
		.filter((v) => typeof v === 'number')
		.map((genre) => ({
			name: RapMusicStyleNames[genre as RapMusicStyle],
			value: genre
		}));

	$: readyForPrediction = Boolean(
		$currentLabel && $currentPlayer && selectedScope && selectedGenres.size > 0 && currentStep === 1
	);

	$: if (readyForPrediction) {
		fetchCostPrediction();
	}

	// Lifecycle
	onMount(async () => {
		try {
			const config = await loadClientConfig();
			scoutingScopes = config.scoutingScopes;
			selectedScope = scoutingScopes.length > 0 ? scoutingScopes[0].id : null;
		} catch (err) {
			error = 'Failed to load scouting scopes';
			console.error(err);
		}
	});

	// Functions
	async function fetchCostPrediction() {
		if (!$currentLabel || !$currentPlayer || !selectedScope || selectedGenres.size === 0) return;

		const requestId = ++costPredictionRequestId;
		loadingCost = true;
		costPrediction = null;

		try {
			const predictionRequest = {
				labelId: $currentLabel.id,
				workerId: $currentPlayer.id,
				scoutingType,
				productionStyles: Array.from(selectedGenres),
				scopeId: selectedScope
			};

			const prediction = await predictScoutingCost(predictionRequest);
			if (requestId === costPredictionRequestId) {
				costPrediction = prediction;
			}
		} catch (err) {
			console.error('Failed to fetch cost prediction:', err);
		} finally {
			if (requestId === costPredictionRequestId) {
				loadingCost = false;
			}
		}
	}

	function getErrorMessage(errorCode: number, defaultMessage: string): string {
		const errorMessages: Record<number, string> = {
			[TaskCreationErrorType.NotFound]: 'Resource not found. Please try again.',
			[TaskCreationErrorType.ValidationError]: 'Invalid request. Please check your selections.',
			[TaskCreationErrorType.InsufficientBudget]:
				'Insufficient budget. You need more funds to start this scouting task.',
			[TaskCreationErrorType.WorkerBusy]:
				'You are already assigned to another active task. Complete it first.',
			[TaskCreationErrorType.TaskLimitReached]:
				'Your label has reached the maximum number of active tasks.',
			[TaskCreationErrorType.ActiveContractExists]: 'This artist already has an active contract.',
			[TaskCreationErrorType.WorkerExhausted]:
				'You are exhausted and need to rest before taking on new tasks.'
		};
		return errorMessages[errorCode] || defaultMessage;
	}

	async function handleStartScouting() {
		if (!$currentLabel) {
			error = 'No label found';
			return;
		}
		if (!$currentPlayer) {
			error = 'No player found';
			return;
		}
		if (!selectedScope) {
			error = 'Please select a coverage option';
			return;
		}
		if (selectedGenres.size === 0) {
			error = 'Please select at least one genre';
			return;
		}

		loading = true;
		error = null;

		try {
			const taskRequest = {
				labelId: $currentLabel.id,
				workerId: $currentPlayer.id,
				scoutingType: scoutingType,
				productionStyles: Array.from(selectedGenres),
				scopeId: selectedScope
			};

			const response = await createScoutingTask(taskRequest);

			// Update bankroll in appState
			appState.updateCurrentLabelBankroll(-response.budgetRequired);

			// Invalidate tasks query to refetch
			queryClient.invalidateQueries({ queryKey: queryKeys.tasks.byLabel($currentLabel.id) });

			modalStore.close();
		} catch (err) {
			if (err instanceof TaskCreationError) {
				error = getErrorMessage(err.errorResponse.code, err.errorResponse.message);
			} else {
				error = 'Failed to create scouting task. Please try again.';
			}
			console.error(err);
		} finally {
			loading = false;
		}
	}

	function handleCancel() {
		modalStore.close();
	}

	function setStep(nextStep: number) {
		currentStep = Math.max(0, Math.min(nextStep, lastStepIndex));
	}

	function handleNextStep() {
		setStep(currentStep + 1);
	}

	function handlePreviousStep() {
		setStep(currentStep - 1);
	}

	function handleStepChange(event: { detail: number }) {
		setStep(event.detail);
	}
</script>

<ScrollableContainer {error}>
	<svelte:fragment slot="header">
		<Stepper
			selectedButtonColor={colors.primary[300]}
			selectedTextColor={colors.primary[500]}
			buttonColor="dimgray"
			{stepLabels}
			activeStepIndex={currentStep}
			hideLabelsOnMobile={true}
			on:stepClicked={handleStepChange}
		/>
	</svelte:fragment>
	<svelte:fragment>
		<ContentPanel
			class="pt-0 p-4 max-w-xl lg:max-w-3xl xl:max-w-4xl mx-auto"
			activeStepIndex={currentStep}
			transition="slide"
			duration={300}
		>
			<!-- Step 1: Scouting Parameters -->
			<ContentPanelItem
				class="space-y-8 sm:space-y-12 lg:space-y-16 xl:space-y-20 text-white pb-8 2xl:pl-40"
			>
				<SelectField
					label="Scout for"
					choices={scoutingTypeChoices}
					mode="toggle"
					bind:value={scoutingType}
					defaultValue={ScoutingType.Rappers}
					labelFor="scouting-type-btn"
				/>

				<SelectField
					label="Coverage"
					choices={scopeChoices}
					mode="toggle"
					bind:value={selectedScope}
					labelFor="scouting-scope-btn"
				/>

				<SelectField
					label="Genre(s)"
					choices={genreChoices}
					mode="multi"
					bind:value={selectedGenres}
					labelFor="genre-btn"
				/>
			</ContentPanelItem>

			<!-- Step 2: Review & Cost -->
			<ContentPanelItem class="pb-8">
				<div class="space-y-4 sm:space-y-6 lg:space-y-8">
					{#if loadingCost}
						<div class="flex items-center justify-center py-8 lg:py-12">
							<div
								class="animate-spin rounded-full h-8 w-8 lg:h-12 lg:w-12 border-b-2 border-indigo-600"
							></div>
						</div>
					{:else if costPrediction}
						<CostEstimation {costPrediction} />
					{:else}
						<div class="text-center py-8 lg:py-12 text-gray-500 lg:text-lg">
							No cost estimation available.
						</div>
					{/if}
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
				Prospector
			</label>
			<Dropdown
				options={prospectorOptions}
				disabled={prospectorOptions.length <= 1}
				bind:value={selectedProspectorId}
				placeholder="Choose..."
				direction="up"
				on:change={(e) => console.log('Selected:', e.detail)}
			/>
		</div>

		<!-- Action Buttons -->
		<ContentPanel activeStepIndex={currentStep} class="w-full sm:w-auto">
			<ContentPanelItem class="flex flex-col sm:flex-row gap-2 sm:gap-3 lg:gap-4 justify-end">
				<Button
					class="w-full sm:w-auto sm:min-w-32 lg:min-w-40 xl:min-w-44"
					color="primary"
					style="hollow"
					altText="Cancel scouting task"
					on:clicked={handleCancel}
				>
					Cancel
				</Button>
				<Button
					disabled={selectedGenres.size === 0}
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
					altText="Cancel scouting task"
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
					altText="Start scouting for talents"
					{loading}
					on:clicked={handleStartScouting}
				>
					{loading ? 'Starting...' : 'Start Scouting'}
				</Button>
			</ContentPanelItem>
		</ContentPanel></svelte:fragment
	>
</ScrollableContainer>
