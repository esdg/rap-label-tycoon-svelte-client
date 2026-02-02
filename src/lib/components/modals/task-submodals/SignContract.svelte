<script lang="ts">
	import { colors } from '$lib/theme';
	import { modalStore } from '$lib/stores/modal';
	import Stepper from '$lib/components/Stepper.svelte';
	import ContentPanel from '$lib/components/ContentPanel.svelte';
	import ContentPanelItem from '$lib/components/ContentPanelItem.svelte';
	import ArtistDetails from '$lib/components/ArtistDetails.svelte';
	import SelectGroupField, {
		type SelectGroupChoice
	} from '$lib/components/formfields/SelectGroupField.svelte';
	import NumericField from '$lib/components/formfields/NumericField.svelte';
	import Button from '$lib/components/Button.svelte';
	import type { ScoutingCostPrediction } from '$lib/types/scouting';
	import CostEstimation from './CostEstimation.svelte';

	// State
	let activeStepIndex = 0;
	let totalSteps = 3;
	let loading = false;
	let loadingCost = false;

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

	const artist = modalStore.getData().artist;

	let value: number | null = null;

	let choice: SelectGroupChoice = 0;

	let costPrediction: ScoutingCostPrediction | null = null;
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
					<!-- svelte-ignore missing-declaration -->
					<ArtistDetails {artist} />
				</ContentPanelItem>
				<ContentPanelItem>
					<!-- Step 2: Contract Terms -->
					<SelectGroupField class="h-xl" bind:selected={choice}>
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
							<div class="flex flex-wrap gap-2 justify-center items-center">
								<label
									class="block w-18 text-center uppercase font-thin select-none"
									for="contract-length">Contract Length</label
								>
								<NumericField
									class="w-40"
									id="contract-length"
									bind:value
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
									>The contract ends once the artist delivers the agreed number of releases (albums,
									EPs, mixtapes, or singles), regardless of how long it takes.</span
								>
							</div>
							<div class="grid grid-cols-2 gap-4 justify-center">
								<div class="flex flex-wrap gap-2 justify-center items-center">
									<label
										class="block w-18 text-center uppercase font-thin select-none"
										for="contract-albums">Albums</label
									>
									<NumericField id="contract-albums" bind:value step={1} min={0} max={5} />
								</div>
								<div class="flex flex-wrap gap-2 justify-center items-center">
									<label
										class="block w-18 text-center uppercase font-thin select-none"
										for="contract-ep">EP</label
									>
									<NumericField id="contract-ep" bind:value step={1} min={0} max={10} />
								</div>
								<div class="flex flex-wrap gap-2 justify-center items-center">
									<label
										class="block w-18 text-center uppercase font-thin select-none"
										for="contract-mixtapes">Mixtapes</label
									>
									<NumericField id="contract-mixtapes" bind:value step={1} min={0} max={5} />
								</div>
								<div class="flex flex-wrap gap-2 justify-center items-center">
									<label
										class="block w-18 text-center uppercase font-thin select-none"
										for="contract-singles">Singles</label
									>
									<NumericField id="contract-singles" bind:value step={1} min={0} max={30} />
								</div>
							</div>
						</div>
					</SelectGroupField>
					<div class="grid gap-4 grid-cols-2 text-white mt-8">
						<div class="flex flex-wrap gap-2 justify-center items-center">
							<label
								class="block w-18 text-center uppercase font-thin select-none"
								for="contract-bonus">Bonus</label
							>
							<NumericField
								class="w-40"
								id="contract-bonus"
								bind:value
								step={100}
								suffix="$"
								min={0}
								max={10000}
							/>
						</div>
						<div class="flex flex-wrap gap-2 justify-center items-center">
							<label
								class="block w-18 text-center uppercase font-thin select-none"
								for="contract-advance">Advance</label
							>
							<NumericField
								class="w-40"
								id="contract-advance"
								bind:value
								step={100}
								suffix="$"
								min={0}
								max={10000}
							/>
						</div>
						<div class="flex flex-wrap gap-2 justify-center items-center">
							<label
								class="block w-18 text-center uppercase font-thin select-none"
								for="contract-royalties">Royalties</label
							>
							<NumericField
								class="w-40"
								id="contract-royalties"
								bind:value
								step={1}
								suffix="%"
								min={0}
								max={80}
							/>
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
					on:clicked={null}
				>
					{loading ? 'Starting...' : 'Make an offer'}
				</Button>
			</ContentPanelItem>
		</ContentPanel>
	</div>
</section>
