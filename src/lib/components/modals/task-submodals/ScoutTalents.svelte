<script lang="ts">
	import { onMount } from 'svelte';
	import { modalStore } from '$lib/stores/modal';
	import { label, updateLabelBankroll } from '$lib/stores/label';
	import { player } from '$lib/stores/player';
	import { addScoutingTask } from '$lib/stores/tasks';
	import {
		fetchScoutingScopes,
		createScoutingTask,
		predictScoutingCost,
		TaskCreationError
	} from '$lib/api';
	import { RapMusicStyle, RapMusicStyleNames } from '$lib/types/musicStyles';
	import {
		ScoutingType,
		ScoutingTypeNames,
		TaskCreationErrorType,
		type ScoutingScope,
		type ScoutingCostPrediction
	} from '$lib/types/scouting';
	import SelectField from '$lib/components/formfields/SelectField.svelte';
	import Button from '$lib/components/Button.svelte';
	import Stepper from '$lib/components/Stepper.svelte';
	import Dropdown from '$lib/components/Dropdown.svelte';
	import ContentPanel from '$lib/components/ContentPanel.svelte';
	import ContentPanelItem from '$lib/components/ContentPanelItem.svelte';
	import { formatDuration } from '$lib/utils/formatDuration';
	import { colors } from '$lib/theme';

	// State
	let scoutingType: ScoutingType = ScoutingType.Rappers;
	let selectedScope: string | null = null;
	let selectedGenres: Set<RapMusicStyle> = new Set();
	let scoutingScopes: ScoutingScope[] = [];
	let loading = false;
	let error: string | null = null;
	let costPrediction: ScoutingCostPrediction | null = null;
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
		$label && $player && selectedScope && selectedGenres.size > 0 && currentStep === 1
	);

	$: if (readyForPrediction) {
		fetchCostPrediction();
	}

	// Lifecycle
	onMount(async () => {
		try {
			scoutingScopes = await fetchScoutingScopes();
			selectedScope = scoutingScopes.length > 0 ? scoutingScopes[0].id : null;
		} catch (err) {
			error = 'Failed to load scouting scopes';
			console.error(err);
		}
	});

	// Functions
	async function fetchCostPrediction() {
		if (!$label || !$player || !selectedScope || selectedGenres.size === 0) return;

		const requestId = ++costPredictionRequestId;
		loadingCost = true;
		costPrediction = null;

		try {
			const predictionRequest = {
				labelId: $label.id,
				workerId: $player.id,
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
		if (!$label) {
			error = 'No label found';
			return;
		}
		if (!$player) {
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
				labelId: $label.id,
				workerId: $player.id,
				scoutingType: scoutingType,
				productionStyles: Array.from(selectedGenres),
				scopeId: selectedScope
			};

			const response = await createScoutingTask(taskRequest);
			addScoutingTask(response);
			updateLabelBankroll(-response.budgetRequired);
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

<section class="flex flex-col h-full overflow-hidden" aria-label="Scout Talents">
	<!-- Stepper -->
	<div
		class="flex-shrink-0 w-full max-w-96 lg:max-w-2xl xl:max-w-3xl mx-auto mt-4 sm:mt-6 lg:mt-8 px-4 sm:px-0"
	>
		<Stepper
			selectedButtonColor={colors.primary[300]}
			selectedTextColor={colors.primary[500]}
			buttonColor="dimgray"
			{stepLabels}
			activeStepIndex={currentStep}
			hideLabelsOnMobile={true}
			on:stepClicked={handleStepChange}
		/>
	</div>

	<!-- Main Content - Scrollable -->
	<div class="flex-1 overflow-y-auto mt-8 sm:mt-16 lg:mt-24">
		<ContentPanel
			class="pt-0 p-4 max-w-xl lg:max-w-3xl xl:max-w-4xl mx-auto 2xl:pl-32"
			activeStepIndex={currentStep}
			transition="slide"
			duration={300}
		>
			<!-- Step 1: Scouting Parameters -->
			<ContentPanelItem class="space-y-8 sm:space-y-12 lg:space-y-16 xl:space-y-20 text-white pb-8">
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
						<div class="grid grid-cols-1 gap-3 sm:gap-4 lg:gap-6">
							<div class="bg-gray-900 rounded-md p-3 sm:p-4 lg:p-6">
								<div
									class="text-xs sm:text-sm lg:text-base font-medium text-gray-500 uppercase tracking-wider mb-1 lg:mb-2"
								>
									Budget Required
								</div>
								<div class="text-xl sm:text-2xl lg:text-3xl font-bold text-white text-right">
									$ {costPrediction.budgetRequired.toLocaleString()}
								</div>
							</div>

							<div class="bg-gray-900 rounded-md p-3 sm:p-4 lg:p-6">
								<div
									class="text-xs sm:text-sm lg:text-base font-medium text-gray-500 uppercase tracking-wider mb-1 lg:mb-2"
								>
									Duration
								</div>
								<div class="text-xl sm:text-2xl lg:text-3xl font-bold text-white text-right">
									{formatDuration(costPrediction.duration)}
								</div>
							</div>

							<div class="bg-gray-900 rounded-md p-3 sm:p-4 lg:p-6">
								<div
									class="text-xs sm:text-sm lg:text-base font-medium text-gray-500 uppercase tracking-wider mb-1 lg:mb-2"
								>
									Stamina Cost
								</div>
								<div class="text-xl sm:text-2xl lg:text-3xl font-bold text-white text-right">
									{costPrediction.staminaCost}
								</div>
							</div>
						</div>
					{:else}
						<div class="text-center py-8 lg:py-12 text-gray-500 lg:text-lg">
							No cost estimation available
						</div>
					{/if}
				</div>
			</ContentPanelItem>
		</ContentPanel>
	</div>

	<!-- Error Message -->
	{#if error}
		<div
			class="flex-shrink-0 px-4 lg:px-6 xl:px-8 py-2 lg:py-3 xl:py-4 bg-error-900/50 text-error-500 text-sm lg:text-base xl:text-lg animate-in fade-in duration-200"
		>
			{error}
		</div>
	{/if}

	<!-- Sticky Actions Bar -->
	<div
		class="flex-shrink-0 w-full bg-black py-3 lg:py-4 xl:py-5 px-3 sm:px-4 lg:px-6 xl:px-8 border-t border-gray-700 sticky bottom-0"
	>
		<div class="flex flex-col sm:flex-row gap-3 lg:gap-4 sm:items-center">
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
						text="Cancel"
						altText="Cancel scouting task"
						on:clicked={handleCancel}
					/>
					<Button
						disabled={selectedGenres.size === 0}
						class="w-full sm:w-auto sm:min-w-32 lg:min-w-40 xl:min-w-44"
						color="primary"
						text="Next"
						altText="Proceed to next step"
						on:clicked={handleNextStep}
					/>
				</ContentPanelItem>

				<ContentPanelItem class="flex flex-col sm:flex-row gap-2 sm:gap-3 lg:gap-4 justify-end">
					<Button
						class="w-full sm:w-auto sm:min-w-32 lg:min-w-40 xl:min-w-44"
						color="primary"
						style="hollow"
						text="Cancel"
						altText="Cancel scouting task"
						on:clicked={handleCancel}
					/>
					<Button
						class="w-full sm:w-auto sm:min-w-32 lg:min-w-40 xl:min-w-44"
						color="primary"
						style="hollow"
						text="Previous"
						altText="Proceed to previous step"
						on:clicked={handlePreviousStep}
					/>
					<Button
						class="w-full sm:w-auto sm:min-w-48 lg:min-w-56 xl:min-w-64"
						color="secondary"
						style="normal"
						text={loading ? 'Starting...' : 'Start Scouting'}
						altText="Start scouting for talents"
						{loading}
						on:clicked={handleStartScouting}
					/>
				</ContentPanelItem>
			</ContentPanel>
		</div>
	</div>
</section>
