<script lang="ts">
	import { onMount } from 'svelte';
	import { modalStore } from '$lib/stores/modal';
	import { appState, currentLabel, currentPlayer } from '$lib/stores/appState';
	import { predictScoutingCost, TaskCreationError } from '$lib/api';
	import { loadClientConfig } from '$lib/services/config';
	import { queryKeys, queryClient } from '$lib/queries/queryClient';
	import { createScoutingTaskMutation } from '$lib/queries/taskQueries';
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
	import { type TaskCostPrediction } from '$lib/types/task';
	import ScrollableContainer from '$lib/components/ScrollableContainer.svelte';
	import { getTaskErrorMessage } from '$lib/utils';

	// State
	let scoutingType: ScoutingType = ScoutingType.Rappers;
	let selectedScope: string | null = null;
	let selectedGenres: Set<RapMusicStyle> = new Set();
	let scoutingScopes: ScoutingScope[] = [];
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

	// Create the mutation (it's safe to create with null labelId initially)
	$: scoutingMutation = $currentLabel ? createScoutingTaskMutation($currentLabel.id) : null;

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

	function handleStartScouting() {
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
		if (!scoutingMutation) {
			error = 'Mutation not ready';
			return;
		}

		error = null;

		const taskRequest = {
			labelId: $currentLabel.id,
			workerId: $currentPlayer.id,
			scoutingType: scoutingType,
			productionStyles: Array.from(selectedGenres),
			scopeId: selectedScope
		};

		// Start the mutation (don't await it!)
		$scoutingMutation!.mutate(taskRequest, {
			onError: (err) => {
				// Error is already handled by mutation's onError
				// But we could show a toast notification here
				console.error('Scouting task creation failed:', err);
			}
		});

		// Close the modal immediately!
		modalStore.close();
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
			class="mx-auto max-w-xl p-4 lg:max-w-3xl xl:max-w-4xl"
			activeStepIndex={currentStep}
			transition="slide"
			duration={300}
		>
			<!-- Step 1: Scouting Parameters -->
			<ContentPanelItem
				class="space-y-8 pb-8 text-white sm:space-y-12 lg:space-y-16 xl:space-y-20 2xl:pl-40"
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
					<CostEstimation {costPrediction} loading={loadingCost} />
				</div>
			</ContentPanelItem>
		</ContentPanel>
	</svelte:fragment>
	<svelte:fragment slot="footer">
		<!-- Prospector -->
		<div class="flex items-center gap-3 sm:mr-auto lg:gap-4">
			<label
				class="whitespace-nowrap text-xs font-semibold uppercase tracking-wider text-gray-600 lg:text-sm xl:text-base"
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
			/>
		</div>

		<!-- Action Buttons -->
		<ContentPanel activeStepIndex={currentStep} class="w-full sm:w-auto">
			<ContentPanelItem class="flex flex-col justify-end gap-2 sm:flex-row sm:gap-3 lg:gap-4">
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

			<ContentPanelItem class="flex flex-col justify-end gap-2 sm:flex-row sm:gap-3 lg:gap-4">
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
					loading={$scoutingMutation?.isPending ?? false}
					on:clicked={handleStartScouting}
				>
					{$scoutingMutation?.isPending ? 'Starting...' : 'Start Scouting'}
				</Button>
			</ContentPanelItem>
		</ContentPanel>
	</svelte:fragment>
</ScrollableContainer>
