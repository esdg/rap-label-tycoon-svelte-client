<script lang="ts">
	import Tooltip from '$lib/components/Tooltip.svelte';
	import Button from '$lib/components/Button.svelte';
</script>

<div class="p-8 min-h-screen">
	<h1 class="text-2xl text-white font-bold mb-8">Tooltip Examples</h1>

	<div class="space-y-12">
		<!-- Basic text tooltip -->
		<section>
			<h2 class="text-lg text-gray-300 mb-4">Basic Text Tooltip</h2>
			<Tooltip>
				<span slot="trigger" class="text-primary-400 underline cursor-help">
					Hover me for info
				</span>
				This is a simple text tooltip.
			</Tooltip>
		</section>

		<!-- Different positions -->
		<section>
			<h2 class="text-lg text-gray-300 mb-4">Position Variants</h2>
			<div class="flex gap-8 flex-wrap">
				<Tooltip position="top">
					<span slot="trigger" class="px-4 py-2 bg-primary-800 rounded cursor-help">
						Top (default)
					</span>
					Tooltip appears on top
				</Tooltip>

				<Tooltip position="bottom">
					<span slot="trigger" class="px-4 py-2 bg-primary-800 text-white rounded cursor-help">
						Bottom
					</span>
					Tooltip appears on bottom
				</Tooltip>

				<Tooltip position="left">
					<span slot="trigger" class="px-4 py-2 bg-primary-800 text-white rounded cursor-help">
						Left
					</span>
					Tooltip appears on left
				</Tooltip>

				<Tooltip position="right">
					<span slot="trigger" class="px-4 py-2 bg-primary-800 text-white rounded cursor-help">
						Right
					</span>
					Tooltip appears on right
				</Tooltip>
			</div>
		</section>

		<!-- HTML Content -->
		<section>
			<h2 class="text-lg text-gray-300 mb-4">Rich HTML Content</h2>
			<Tooltip maxWidth={320}>
				<span slot="trigger" class="text-secondary-400 underline cursor-help">
					Hover for artist details
				</span>
				<div class="space-y-2">
					<div class="font-semibold text-secondary-400">🎤 MC Thunder</div>
					<p class="text-gray-300">
						Legendary underground rapper with over 10 years of experience.
					</p>
					<div class="flex gap-2 text-xs">
						<span class="px-2 py-0.5 bg-category-1-500 rounded-full">Hip-Hop</span>
						<span class="px-2 py-0.5 bg-category-2-500 rounded-full">Trap</span>
					</div>
				</div>
			</Tooltip>
		</section>

		<!-- With Button -->
		<section>
			<h2 class="text-lg text-gray-300 mb-4">Tooltip on Button</h2>
			<Tooltip position="right">
				<div slot="trigger">
					<Button color="primary">Sign Contract</Button>
				</div>
				<div class="text-xs">
					<strong>Tip:</strong> Make sure you have enough budget before signing!
				</div>
			</Tooltip>
		</section>

		<!-- Icon with tooltip -->
		<section>
			<h2 class="text-lg text-gray-300 mb-4">Icon with Tooltip</h2>
			<div class="flex items-center gap-2 text-white">
				<span>Artist Loyalty</span>
				<Tooltip>
					<span
						slot="trigger"
						class="w-5 h-5 flex items-center justify-center rounded-full bg-primary-700 text-xs cursor-help"
					>
						?
					</span>
					<div class="text-xs">
						<p>
							<strong>Loyalty</strong> determines how likely an artist is to renew their contract with
							your label.
						</p>
						<p class="mt-1 text-gray-400">Higher loyalty = better contract terms.</p>
					</div>
				</Tooltip>
			</div>
		</section>

		<!-- Auto-positioning demo (scroll to see it flip) -->
		<section>
			<h2 class="text-lg text-gray-300 mb-4">Auto-positioning (scroll to edges)</h2>
			<div class="flex justify-between">
				<Tooltip position="left">
					<span slot="trigger" class="px-4 py-2 bg-primary-800 text-white rounded cursor-help">
						Left edge (will flip)
					</span>
					This tooltip will flip to the right if there's no space on the left.
				</Tooltip>

				<Tooltip position="right">
					<span slot="trigger" class="px-4 py-2 bg-primary-800 text-white rounded cursor-help">
						Right edge (will flip)
					</span>
					This tooltip will flip to the left if there's no space on the right.
				</Tooltip>
			</div>
		</section>
	</div>
</div>
