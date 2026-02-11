<script lang="ts">
	import { colors } from '$lib/theme';
	import { modalStore } from '$lib/stores/modal';
	import { appState, currentLabel, currentPlayer } from '$lib/stores/appState';
	import { queryKeys, queryClient } from '$lib/queries/queryClient';
	import Stepper from '$lib/components/Stepper.svelte';
	import ContentPanel from '$lib/components/ContentPanel.svelte';
	import ContentPanelItem from '$lib/components/ContentPanelItem.svelte';
	import ArtistDetails from '$lib/components/ArtistDetails.svelte';
	import SelectGroupField, {
		type SelectGroupChoice
	} from '$lib/components/formfields/SelectGroupField.svelte';
	import NumericField from '$lib/components/formfields/NumericField.svelte';
	import Button from '$lib/components/Button.svelte';
	import CostEstimation from './CostEstimation.svelte';
	import {
		predictSignArtistContractCost,
		createSignArtistContractTask,
		TaskCreationError
	} from '$lib/api';
	import type { Artist } from '$lib/types/nonPlayingCharacter';
	import Dropdown from '$lib/components/Dropdown.svelte';
	import type { TaskCostPrediction, SigningContractTaskResponse } from '$lib/types/task';
	import type { SignArtistContractRequest } from '$lib/types/SigningContractTask';
	import { getTaskErrorMessage, yearsToTimeSpan } from '$lib/utils';
	import ScrollableContainer from '$lib/components/ScrollableContainer.svelte';

	// State
	let activeStepIndex = 0;
	const totalSteps = 3;
	let loading = false;
	let loadingCost = false;
	let costPrediction: TaskCostPrediction | null = null;
	let costPredictionRequestId = 0;

	const modalData = modalStore.getData();
	const artist = (modalData?.artist as Artist | undefined) ?? null;

	const prospectorOptions = [{ name: 'you', value: 1 }];

	let contractType: SelectGroupChoice = 0;
	let contractLengthYears: number | null = 1;
	let contractAlbums: number | null = 0;
	let contractEps: number | null = 0;
	let contractMixtapes: number | null = 0;
	let contractSingles: number | null = 0;
	let signingBonus = 0;
	let advance = 0;
	let royaltyPercentage = 0;
	let selectedProspectorId = 1;
	let error: string | null = null;

	$: totalReleases =
		(contractAlbums ?? 0) + (contractEps ?? 0) + (contractMixtapes ?? 0) + (contractSingles ?? 0);
	$: usesDuration = contractType === 0;
	$: readyForCostPrediction =
		Boolean($currentLabel && $currentPlayer && artist?.id) &&
		activeStepIndex === 2 &&
		((usesDuration && contractLengthYears !== null && contractLengthYears > 0) ||
			(!usesDuration && totalReleases > 0));

	$: if (!readyForCostPrediction) {
		costPrediction = null;
	}

	// Trigger cost prediction when on review step (step 2)
	$: if (
		readyForCostPrediction &&
		(signingBonus !== undefined ||
			advance !== undefined ||
			royaltyPercentage !== undefined ||
			contractAlbums !== undefined ||
			contractEps !== undefined ||
			contractMixtapes !== undefined ||
			contractSingles !== undefined ||
			contractLengthYears !== undefined)
	) {
		fetchCostPrediction();
	}

	async function handleMakeOffer() {
		const payload = buildCostPredictionRequest();
		if (!payload) {
			error = 'Missing contract details. Please fill out the form.';
			return;
		}

		loading = true;
		error = null;

		try {
			const response = await createSignArtistContractTask(payload);

			// Update bankroll in appState
			appState.updateCurrentLabelBankroll(-response.budgetRequired);

			// Invalidate tasks and contracts queries to refetch
			if ($currentLabel) {
				queryClient.invalidateQueries({ queryKey: queryKeys.tasks.byLabel($currentLabel.id) });
				queryClient.invalidateQueries({ queryKey: queryKeys.contracts.byLabel($currentLabel.id) });

				// Also invalidate specific contract if we have the contractId
				const contractTask = response as SigningContractTaskResponse;
				if (contractTask.contractId) {
					queryClient.invalidateQueries({
						queryKey: queryKeys.contracts.byIds([contractTask.contractId])
					});
				}
			}

			modalStore.close();
		} catch (err) {
			error = 'Failed to make an offer. Please try again.';
			if (err instanceof TaskCreationError) {
				error = getTaskErrorMessage(err.errorResponse.code, err.errorResponse.message);
			} else {
				error = 'Failed to create signing contract task. Please try again.';
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

	function buildCostPredictionRequest(): SignArtistContractRequest | null {
		if (!$currentLabel || !$currentPlayer || !artist?.id) return null;

		const sanitize = (value: number | null) => Math.max(0, value ?? 0);

		const duration =
			usesDuration && contractLengthYears !== null && contractLengthYears > 0
				? yearsToTimeSpan(sanitize(contractLengthYears))
				: '';

		return {
			labelId: $currentLabel.id,
			artistId: artist.id,
			workerId: $currentPlayer.id,
			numberOfReleases: {
				albums: sanitize(contractAlbums),
				eps: sanitize(contractEps),
				mixtapes: sanitize(contractMixtapes),
				singles: sanitize(contractSingles)
			},
			duration,
			signingBonus: sanitize(signingBonus),
			royaltyPercentage: sanitize(royaltyPercentage),
			advance: sanitize(advance)
		};
	}

	async function fetchCostPrediction() {
		const payload = buildCostPredictionRequest();
		if (!payload) return;

		const requestId = ++costPredictionRequestId;
		loadingCost = true;

		try {
			const prediction = await predictSignArtistContractCost(payload);
			if (requestId === costPredictionRequestId) {
				costPrediction = prediction;
			}
		} catch (error) {
			if (requestId === costPredictionRequestId) {
				costPrediction = null;
			}
			console.error('Failed to fetch contract cost prediction', error);
		} finally {
			if (requestId === costPredictionRequestId) {
				loadingCost = false;
			}
		}
	}
</script>

<ScrollableContainer {error}>
	<svelte:fragment slot="header">
		<Stepper
			selectedButtonColor={colors.primary[300]}
			selectedTextColor={colors.primary[500]}
			buttonColor="dimgray"
			stepLabels={['Artist Info', 'Contract Terms', 'Sign Contract']}
			{activeStepIndex}
			hideLabelsOnMobile={true}
			on:stepClicked={handleStepChange}
		/>
	</svelte:fragment>
	<svelte:fragment>
		<ContentPanel
			class="mx-auto h-full px-16 pt-0"
			{activeStepIndex}
			transition="slide"
			duration={300}
			><div class="flex-grow p-4 sm:p-12">
				<ContentPanelItem>
					<!-- Step 1: Artist Info -->
					{#if artist}
						<!-- svelte-ignore missing-declaration -->
						<ArtistDetails {artist} />
					{:else}
						<div class="text-center text-gray-400">No artist selected.</div>
					{/if}
				</ContentPanelItem>
				<ContentPanelItem>
					<!-- Step 2: Contract Terms -->
					<div class="mx-auto w-full max-w-5xl space-y-8">
						<SelectGroupField class="h-xl w-full" bind:selected={contractType}>
							<div slot="left">
								<!-- left content -->
								<div class="mb-8">
									<span class="block text-center">Sign for a fixed time period.</span>
									<span class="block text-center text-xs font-light leading-snug"
										>The artist stays under contract for the full duration, releasing music freely
										during that time. When the contract ends, they’re free to leave — no matter how
										many projects were released.</span
									>
								</div>
								<div class="flex flex-col items-center gap-3">
									<label
										class="w-18 block select-none text-center font-thin uppercase"
										for="contract-length">Contract Length</label
									>
									<NumericField
										class="w-40"
										id="contract-length"
										bind:value={contractLengthYears}
										step={1}
										suffix="years"
										min={0}
										max={4}
									/>
								</div>
							</div>
							<div slot="right">
								<!-- right content -->
								<div class="mb-8">
									<span class="block text-center">Sign for a set number of projects.</span>
									<span class="block text-center text-xs font-light leading-snug"
										>The contract ends once the artist delivers the agreed number of releases
										(albums, EPs, mixtapes, or singles), regardless of how long it takes.</span
									>
								</div>
								<div
									class="grid w-full grid-cols-[repeat(auto-fit,minmax(10rem,1fr))] justify-items-center gap-4 sm:gap-6"
								>
									<div class="flex flex-col items-center gap-2">
										<label
											class="w-18 block select-none text-center font-thin uppercase"
											for="contract-albums">Albums</label
										>
										<NumericField
											id="contract-albums"
											bind:value={contractAlbums}
											step={1}
											min={0}
											max={5}
										/>
									</div>
									<div class="flex flex-col items-center gap-2">
										<label
											class="w-18 block select-none text-center font-thin uppercase"
											for="contract-ep">EP</label
										>
										<NumericField
											id="contract-ep"
											bind:value={contractEps}
											step={1}
											min={0}
											max={10}
										/>
									</div>
									<div class="flex flex-col items-center gap-2">
										<label
											class="w-18 block select-none text-center font-thin uppercase"
											for="contract-mixtapes">Mixtapes</label
										>
										<NumericField
											id="contract-mixtapes"
											bind:value={contractMixtapes}
											step={1}
											min={0}
											max={5}
										/>
									</div>
									<div class="flex flex-col items-center gap-2">
										<label
											class="w-18 block select-none text-center font-thin uppercase"
											for="contract-singles">Singles</label
										>
										<NumericField
											id="contract-singles"
											bind:value={contractSingles}
											step={1}
											min={0}
											max={30}
										/>
									</div>
								</div>
							</div>
						</SelectGroupField>
						<div
							class="mx-auto grid w-full max-w-2xl grid-cols-1 items-stretch gap-4 text-white sm:grid-cols-2"
						>
							<div class="flex grow flex-wrap items-center justify-center gap-2">
								<label
									class="block w-20 select-none text-center font-thin uppercase"
									for="contract-bonus">Bonus</label
								>
								<NumericField
									class="w-full max-w-44"
									id="contract-bonus"
									bind:value={signingBonus}
									step={100}
									suffix="$"
									min={0}
									max={10000}
								/>
							</div>
							<div class="flex flex-wrap items-center justify-center gap-2">
								<label
									class="block w-20 select-none text-center font-thin uppercase"
									for="contract-advance">Advance</label
								>
								<NumericField
									class="w-full max-w-44"
									id="contract-advance"
									bind:value={advance}
									step={100}
									suffix="$"
									min={0}
									max={10000}
								/>
							</div>
							<div class="flex flex-wrap items-center justify-center gap-2">
								<label
									class="block w-20 select-none text-center font-thin uppercase"
									for="contract-royalties">Royalties</label
								>
								<NumericField
									class="w-full max-w-44"
									id="contract-royalties"
									bind:value={royaltyPercentage}
									step={1}
									suffix="%"
									min={0}
									max={80}
								/>
							</div>
						</div>
					</div>
				</ContentPanelItem>
				<ContentPanelItem>
					<!-- Step 3: Sign Contract -->
					<div class="space-y-4 sm:space-y-6 lg:space-y-8">
						<CostEstimation {costPrediction} loading={loadingCost} />
					</div>
				</ContentPanelItem>
			</div>
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
		<ContentPanel {activeStepIndex} class="w-full sm:w-auto">
			<ContentPanelItem class="flex flex-col justify-end gap-2 sm:flex-row sm:gap-3 lg:gap-4">
				<Button
					class="w-full sm:w-auto sm:min-w-32 lg:min-w-40 xl:min-w-44"
					color="primary"
					style="hollow"
					altText="Cancel signing contract"
					on:clicked={handleCancel}
				>
					Cancel
				</Button>
				<Button
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
					altText="Cancel signing contract"
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
					altText="Cancel signing contract"
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
					disabled={!readyForCostPrediction || loading}
					on:clicked={handleMakeOffer}
				>
					{loading ? 'Starting...' : 'Make an offer'}
				</Button>
			</ContentPanelItem>
		</ContentPanel>
	</svelte:fragment>
</ScrollableContainer>
