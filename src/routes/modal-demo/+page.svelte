<script lang="ts">
	import { openExampleModal1, openExampleModal2 } from '$lib/modals/usage';

	// Example: Open modal with user data
	const handleOpenModal1WithData = () => {
		const userData = {
			userId: 123,
			username: 'john_doe',
			email: 'john@example.com'
		};
		openExampleModal1(userData);
	};

	// Example: Open modal with different data
	const handleOpenModal2WithData = () => {
		const formData = {
			action: 'confirm_delete',
			itemName: 'Sample Item'
		};
		openExampleModal2(formData);
	};
</script>

<div class="min-h-screen bg-gray-50 p-8">
	<div class="mx-auto max-w-2xl">
		<h1 class="mb-8 text-4xl font-bold text-gray-900">Modal System Demo</h1>

		<div class="space-y-8">
			<!-- Section 1: Basic Modal Usage -->
			<section class="rounded-lg bg-white p-6 shadow">
				<h2 class="mb-4 text-2xl font-semibold text-gray-800">Basic Modal Usage</h2>
				<p class="mb-4 text-gray-600">
					Open simple modals without any data. The modal system ensures only one modal can be open
					at a time.
				</p>
				<div class="flex gap-4">
					<button
						on:click={() => openExampleModal1()}
						class="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition-colors"
					>
						Open Modal 1
					</button>
					<button
						on:click={() => openExampleModal2()}
						class="rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700 transition-colors"
					>
						Open Modal 2
					</button>
				</div>
			</section>

			<!-- Section 2: Modal with Data -->
			<section class="rounded-lg bg-white p-6 shadow">
				<h2 class="mb-4 text-2xl font-semibold text-gray-800">Modal with Data</h2>
				<p class="mb-4 text-gray-600">
					Pass data to modals and display it within the modal content. The data is available in the
					modal component and can be used to customize the modal behavior.
				</p>
				<div class="flex gap-4">
					<button
						on:click={handleOpenModal1WithData}
						class="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition-colors"
					>
						Open Modal 1 with User Data
					</button>
					<button
						on:click={handleOpenModal2WithData}
						class="rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700 transition-colors"
					>
						Open Modal 2 with Form Data
					</button>
				</div>
			</section>

			<!-- Section 3: How It Works -->
			<section class="rounded-lg bg-white p-6 shadow">
				<h2 class="mb-4 text-2xl font-semibold text-gray-800">How the Modal System Works</h2>
				<ol class="list-inside list-decimal space-y-2 text-gray-600">
					<li>
						<strong>Store-Based:</strong> The modal state is managed by a Svelte store in
						<code>src/lib/stores/modal.ts</code>
					</li>
					<li>
						<strong>Single Modal:</strong> Only one modal can be open at a time. Opening a new modal closes
						the previous one.
					</li>
					<li>
						<strong>Dynamic Content:</strong> Different modal types render different content components.
					</li>
					<li>
						<strong>Global Access:</strong> The modal is added to the root layout, so it's available from
						any page.
					</li>
					<li>
						<strong>Easy to Extend:</strong> Add new modal types by updating the store type and Modal.svelte
						component.
					</li>
				</ol>
			</section>

			<!-- Section 4: Code Example -->
			<section class="rounded-lg bg-white p-6 shadow">
				<h2 class="mb-4 text-2xl font-semibold text-gray-800">Quick Code Example</h2>
				<pre class="overflow-x-auto rounded bg-gray-100 p-4 text-sm text-gray-800"><code
						>{`// In any Svelte component
import { openExampleModal1 } from '$lib/modals/usage';

// Open modal without data
function handleClick() {
  openExampleModal1();
}

// Open modal with data
function handleClickWithData() {
  openExampleModal1({ userId: 123, name: 'John' });
}`}</code
					></pre>
			</section>

			<!-- Section 5: File Structure -->
			<section class="rounded-lg bg-white p-6 shadow">
				<h2 class="mb-4 text-2xl font-semibold text-gray-800">File Structure</h2>
				<pre class="overflow-x-auto rounded bg-gray-100 p-4 text-sm text-gray-800"><code
						>{`src/lib/
├── components/
│   ├── Modal.svelte (Main modal wrapper)
│   └── modals/
│       ├── ExampleModal1.svelte
│       └── ExampleModal2.svelte
├── stores/
│   └── modal.ts (Modal state management)
└── modals/
    └── usage.ts (Helper functions)`}</code
					></pre>
			</section>
		</div>
	</div>
</div>

<style>
	code {
		background-color: #f0f0f0;
		padding: 0.2em 0.4em;
		border-radius: 0.3em;
		font-family: 'Courier New', monospace;
	}
</style>
