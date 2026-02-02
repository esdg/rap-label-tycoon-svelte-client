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

	// State
	let activeStepIndex = 0;
	let totalSteps = 3;

	// Event handlers
	function handleCancel() {
		modalStore.close();
	}

	function handleStepChange(event: { detail: number }) {
		activeStepIndex = event.detail;
	}

	function handlePrevious() {
		if (activeStepIndex > 0) {
			activeStepIndex -= 1;
		}
	}

	function handleNext() {
		if (activeStepIndex < totalSteps - 1) {
			activeStepIndex += 1;
		}
	}

	const artist = modalStore.getData().artist;

	// Computed choices
	$: scoutingTypeChoices = [
		{ name: 'test', value: 0 },
		{ name: 'test1', value: 1 },
		{ name: 'test2', value: 2 }
	];

	let value: number | null = null;

	let choice: SelectGroupChoice = 0;
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
			class="pt-0 p-4 mx-auto h-full"
			{activeStepIndex}
			transition="slide"
			duration={300}
		>
			<ContentPanelItem>
				<!-- Step 1: Artist Info -->
				<!-- svelte-ignore missing-declaration -->
				<ArtistDetails {artist} />
			</ContentPanelItem>
			<ContentPanelItem>
				<SelectGroupField bind:selected={choice}>
					<div slot="left">
						<!-- left content -->
						<NumericField
							id="bonus"
							label="Bonus"
							bind:value
							step={1000}
							suffix="$"
							min={0}
							max={500000}
						/>
					</div>
					<div slot="right">
						<!-- right content -->
					</div>
				</SelectGroupField>
			</ContentPanelItem>
		</ContentPanel>
	</div>
	<!-- Sticky Actions Bar -->
	<div
		class="flex-shrink-0 w-full bg-black py-2 sm:py-3 px-3 sm:px-4 border-t border-gray-700 sticky bottom-0"
	></div>
</section>
