<script lang="ts">
	import { colors } from '$lib/theme';
	import { modalStore } from '$lib/stores/modal';
	import Stepper from '$lib/components/Stepper.svelte';
	import ContentPanel from '$lib/components/ContentPanel.svelte';

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
</script>

<section class="flex flex-col h-full overflow-hidden" aria-label="Scout Talents Results">
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
		></ContentPanel>
	</div>
	<!-- Sticky Actions Bar -->
	<div
		class="flex-shrink-0 w-full bg-black py-2 sm:py-3 px-3 sm:px-4 border-t border-gray-700 sticky bottom-0"
	></div>
</section>
