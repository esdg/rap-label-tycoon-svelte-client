<script lang="ts">
	import Chip from '$lib/components/Chip.svelte';
	import type { TaskCostPrediction } from '$lib/types/task';
	import { formatDuration } from '$lib/utils/timeUtils';

	export let costPrediction: TaskCostPrediction | null = null;
	export let loading = false;
	export let emptyMessage = 'No cost estimation available.';
</script>

{#if loading}
	<div class="flex items-center justify-center py-8 lg:py-12">
		<div
			class="animate-spin rounded-full h-8 w-8 lg:h-12 lg:w-12 border-b-2 border-indigo-600"
		></div>
	</div>
{:else if costPrediction}
	<div
		class="bg-primary-950/70 border border-primary-800/70 rounded-lg p-4 sm:p-5 lg:p-6 space-y-4"
	>
		<div class="flex items-start justify-between gap-3">
			<div class="space-y-1">
				<div class="text-[11px] sm:text-xs font-semibold text-gray-400 uppercase tracking-[0.18em]">
					Cost estimation
				</div>
				<div class="text-sm text-gray-500">Updates when you change scope or genres.</div>
			</div>
			<Chip
				class="normal-case tracking-wide text-[11px] sm:text-xs px-2.5 bg-success-300 text-black"
			>
				live
			</Chip>
		</div>

		<div class="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
			<div class="rounded-lg border border-primary-800/60 bg-primary-950/60 p-4 sm:p-5 space-y-2">
				<div class="flex items-center justify-between gap-2">
					<p class="text-xs sm:text-sm font-semibold text-gray-400 uppercase tracking-wider">
						Budget Required
					</p>
					<Chip class="normal-case text-[10px] sm:text-xs px-2 bg-secondary-400 text-black"
						>Upfront</Chip
					>
				</div>
				<div class="text-2xl sm:text-3xl lg:text-4xl font-semibold text-white tracking-tight">
					$ {costPrediction.budgetRequired.toLocaleString()}
				</div>
				<p class="text-xs sm:text-sm text-primary-200/80">Debited from label bankroll at start.</p>
			</div>

			<div class="rounded-lg border border-info-700/50 bg-info-950/60 p-4 sm:p-5 space-y-2">
				<div class="flex items-center justify-between gap-2">
					<p class="text-xs sm:text-sm font-semibold text-gray-400 uppercase tracking-wider">
						Duration
					</p>
					<Chip class="normal-case text-[10px] sm:text-xs px-2 bg-info-300 text-black"
						>Real time</Chip
					>
				</div>
				<div class="text-2xl sm:text-3xl lg:text-4xl font-semibold text-white tracking-tight">
					{formatDuration(costPrediction.duration)}
				</div>
				<p class="text-xs sm:text-sm text-info-100/90">Time your prospector stays on the road.</p>
			</div>

			<div class="rounded-lg border border-warning-700/50 bg-warning-950/60 p-4 sm:p-5 space-y-2">
				<div class="flex items-center justify-between gap-2">
					<p class="text-xs sm:text-sm font-semibold text-gray-400 uppercase tracking-wider">
						Stamina Cost
					</p>
					<Chip class="normal-case text-[10px] sm:text-xs px-2 bg-warning-300 text-black"
						>Effort</Chip
					>
				</div>
				<div class="text-2xl sm:text-3xl lg:text-4xl font-semibold text-white tracking-tight">
					{costPrediction.staminaCost}
				</div>
				<p class="text-xs sm:text-sm text-warning-100/90">
					Make sure your energy is above this threshold.
				</p>
			</div>
		</div>
	</div>
{:else}
	<div class="text-center py-8 lg:py-12 text-gray-500 lg:text-lg">{emptyMessage}</div>
{/if}
