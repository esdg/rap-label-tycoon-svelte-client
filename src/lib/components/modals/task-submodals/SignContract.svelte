<script lang="ts">
	import { colors } from '$lib/theme';
	import { modalStore } from '$lib/stores/modal';
	import { appState, currentLabel, currentPlayer } from '$lib/stores/appState';
	import { queryKeys, queryClient } from '$lib/queries/queryClient';
	import { createLabelContractsQuery } from '$lib/queries/contractQueries';
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
	import { getTaskErrorMessage, yearsToTimeSpan, formatDuration } from '$lib/utils';
	import ScrollableContainer from '$lib/components/ScrollableContainer.svelte';
	import type { Contract } from '$lib/types/contracts';
	import { ContractStatus } from '$lib/types/contracts';

	// State
	let activeStepIndex = 0;
	let loading = false;
	let loadingCost = false;
	let costPrediction: TaskCostPrediction | null = null;
	let costPredictionRequestId = 0;

	const modalData = modalStore.getData();
	const artist = (modalData?.artist as Artist | undefined) ?? null;

	// Fetch contracts for the current label
	$: labelId = $currentLabel?.id ?? null;
	$: contractsQuery = createLabelContractsQuery(labelId);

	// Find the contract for this specific artist
	$: existingContract = ($contractsQuery.data ?? []).find(
		(contract) => contract.artistId === artist?.id
	) as Contract | undefined;

	// Check if there are previous iterations
	$: hasHistory = (existingContract?.iterations?.length ?? 0) > 0;

	// Calculate total steps based on whether history exists
	$: totalSteps = hasHistory ? 4 : 3;

	// Determine step labels dynamically
	$: stepLabels = hasHistory
		? ['Artist Info', 'History', 'Contract Terms', 'Sign Contract']
		: ['Artist Info', 'Contract Terms', 'Sign Contract'];

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
		activeStepIndex === totalSteps - 1 &&
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
			{stepLabels}
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
					<!-- Artist Info -->
					{#if artist}
						<!-- svelte-ignore missing-declaration -->
						<ArtistDetails {artist} />
					{:else}
						<div class="text-center text-gray-400">No artist selected.</div>
					{/if}
				</ContentPanelItem>
				{#if hasHistory}
					<ContentPanelItem>
						<!-- Contract History (only shown if iterations > 0) -->
						<div class="mx-auto max-w-4xl space-y-6">
							<h2 class="text-center text-2xl font-semibold text-white">
								Contract Negotiation History
							</h2>
							<p class="text-center text-sm text-gray-400">
								Previous offers and responses from {artist?.stageName || 'the artist'}
							</p>

							<!-- Timeline Container -->
							<div class="relative pt-6">
								{#each existingContract?.iterations ?? [] as iteration, index}
									{@const isLast = index === (existingContract?.iterations?.length ?? 0) - 1}

									{@const hasResponse = !!iteration.response}
									{@const isAccepted = hasResponse && iteration.response?.accepted === true}
									{@const isRefused = hasResponse && iteration.response?.accepted === false}

									<div class="relative flex gap-6 pb-8">
										<!-- Timeline Line & Dot -->
										<div class="relative flex flex-col items-center">
											<!-- Timeline Dot -->
											<div
												class="z-10 flex h-10 w-10 items-center justify-center rounded-full border-4 border-gray-900 shadow-lg transition-transform hover:scale-110"
												class:bg-green-500={isAccepted}
												class:bg-red-500={isRefused}
												class:bg-gray-600={!hasResponse}
											>
												<span class="text-xs font-bold text-white">
													{iteration.iterationNumber ?? index + 1}
												</span>
											</div>

											<!-- Connecting Line (not shown for last item) -->
											{#if !isLast}
												<div
													class="absolute top-10 h-full w-0.5 bg-gradient-to-b from-gray-600 to-gray-800"
												></div>
											{/if}
										</div>

										<!-- Timeline Card -->
										<div class="flex-1 pb-2">
											<div
												class="group relative rounded-lg border-2 bg-gray-900/50 p-5 shadow-xl backdrop-blur-sm transition-all hover:shadow-2xl"
												class:border-green-500={isAccepted}
												class:border-red-500={isRefused}
												class:border-gray-700={!hasResponse}
												class:hover:border-green-400={isAccepted}
												class:hover:border-red-400={isRefused}
											>
												<!-- Card Header -->
												<div class="mb-4 flex items-start justify-between">
													<div>
														<h3 class="text-lg font-bold text-white">
															Offer #{iteration.iterationNumber ?? index + 1}
														</h3>
														<p class="text-xs text-gray-500">Negotiation attempt</p>
													</div>
													{#if hasResponse}
														<div
															class="flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-white shadow-md"
															class:bg-green-500={isAccepted}
															class:bg-red-500={isRefused}
														>
															{#if isAccepted}
																<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
																	<path
																		fill-rule="evenodd"
																		d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
																		clip-rule="evenodd"
																	/>
																</svg>
															{:else}
																<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
																	<path
																		fill-rule="evenodd"
																		d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
																		clip-rule="evenodd"
																	/>
																</svg>
															{/if}
															<span>{isAccepted ? 'Accepted' : 'Refused'}</span>
														</div>
													{/if}
												</div>

												<!-- Contract Terms Grid -->
												{#if iteration.offert}
													<div class="mb-4 grid grid-cols-2 gap-3 rounded-lg bg-gray-800/50 p-4">
														<div class="flex flex-col">
															<span
																class="text-xs font-medium uppercase tracking-wide text-gray-500"
																>Signing Bonus</span
															>
															<span class="text-lg font-bold text-green-400">
																${iteration.offert.signingBonus.toLocaleString()}
															</span>
														</div>
														<div class="flex flex-col">
															<span
																class="text-xs font-medium uppercase tracking-wide text-gray-500"
																>Advance</span
															>
															<span class="text-lg font-bold text-green-400">
																${iteration.offert.advance.toLocaleString()}
															</span>
														</div>
														<div class="flex flex-col">
															<span
																class="text-xs font-medium uppercase tracking-wide text-gray-500"
																>Royalties</span
															>
															<span class="text-lg font-bold text-blue-400">
																{iteration.offert.royaltyPercentage}%
															</span>
														</div>
														{#if iteration.offert.contractDuration}
															<div class="flex flex-col">
																<span
																	class="text-xs font-medium uppercase tracking-wide text-gray-500"
																	>Duration</span
																>
																<span class="text-lg font-bold text-purple-400">
																	{formatDuration(iteration.offert.contractDuration)}
																</span>
															</div>
														{/if}
														{#if iteration.offert.numberOfReleases}
															<div class="col-span-2 flex flex-col">
																<span
																	class="text-xs font-medium uppercase tracking-wide text-gray-500"
																	>Required Releases</span
																>
																<div class="mt-1 flex flex-wrap gap-2 text-sm">
																	{#if iteration.offert.numberOfReleases.albums}
																		<span
																			class="rounded bg-purple-500/20 px-2 py-1 text-purple-400"
																		>
																			{iteration.offert.numberOfReleases.albums} Album(s)
																		</span>
																	{/if}
																	{#if iteration.offert.numberOfReleases.eps}
																		<span class="rounded bg-blue-500/20 px-2 py-1 text-blue-400">
																			{iteration.offert.numberOfReleases.eps} EP(s)
																		</span>
																	{/if}
																	{#if iteration.offert.numberOfReleases.mixtapes}
																		<span
																			class="rounded bg-yellow-500/20 px-2 py-1 text-yellow-400"
																		>
																			{iteration.offert.numberOfReleases.mixtapes} Mixtape(s)
																		</span>
																	{/if}
																	{#if iteration.offert.numberOfReleases.singles}
																		<span class="rounded bg-pink-500/20 px-2 py-1 text-pink-400">
																			{iteration.offert.numberOfReleases.singles} Single(s)
																		</span>
																	{/if}
																</div>
															</div>
														{/if}
													</div>
												{/if}

												<!-- Artist Response Message -->
												{#if iteration.response?.message}
													<div
														class="relative rounded-lg border-l-4 bg-gray-800/70 p-4"
														class:border-green-500={isAccepted}
														class:border-red-500={isRefused}
													>
														<div class="mb-1 flex items-center gap-2">
															<svg
																class="h-4 w-4 text-gray-400"
																fill="currentColor"
																viewBox="0 0 20 20"
															>
																<path
																	fill-rule="evenodd"
																	d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
																	clip-rule="evenodd"
																/>
															</svg>
															<span
																class="text-xs font-semibold uppercase tracking-wider text-gray-400"
															>
																Artist's Response
															</span>
														</div>
														<p class="text-sm italic leading-relaxed text-gray-300">
															"{iteration.response.message}"
														</p>
													</div>
												{/if}
											</div>
										</div>
									</div>
								{/each}

								<!-- Timeline End Marker -->
								<div class="flex items-center gap-6 pl-0">
									<div class="flex flex-col items-center">
										<div
											class="flex h-10 w-10 items-center justify-center rounded-full border-4 border-gray-900 bg-yellow-500 shadow-lg"
										>
											<svg class="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
												<path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
												<path
													fill-rule="evenodd"
													d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
													clip-rule="evenodd"
												/>
											</svg>
										</div>
									</div>
									<div class="flex-1 py-2">
										<p class="text-base font-semibold text-yellow-500">New Offer</p>
										<p class="text-xs text-gray-500">Ready to make another attempt</p>
									</div>
								</div>
							</div>
						</div>
					</ContentPanelItem>
				{/if}
				<ContentPanelItem>
					<!-- Contract Terms -->
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
					<!-- Sign Contract -->
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
			<!-- First step -->
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
			<!-- Middle steps (dynamically rendered based on totalSteps) -->
			{#each Array(totalSteps - 2) as _, i}
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
			{/each}
			<!-- Last step -->
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
