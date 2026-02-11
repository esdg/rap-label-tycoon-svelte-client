<script lang="ts">
	import { colors } from '$lib/theme';
	import { modalStore } from '$lib/stores/modal';
	import { appState, currentLabel } from '$lib/stores/appState';
	import {
		createLabelTasksQuery,
		createRestingTypesQuery,
		createTasksByType
	} from '$lib/queries/taskQueries';
	import { createContractsByIdsQuery } from '$lib/queries/contractQueries';
	import { createArtistsByIdsQuery } from '$lib/queries/artistQueries';
	import { queryClient, queryKeys } from '$lib/queries/queryClient';
	import { ContractStatus, type Contract } from '$lib/types/contracts';
	import {
		createRestingTask,
		predictRestingTaskCost,
		TaskCreationError,
		type RestingTaskRequest
	} from '$lib/api';
	import type { RestingType } from '$lib/types/resting';
	import type { TaskCostPrediction } from '$lib/types/task';
	import { getTaskErrorMessage } from '$lib/utils';
	import Stepper from '$lib/components/Stepper.svelte';
	import ContentPanel from '$lib/components/ContentPanel.svelte';
	import ContentPanelItem from '$lib/components/ContentPanelItem.svelte';
	import ScrollableContainer from '$lib/components/ScrollableContainer.svelte';
	import Button from '$lib/components/Button.svelte';
	import Dropdown from '$lib/components/Dropdown.svelte';
	import CostEstimation from './CostEstimation.svelte';

	// Props
	export let preselectedWorkerId: string | undefined = undefined;

	// State
	let activeStepIndex = 0;
	const totalSteps = 2;
	let error: string | null = null;
	let loading = false;
	let loadingCost = false;
	let costPrediction: TaskCostPrediction | null = null;
	let costPredictionRequestId = 0;

	let selectedRestingTypeIndex = 0;
	let selectedDurationHours: number | null = null;
	let workerOptions: Array<{ name: string; value: string }> = [];
	let selectedWorkerId: string | null = null;
	let restingTypes: RestingType[] = [];
	let selectedRestingType: RestingType | null = null;
	const emptyTaskSplit: ReturnType<typeof createTasksByType> = {
		scoutingTasks: [],
		contractTasks: [],
		beatProductionTasks: [],
		recordingReleaseTasks: [],
		restingTasks: []
	};

	let tasksQuery = createLabelTasksQuery(null);
	let contractsQuery = createContractsByIdsQuery([]);
	let artistsQuery = createArtistsByIdsQuery([]);
	let taskData: ReturnType<typeof createTasksByType> = emptyTaskSplit;
	let contractTasks: any[] = [];
	let contractIds: string[] = [];
	let uniqueContractIds: string[] = [];
	let validContracts: Contract[] = [];
	let validArtistIds: string[] = [];
	let minDurationHours = 1;
	let maxDurationHours = 1;
	let durationLabel = 'Select duration';
	let energyGain = 0;
	let baseBudgetEstimate = 0;
	let selectedWorkerName = 'Choose artist';
	let readyForCostPrediction = false;
	let wasReadyForCostPrediction = false;
	let step1Valid = false;
	let labelId: string | null = null;

	const restingTypesQuery = createRestingTypesQuery();

	// Reactive queries and derived data
	$: labelId = $currentLabel?.id || null;
	$: tasksQuery = createLabelTasksQuery(labelId);
	$: taskData = $tasksQuery?.data ? createTasksByType($tasksQuery.data) : emptyTaskSplit;
	$: contractTasks = taskData.contractTasks;
	$: contractIds = contractTasks
		.map((task) => task.contractId)
		.filter((id): id is string => typeof id === 'string' && id.length > 0);
	$: uniqueContractIds = [...new Set(contractIds)];
	$: contractsQuery = createContractsByIdsQuery(uniqueContractIds);
	$: validContracts = ($contractsQuery?.data ?? []).filter((contract) => {
		if (contract.status !== ContractStatus.Signed) return false;
		if (!contract.endDate) return true;
		return new Date(contract.endDate).getTime() > Date.now();
	});
	$: validArtistIds = validContracts
		.map((contract) => contract.artistId)
		.filter((id): id is string => typeof id === 'string' && id.length > 0);
	$: artistsQuery = createArtistsByIdsQuery(validArtistIds);
	$: workerOptions = ($artistsQuery?.data ?? []).map((artist) => ({
		name: artist.stageName ?? `${artist.firstName} ${artist.lastName}`,
		value: artist.id
	}));
	$: if (workerOptions.length === 1 && !selectedWorkerId) {
		selectedWorkerId = workerOptions[0].value;
	} else if (preselectedWorkerId && !selectedWorkerId && workerOptions.length > 0) {
		const preselected = workerOptions.find((w) => w.value === preselectedWorkerId);
		if (preselected) {
			selectedWorkerId = preselected.value;
		}
	} else if (
		selectedWorkerId &&
		!workerOptions.some((option) => option.value === selectedWorkerId)
	) {
		selectedWorkerId = workerOptions[0]?.value ?? null;
	}

	$: restingTypes = $restingTypesQuery.data ?? [];
	$: if (restingTypes.length > 0 && selectedRestingTypeIndex >= restingTypes.length) {
		selectedRestingTypeIndex = 0;
	}
	$: selectedRestingType = restingTypes[selectedRestingTypeIndex] ?? null;

	$: minDurationHours = selectedRestingType
		? Math.max(1, Math.round(parseTimeSpanToHours(selectedRestingType.minimumDuration) || 1))
		: 1;
	$: maxDurationHours = selectedRestingType
		? Math.max(
				minDurationHours,
				Math.round(parseTimeSpanToHours(selectedRestingType.maximumDuration) || 1)
			)
		: minDurationHours;

	$: if (selectedRestingType) {
		if (selectedDurationHours === null) {
			selectedDurationHours = minDurationHours;
		} else if (selectedDurationHours < minDurationHours) {
			selectedDurationHours = minDurationHours;
		} else if (selectedDurationHours > maxDurationHours) {
			selectedDurationHours = maxDurationHours;
		}
	} else {
		selectedDurationHours = null;
	}

	$: durationLabel = selectedDurationHours
		? formatHoursLabel(selectedDurationHours)
		: 'Select duration';
	$: energyGain =
		selectedRestingType && selectedDurationHours
			? Math.round(selectedRestingType.energyRestoredPerHour * selectedDurationHours)
			: 0;
	$: baseBudgetEstimate =
		selectedRestingType && selectedDurationHours
			? Math.round(selectedRestingType.baseBudgetPerHour * selectedDurationHours)
			: 0;
	$: selectedWorkerName = selectedWorkerId
		? (workerOptions.find((option) => option.value === selectedWorkerId)?.name ?? 'Artist')
		: 'Choose artist';

	$: readyForCostPrediction =
		Boolean($currentLabel && selectedWorkerId && selectedRestingType && selectedDurationHours) &&
		activeStepIndex >= 1;

	$: if (!readyForCostPrediction && wasReadyForCostPrediction) {
		costPrediction = null;
		costPredictionRequestId += 1;
		loadingCost = false;
	}

	$: wasReadyForCostPrediction = readyForCostPrediction;

	$: if (readyForCostPrediction) {
		fetchCostPrediction();
	}

	$: step1Valid =
		Boolean(selectedRestingType && selectedDurationHours && selectedWorkerId) &&
		!$restingTypesQuery.isLoading &&
		!$artistsQuery.isLoading;

	$: if (
		$tasksQuery?.isLoading ||
		$contractsQuery?.isLoading ||
		$artistsQuery?.isLoading ||
		$restingTypesQuery.isLoading
	) {
		error = null;
	} else if ($restingTypesQuery.error) {
		error = 'Failed to load resting options.';
	} else if ($tasksQuery?.error) {
		error = `Failed to load tasks: ${$tasksQuery.error.message}`;
	} else if ($contractsQuery?.error) {
		error = `Failed to load contracts: ${$contractsQuery.error.message}`;
	} else if ($artistsQuery?.error) {
		error = `Failed to load artists: ${$artistsQuery.error.message}`;
	}

	function parseTimeSpanToHours(duration: string): number {
		if (!duration) return 0;

		const parts = duration.split('.');
		let timePart = duration;
		let days = 0;

		if (parts.length > 1 && !parts[0].includes(':')) {
			days = Number(parts[0]) || 0;
			timePart = parts.slice(1).join('.');
		}

		const [hoursPart = '0', minutesPart = '0', secondsPart = '0'] = timePart.split(':');
		const hours = Number(hoursPart) || 0;
		const minutes = Number(minutesPart) || 0;
		const seconds = parseFloat(secondsPart) || 0;

		return days * 24 + hours + minutes / 60 + seconds / 3600;
	}

	function hoursToTimeSpan(hours: number): string {
		const totalSeconds = Math.max(0, Math.round(hours * 3600));
		const days = Math.floor(totalSeconds / 86400);
		const remainder = totalSeconds - days * 86400;
		const hrs = Math.floor(remainder / 3600);
		const mins = Math.floor((remainder % 3600) / 60);
		const secs = remainder % 60;

		const hh = String(hrs).padStart(2, '0');
		const mm = String(mins).padStart(2, '0');
		const ss = String(secs).padStart(2, '0');

		return days > 0 ? `${days}.${hh}:${mm}:${ss}` : `${hrs}:${mm}:${ss}`;
	}

	function formatHoursLabel(hours: number): string {
		return `${hours} hour${hours === 1 ? '' : 's'}`;
	}

	function handleDurationInput(event: Event) {
		const nextValue = Number((event.currentTarget as HTMLInputElement).value);
		selectedDurationHours = Number.isFinite(nextValue) ? nextValue : selectedDurationHours;
	}

	function goToPreviousRestType() {
		if (restingTypes.length === 0) return;
		selectedRestingTypeIndex =
			(selectedRestingTypeIndex - 1 + restingTypes.length) % restingTypes.length;
	}

	function goToNextRestType() {
		if (restingTypes.length === 0) return;
		selectedRestingTypeIndex = (selectedRestingTypeIndex + 1) % restingTypes.length;
	}

	function selectRestingType(index: number) {
		if (index < 0 || index >= restingTypes.length) return;
		selectedRestingTypeIndex = index;
	}

	function buildRestingTaskRequest(): RestingTaskRequest | null {
		if (!$currentLabel || !selectedWorkerId || !selectedRestingType || !selectedDurationHours) {
			return null;
		}

		return {
			labelId: $currentLabel.id,
			workerId: selectedWorkerId,
			duration: hoursToTimeSpan(selectedDurationHours),
			restingTypeId: selectedRestingType.id
		};
	}

	async function fetchCostPrediction() {
		const payload = buildRestingTaskRequest();
		if (!payload) return;

		const requestId = ++costPredictionRequestId;
		loadingCost = true;
		costPrediction = null;

		try {
			const prediction = await predictRestingTaskCost(payload);
			if (requestId === costPredictionRequestId) {
				costPrediction = prediction;
			}
		} catch (err) {
			if (requestId === costPredictionRequestId) {
				costPrediction = null;
			}
			console.error('Failed to fetch resting cost prediction', err);
		} finally {
			if (requestId === costPredictionRequestId) {
				loadingCost = false;
			}
		}
	}

	async function handleSendToRest() {
		const payload = buildRestingTaskRequest();
		if (!payload) {
			error = 'Missing resting details. Please pick an artist, rest type, and duration.';
			return;
		}

		loading = true;
		error = null;

		try {
			const response = await createRestingTask(payload);

			appState.updateCurrentLabelBankroll(-response.budgetRequired);

			if ($currentLabel) {
				queryClient.invalidateQueries({ queryKey: queryKeys.tasks.byLabel($currentLabel.id) });
				queryClient.invalidateQueries({ queryKey: queryKeys.labels.byId($currentLabel.id) });
			}

			modalStore.close();
		} catch (err) {
			if (err instanceof TaskCreationError) {
				error = getTaskErrorMessage(err.errorResponse.code, err.errorResponse.message);
			} else {
				error = 'Failed to start resting task. Please try again.';
			}
			console.error(err);
		} finally {
			loading = false;
		}
	}

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
			stepLabels={['Rest setup', 'Send to rest']}
			{activeStepIndex}
			hideLabelsOnMobile={true}
			on:stepClicked={handleStepChange}
		/>
	</svelte:fragment>
	<svelte:fragment>
		<ContentPanel
			class="mx-auto h-full max-w-xl p-4 lg:max-w-3xl xl:max-w-4xl"
			{activeStepIndex}
			transition="slide"
			duration={300}
		>
			<!-- Step 1: Rest type + duration -->
			<ContentPanelItem class="space-y-8 pb-8 text-white">
				<div class="space-y-3 text-sm text-gray-300">
					<p>
						Pick a resting style and duration. Effects scale with time: longer rests restore more
						energy but cost more bankroll.
					</p>
				</div>

				{#if $restingTypesQuery.isLoading}
					<div class="flex justify-center py-10">
						<div class="h-10 w-10 animate-spin rounded-full border-b-2 border-primary-400"></div>
					</div>
				{:else if selectedRestingType}
					<div class="relative overflow-hidden rounded-xl bg-primary-950/60 p-4 sm:p-5 lg:p-6">
						<button
							type="button"
							class="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-primary-800/60 bg-primary-900/70 p-2 text-gray-200 hover:bg-primary-800/70"
							on:click={goToPreviousRestType}
							aria-label="Previous rest type"
						>
							<span class="text-lg">&#8592;</span>
						</button>
						<button
							type="button"
							class="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-primary-800/60 bg-primary-900/70 p-2 text-gray-200 hover:bg-primary-800/70"
							on:click={goToNextRestType}
							aria-label="Next rest type"
						>
							<span class="text-lg">&#8594;</span>
						</button>

						<div class="grid gap-6 lg:grid-cols-[1fr,1.2fr] lg:items-center">
							<div class="bg-primary-1000 relative overflow-hidden">
								{#if selectedRestingType.illustrationUrl}
									<img
										src={selectedRestingType.illustrationUrl}
										alt={`${selectedRestingType.name} illustration`}
										class="h-full w-full object-cover"
									/>
								{:else}
									<div class="flex h-full w-full items-center justify-center text-sm text-gray-500">
										No illustration yet
									</div>
								{/if}
							</div>

							<div class="space-y-4">
								<div class="space-y-1">
									<p class="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
										Rest type
									</p>
									<h3 class="text-2xl font-semibold tracking-tight text-white">
										{selectedRestingType.name}
									</h3>
								</div>
								<p class="text-sm text-gray-300">{selectedRestingType.description}</p>

								<div class="grid gap-3 sm:grid-cols-2">
									<div class="bg-success-950/40 rounded-lg border border-success-700/40 p-4">
										<p class="text-xs font-semibold uppercase tracking-wider text-success-200">
											Energy gain
										</p>
										<p class="text-2xl font-semibold text-white">+{energyGain}</p>
										<p class="text-xs text-success-100/80">
											Scales with duration ({selectedRestingType.energyRestoredPerHour} per hour)
										</p>
									</div>
									<div class="bg-warning-950/40 rounded-lg border border-warning-700/40 p-4">
										<p class="text-xs font-semibold uppercase tracking-wider text-warning-200">
											Budget impact
										</p>
										<p class="text-2xl font-semibold text-white">
											$ {baseBudgetEstimate.toLocaleString()}
										</p>
										<p class="text-xs text-warning-100/80">
											~${selectedRestingType.baseBudgetPerHour.toLocaleString()} per hour base cost
										</p>
									</div>
								</div>

								<div class="flex flex-wrap items-center gap-3 text-xs text-gray-400">
									<span
										class="rounded-full border border-primary-800/70 bg-primary-900/70 px-3 py-1"
									>
										Window: {formatHoursLabel(minDurationHours)} - {formatHoursLabel(
											maxDurationHours
										)}
									</span>
									<span
										class="rounded-full border border-primary-800/70 bg-primary-900/70 px-3 py-1"
									>
										Worker needed: signed artist
									</span>
								</div>
							</div>
						</div>

						<div class="mt-4 flex items-center justify-center gap-2">
							{#each restingTypes as _, index}
								<button
									type="button"
									class={`h-2.5 w-2.5 rounded-full transition ${
										index === selectedRestingTypeIndex
											? 'bg-primary-300'
											: 'bg-primary-700 hover:bg-primary-500'
									}`}
									on:click={() => selectRestingType(index)}
									aria-label={`Select ${restingTypes[index].name}`}
								></button>
							{/each}
						</div>
					</div>
				{:else}
					<div
						class="bg-primary-1000 rounded-lg border border-primary-900/70 px-4 py-8 text-center text-gray-400"
					>
						No resting types available right now.
					</div>
				{/if}

				{#if selectedRestingType}
					<div class="rounded-xl border border-primary-800/70 bg-primary-950/70 p-4 sm:p-5">
						<div class="flex flex-wrap items-center justify-between gap-3">
							<div class="space-y-1">
								<p class="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
									Duration
								</p>
								<p class="text-sm text-gray-300">Effects scale as you increase time.</p>
							</div>
							<p class="text-lg font-semibold text-white">{durationLabel}</p>
						</div>

						<div class="mt-4">
							<input
								type="range"
								min={minDurationHours}
								max={maxDurationHours}
								step="1"
								value={selectedDurationHours ?? minDurationHours}
								on:input={handleDurationInput}
								class="w-full accent-primary-400"
							/>
							<div class="mt-3 flex items-center justify-between text-xs text-gray-400">
								<span>{formatHoursLabel(minDurationHours)}</span>
								<span>{formatHoursLabel(maxDurationHours)}</span>
							</div>
						</div>
					</div>
				{/if}
			</ContentPanelItem>

			<!-- Step 2: Review & cost -->
			<ContentPanelItem class="space-y-6 pb-8 text-white">
				<div class="rounded-xl border border-primary-800/70 bg-primary-950/70 p-4 sm:p-5 lg:p-6">
					<div class="flex flex-wrap items-center justify-between gap-3">
						<div class="space-y-1">
							<p class="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
								Rest plan
							</p>
							<p class="text-xl font-semibold text-white">
								{selectedRestingType ? selectedRestingType.name : 'Resting'}
							</p>
						</div>
						<p class="text-sm text-gray-300">{durationLabel}</p>
					</div>

					<div class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
						<div class="bg-primary-1000/60 rounded-lg border border-primary-800/70 p-3">
							<p class="text-xs font-semibold uppercase tracking-wider text-gray-400">Artist</p>
							<p class="text-base text-white">{selectedWorkerName}</p>
						</div>
						<div class="bg-success-950/40 rounded-lg border border-success-800/60 p-3">
							<p class="text-xs font-semibold uppercase tracking-wider text-success-200">
								Energy gain
							</p>
							<p class="text-base text-white">+{energyGain}</p>
						</div>
						<div class="bg-warning-950/40 rounded-lg border border-warning-800/60 p-3">
							<p class="text-xs font-semibold uppercase tracking-wider text-warning-200">
								Base budget
							</p>
							<p class="text-base text-white">$ {baseBudgetEstimate.toLocaleString()}</p>
						</div>
					</div>
				</div>

				<CostEstimation
					{costPrediction}
					loading={loadingCost}
					emptyMessage="Select a rest type, artist, and duration to estimate cost."
				/>
			</ContentPanelItem>
		</ContentPanel>
	</svelte:fragment>

	<svelte:fragment slot="footer">
		<div class="flex items-center gap-3 sm:mr-auto lg:gap-4">
			<Dropdown
				label="Artist"
				options={workerOptions}
				disabled={workerOptions.length <= 1}
				bind:value={selectedWorkerId}
				placeholder="Choose..."
				direction="up"
			/>
		</div>

		<ContentPanel {activeStepIndex} class="w-full sm:w-auto">
			<ContentPanelItem class="flex flex-col justify-end gap-2 sm:flex-row sm:gap-3 lg:gap-4">
				<Button
					class="w-full sm:w-auto sm:min-w-32 lg:min-w-40 xl:min-w-44"
					color="primary"
					style="hollow"
					altText="Cancel resting task"
					on:clicked={handleCancel}
				>
					Cancel
				</Button>
				<Button
					disabled={!step1Valid}
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
					altText="Cancel resting task"
					on:clicked={handleCancel}
				>
					Cancel
				</Button>
				<Button
					class="w-full sm:w-auto sm:min-w-32 lg:min-w-40 xl:min-w-44"
					color="primary"
					altText="Go back"
					on:clicked={handlePreviousStep}
				>
					Previous
				</Button>
				<Button
					class="w-full sm:w-auto sm:min-w-48 lg:min-w-56 xl:min-w-64"
					color="secondary"
					style="normal"
					altText="Send artist to rest"
					{loading}
					disabled={!readyForCostPrediction || loading}
					on:clicked={handleSendToRest}
				>
					{loading ? 'Sending...' : 'Send to rest'}
				</Button>
			</ContentPanelItem>
		</ContentPanel>
	</svelte:fragment>
</ScrollableContainer>
