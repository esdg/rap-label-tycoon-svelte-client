<script lang="ts">
	import { colors } from '$lib/theme';
	import { modalStore } from '$lib/stores/modal';
	import Stepper from '$lib/components/Stepper.svelte';
	import ContentPanel from '$lib/components/ContentPanel.svelte';
	import ScrollableContainer from '$lib/components/ScrollableContainer.svelte';

	// State
	let activeStepIndex = 0;
	let totalSteps = 3;
	let error: string | null = null;

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

<ScrollableContainer {error}>
	<svelte:fragment slot="header">
		<Stepper
			selectedButtonColor={colors.primary[300]}
			selectedTextColor={colors.primary[500]}
			buttonColor="dimgray"
			stepLabels={['Artist & style', 'Beats selection', 'Start Recording']}
			{activeStepIndex}
			hideLabelsOnMobile={true}
			on:stepClicked={handleStepChange}
		/>
	</svelte:fragment>
	<svelte:fragment>
		<ContentPanel
			class="pt-0 p-4 mx-auto h-full"
			{activeStepIndex}
			transition="slide"
			duration={300}
		></ContentPanel>
	</svelte:fragment>

	<svelte:fragment slot="footer"></svelte:fragment>
</ScrollableContainer>
