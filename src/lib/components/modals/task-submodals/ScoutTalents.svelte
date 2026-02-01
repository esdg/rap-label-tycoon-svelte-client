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

	let scoutingType: ScoutingType = ScoutingType.Rappers;
	let selectedScope: string | null = null;
	let selectedGenres: Set<RapMusicStyle> = new Set();
	let scoutingScopes: ScoutingScope[] = [];
	let loading = false;
	let error: string | null = null;
	let costPrediction: ScoutingCostPrediction | null = null;
	let loadingCost = false;

	let selectedProspectorId = 1;

	const options = [
		{ name: 'you', value: 1 }
		//{ name: 'Disabled Option', value: 3, disabled: true }
	];

	// Prepare choices for SelectField components
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

	onMount(async () => {
		try {
			scoutingScopes = await fetchScoutingScopes();
			selectedScope = scoutingScopes.length > 0 ? scoutingScopes[0].id : null;
		} catch (err) {
			error = 'Failed to load scouting scopes';
			console.error(err);
		}
	});

	// Reactive statement to fetch cost prediction when parameters change
	$: if ($label && $player && selectedScope && selectedGenres.size > 0 && currentStep === 1) {
		fetchCostPrediction();
	}

	async function fetchCostPrediction() {
		if (!$label || !$player || !selectedScope || selectedGenres.size === 0) {
			return;
		}

		loadingCost = true;
		costPrediction = null;

		try {
			const predictionRequest = {
				labelId: $label.id,
				workerId: $player.id,
				scoutingType: scoutingType,
				productionStyles: Array.from(selectedGenres),
				scopeId: selectedScope
			};

			costPrediction = await predictScoutingCost(predictionRequest);
		} catch (err) {
			console.error('Failed to fetch cost prediction:', err);
		} finally {
			loadingCost = false;
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

			// Add task to store
			addScoutingTask(response);

			// Update label bankroll
			updateLabelBankroll(-response.budgetRequired);

			// Close modal
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

	let currentStep = 0;

	function handleStepChange(event: { detail: number }) {
		currentStep = event.detail;
		console.log('Step changed to:', currentStep);
	}
</script>

<section class="flex flex-col h-full" aria-label="Scout Talents">
	<div class="w-full max-w-96 mx-auto mt-6 mb-24">
		<Stepper
			selectedButtonColor={colors.primary[300]}
			selectedTextColor={colors.primary[500]}
			buttonColor="dimgray"
			stepLabels={['scouting parameters', 'review & start scouting']}
			activeStepIndex={currentStep}
			on:stepClicked={handleStepChange}
		/>
	</div>

	<div class="flex-grow">
		<ContentPanel
			class="pt-0 p-4 max-w-xl mx-auto"
			activeStepIndex={currentStep}
			transition="slide"
			duration={300}
		>
			<ContentPanelItem class="space-y-16  text-white">
				<!-- Scout For -->
				<SelectField
					label="Scout for"
					choices={scoutingTypeChoices}
					mode="toggle"
					bind:value={scoutingType}
					defaultValue={ScoutingType.Rappers}
					labelFor="scouting-type-btn"
				/>

				<!-- Coverage -->
				<SelectField
					label="Coverage"
					choices={scopeChoices}
					mode="toggle"
					bind:value={selectedScope}
					labelFor="scouting-scope-btn"
				/>

				<!-- Genre -->
				<SelectField
					label="Genre(s)"
					choices={genreChoices}
					mode="multi"
					bind:value={selectedGenres}
					labelFor="genre-btn"
				/>
			</ContentPanelItem>
			<ContentPanelItem>
				<div class="space-y-6">
					{#if loadingCost}
						<div class="flex items-center justify-center py-8">
							<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
						</div>
					{:else if costPrediction}
						<div class="grid grid-cols-1 md:grid-cols-1 gap-4">
							<div class="bg-gray-900 rounded-md p-4">
								<div class="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">
									Budget Required
								</div>
								<div class="text-2xl font-bold text-white text-right">
									$ {costPrediction.budgetRequired.toLocaleString()}
								</div>
							</div>

							<div class="bg-gray-900 rounded-md p-4">
								<div class="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">
									Duration
								</div>
								<div class="text-2xl font-bold text-white text-right">
									{formatDuration(costPrediction.duration)}
								</div>
							</div>

							<div class="bg-gray-900 rounded-md p-4">
								<div class="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">
									Stamina Cost
								</div>
								<div class="text-2xl font-bold text-white text-right">
									{costPrediction.staminaCost}
								</div>
							</div>
						</div>
					{:else}
						<div class="text-center py-8 text-gray-500">No cost estimation available</div>
					{/if}
				</div>
			</ContentPanelItem>
		</ContentPanel>
	</div>
	{#if error}
		<div class="px-4 py-2 bg-error-900/50 text-error-500 text-sm animate-in fade-in duration-200">
			{error}
		</div>
	{/if}

	<div class="w-full flex bg-black py-2 px-4 bt-2 border-t border-gray-700">
		<!-- Prospector -->
		<div class="flex gap-3 items-center">
			<label
				class="text-xs font-semibold text-gray-600 uppercase tracking-wider inline-block align-middle"
				for="prospector-btn">Prospector</label
			>
			<Dropdown
				{options}
				disabled={options.length <= 1 ? true : false}
				bind:value={selectedProspectorId}
				placeholder="Choose..."
				direction="up"
				on:change={(e) => console.log('Selected:', e.detail)}
			/>
		</div>
		<ContentPanel activeStepIndex={currentStep}>
			<ContentPanelItem class="flex gap-3 justify-end">
				<!-- Actions -->

				<Button
					class="min-w-32"
					color="blue"
					style="hollow"
					text="Cancel"
					altText="Cancel scouting task"
					on:clicked={handleCancel}
				/>
				<Button
					disabled={selectedGenres.size === 0}
					class="min-w-32"
					color="blue"
					text="Next"
					altText="Proceed to next step"
					on:clicked={() => currentStep++}
				/>
			</ContentPanelItem>
			<ContentPanelItem class="flex gap-3 justify-end">
				<!-- Actions -->
				<Button
					class="min-w-32"
					color="blue"
					style="hollow"
					text="Cancel"
					altText="Cancel scouting task"
					on:clicked={handleCancel}
				/>
				<Button
					class="min-w-32"
					color="blue"
					style="hollow"
					text="Previous"
					altText="Proceed to previous step"
					on:clicked={() => currentStep--}
				/>
				<Button
					class="min-w-48"
					color="blue"
					style="normal"
					text={loading ? 'Starting...' : 'Start Scouting'}
					altText="Start scouting for talents"
					{loading}
					on:clicked={handleStartScouting}
				/>
			</ContentPanelItem>
		</ContentPanel>
	</div>
</section>
