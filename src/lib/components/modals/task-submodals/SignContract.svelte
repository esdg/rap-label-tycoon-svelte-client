<script lang="ts">
	import { colors } from '$lib/theme';
	import { modalStore } from '$lib/stores/modal';
	import { label } from '$lib/stores/label';
	import { player } from '$lib/stores/player';
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
	import { predictSignArtistContractCost, createSignArtistContractTask } from '$lib/api';
	import type { Artist } from '$lib/types/nonPlayingCharacter';
	import Dropdown from '$lib/components/Dropdown.svelte';
	import type { TaskCostPrediction } from '$lib/types/task';
	import type { SignArtistContractRequest } from '$lib/types/SigningContractTask';

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
	let submitError: string | null = null;

	$: totalReleases =
		(contractAlbums ?? 0) + (contractEps ?? 0) + (contractMixtapes ?? 0) + (contractSingles ?? 0);
	$: usesDuration = contractType === 0;
	$: readyForCostPrediction =
		Boolean($label && $player && artist?.id) &&
		activeStepIndex >= 1 &&
		((usesDuration && contractLengthYears !== null && contractLengthYears > 0) ||
			(!usesDuration && totalReleases > 0));

	$: if (!readyForCostPrediction) {
		costPrediction = null;
	}

	$: if (readyForCostPrediction) {
		fetchCostPrediction();
	}

	async function handleMakeOffer() {
		const payload = buildCostPredictionRequest();
		if (!payload) {
			submitError = 'Missing contract details. Please fill out the form.';
			return;
		}

		loading = true;
		submitError = null;

		try {
			await createSignArtistContractTask(payload);
			modalStore.close();
		} catch (error) {
			submitError = 'Failed to make an offer. Please try again.';
			console.error('Failed to create sign-artist contract task', error);
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

	function formatYearsToTimeSpan(years: number): string {
		// Convert years to an approximate TimeSpan string understood by the API (d.hh:mm:ss)
		const days = Math.max(0, years) * 365;
		return `${days}.00:00:00`;
	}

	function buildCostPredictionRequest(): SignArtistContractRequest | null {
		if (!$label || !$player || !artist?.id) return null;

		const sanitize = (value: number | null) => Math.max(0, value ?? 0);

		const duration =
			usesDuration && contractLengthYears !== null && contractLengthYears > 0
				? formatYearsToTimeSpan(sanitize(contractLengthYears))
				: '';

		return {
			labelId: $label.id,
			artistId: artist.id,
			workerId: $player.id,
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

<section class="flex flex-col h-full overflow-hidden" aria-label="Sign contract">
	<!-- Stepper -->
	<div
		class="flex-shrink-0 w-full max-w-96 lg:max-w-2xl mx-auto mt-4 sm:mt-6 lg:mt-8 mb-6 px-4 sm:px-0"
	>
		<Stepper
			selectedButtonColor={colors.primary[300]}
			selectedTextColor={colors.primary[500]}
			buttonColor="dimgray"
			stepLabels={['Artist Info', 'Contract Terms', 'Sign Contract']}
			{activeStepIndex}
			hideLabelsOnMobile={true}
			on:stepClicked={handleStepChange}
		/>
	</div>

	<!-- Main Content - Scrollable -->
	<div class="flex-1 overflow-y-auto">
		<ContentPanel
			class="pt-0 px-16 mx-auto h-full"
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
					<div class="space-y-8 max-w-5xl mx-auto w-full">
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
										class="block w-18 text-center uppercase font-thin select-none"
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
									class="grid grid-cols-[repeat(auto-fit,minmax(10rem,1fr))] gap-4 sm:gap-6 justify-items-center w-full"
								>
									<div class="flex flex-col items-center gap-2">
										<label
											class="block w-18 text-center uppercase font-thin select-none"
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
											class="block w-18 text-center uppercase font-thin select-none"
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
											class="block w-18 text-center uppercase font-thin select-none"
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
											class="block w-18 text-center uppercase font-thin select-none"
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
							class="grid w-full gap-4 grid-cols-1 sm:grid-cols-2 text-white max-w-2xl mx-auto items-stretch"
						>
							<div class="grow flex flex-wrap gap-2 justify-center items-center">
								<label
									class="block w-20 text-center uppercase font-thin select-none"
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
							<div class="flex flex-wrap gap-2 justify-center items-center">
								<label
									class="block w-20 text-center uppercase font-thin select-none"
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
							<div class="flex flex-wrap gap-2 justify-center items-center">
								<label
									class="block w-20 text-center uppercase font-thin select-none"
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
						{#if loadingCost}
							<div class="flex items-center justify-center py-8 lg:py-12">
								<div
									class="animate-spin rounded-full h-8 w-8 lg:h-12 lg:w-12 border-b-2 border-indigo-600"
								></div>

								{#if submitError}
									<div
										class="flex-shrink-0 px-4 lg:px-6 py-2 bg-error-900/50 text-error-500 text-sm"
									>
										{submitError}
									</div>
								{/if}
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
			</div>
		</ContentPanel>
	</div>
	<!-- Sticky Actions Bar -->
	<div
		class="flex-shrink-0 w-full bg-black py-2 sm:py-3 px-3 sm:px-4 border-t border-gray-700 sticky bottom-0"
	>
		<!-- Prospector -->
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
			<ContentPanel {activeStepIndex} class="w-full sm:w-auto">
				<ContentPanelItem class="flex flex-col sm:flex-row gap-2 sm:gap-3 lg:gap-4 justify-end">
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
				<ContentPanelItem class="flex flex-col sm:flex-row gap-2 sm:gap-3 lg:gap-4 justify-end">
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

				<ContentPanelItem class="flex flex-col sm:flex-row gap-2 sm:gap-3 lg:gap-4 justify-end">
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
		</div>
	</div>
</section>
