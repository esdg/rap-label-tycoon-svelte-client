<script lang="ts">
	import Stepper from './Stepper.svelte';
	import ContentPanel from './ContentPanel.svelte';
	import ContentPanelItem from './ContentPanelItem.svelte';

	let currentStep = 0;
	const steps = ['Step One', 'Step Two', 'Step Three', 'Step Four'];

	function handleStepClick(event: CustomEvent<number>) {
		currentStep = event.detail;
	}
</script>

<div class="example-container p-8">
	<h1 class="text-2xl font-bold mb-6">Stepper with Content Panel Example</h1>

	<!-- Stepper Component -->
	<div class="mb-8">
		<Stepper stepLabels={steps} activeStepIndex={currentStep} on:stepClicked={handleStepClick} />
	</div>

	<!-- Content Panel Component -->
	<ContentPanel activeStepIndex={currentStep} transition="slide" duration={300}>
		<ContentPanelItem>
			<div class="p-6 bg-blue-50 rounded-lg">
				<h2 class="text-xl font-semibold mb-3">Content for Step One</h2>
				<p>
					This is the content for the first step. You can put any HTML or Svelte components here.
				</p>
				<button
					class="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
					on:click={() => currentStep++}
				>
					Next Step
				</button>
			</div>
		</ContentPanelItem>

		<ContentPanelItem>
			<div class="p-6 bg-green-50 rounded-lg">
				<h2 class="text-xl font-semibold mb-3">Content for Step Two</h2>
				<p>This is the second step's content. Each ContentPanelItem is automatically indexed.</p>
				<div class="mt-4 flex gap-2">
					<button class="px-4 py-2 bg-gray-500 text-white rounded" on:click={() => currentStep--}>
						Previous
					</button>
					<button class="px-4 py-2 bg-green-500 text-white rounded" on:click={() => currentStep++}>
						Next Step
					</button>
				</div>
			</div>
		</ContentPanelItem>

		<ContentPanelItem>
			<div class="p-6 bg-purple-50 rounded-lg">
				<h2 class="text-xl font-semibold mb-3">Content for Step Three</h2>
				<ul class="list-disc list-inside mb-4">
					<li>You can use any content structure</li>
					<li>Lists, forms, images, etc.</li>
					<li>Transitions are configurable</li>
				</ul>
				<div class="flex gap-2">
					<button class="px-4 py-2 bg-gray-500 text-white rounded" on:click={() => currentStep--}>
						Previous
					</button>
					<button class="px-4 py-2 bg-purple-500 text-white rounded" on:click={() => currentStep++}>
						Next Step
					</button>
				</div>
			</div>
		</ContentPanelItem>

		<ContentPanelItem>
			<div class="p-6 bg-yellow-50 rounded-lg">
				<h2 class="text-xl font-semibold mb-3">Final Step</h2>
				<p class="mb-4">You've reached the last step!</p>
				<button class="px-4 py-2 bg-gray-500 text-white rounded" on:click={() => currentStep--}>
					Previous
				</button>
			</div>
		</ContentPanelItem>
	</ContentPanel>
</div>

<style>
	.example-container {
		max-width: 800px;
		margin: 0 auto;
	}
</style>
