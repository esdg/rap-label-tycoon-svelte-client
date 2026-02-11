<script lang="ts">
	import Chip from '$lib/components/Chip.svelte';
	import type { TaskCostPrediction } from '$lib/types/task';
	import { formatCurrency } from '$lib/utils';
	import { formatDuration } from '$lib/utils/timeUtils';

	export let costPrediction: TaskCostPrediction | null = null;
	export let loading = false;
	export let emptyMessage = 'No cost estimation available.';
</script>

{#if loading}
	<div class="flex items-center justify-center py-8 lg:py-12">
		<div
			class="h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-600 lg:h-12 lg:w-12"
		></div>
	</div>
{:else if costPrediction}
	<div
		class="space-y-4 rounded-lg border border-primary-800/70 bg-primary-950/70 p-4 sm:p-5 lg:p-6"
	>
		<div class="flex items-start justify-between gap-3">
			<div class="space-y-1">
				<div class="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400 sm:text-xs">
					Cost estimation
				</div>
				<div class="text-sm text-gray-500">Updates when you change scope or genres.</div>
			</div>
			<Chip
				class="bg-success-300 px-2.5 text-[11px] normal-case tracking-wide text-black sm:text-xs"
			>
				live
			</Chip>
		</div>

		<div class="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4 lg:gap-6">
			<div class="space-y-2 rounded-lg border border-primary-800/60 bg-primary-950/60 p-4 sm:p-5">
				<div class="flex items-center justify-between gap-2">
					<p class="text-xs font-semibold uppercase tracking-wider text-gray-400 sm:text-sm">
						Budget Required
					</p>
					<Chip class="bg-secondary-400 px-2 text-[10px] normal-case text-black sm:text-xs"
						>Upfront</Chip
					>
				</div>
				<div class="text-2xl font-semibold tracking-tight text-white sm:text-3xl lg:text-4xl">
					{formatCurrency(costPrediction.budgetRequired)}
				</div>
				<p class="text-xs text-primary-200/80 sm:text-sm">Debited from label bankroll at start.</p>
			</div>

			<div class="bg-info-950/60 space-y-2 rounded-lg border border-info-700/50 p-4 sm:p-5">
				<div class="flex items-center justify-between gap-2">
					<p class="text-xs font-semibold uppercase tracking-wider text-gray-400 sm:text-sm">
						Duration
					</p>
					<Chip class="bg-info-300 px-2 text-[10px] normal-case text-black sm:text-xs"
						>Real time</Chip
					>
				</div>
				<div class="text-2xl font-semibold tracking-tight text-white sm:text-3xl lg:text-4xl">
					{formatDuration(costPrediction.duration)}
				</div>
				<p class="text-xs text-info-100/90 sm:text-sm">Time your prospector stays on the road.</p>
			</div>

			<div class="bg-warning-950/60 space-y-2 rounded-lg border border-warning-700/50 p-4 sm:p-5">
				<div class="flex items-center justify-between gap-2">
					<p class="text-xs font-semibold uppercase tracking-wider text-gray-400 sm:text-sm">
						Stamina Cost
					</p>
					<Chip class="bg-warning-300 px-2 text-[10px] normal-case text-black sm:text-xs"
						>Effort</Chip
					>
				</div>
				<div class="text-2xl font-semibold tracking-tight text-white sm:text-3xl lg:text-4xl">
					{costPrediction.staminaCost}
				</div>
				<p class="text-xs text-warning-100/90 sm:text-sm">
					Make sure your energy is above this threshold.
				</p>
			</div>
		</div>
	</div>
{:else}
	<div class="py-8 text-center text-gray-500 lg:py-12 lg:text-lg">{emptyMessage}</div>
{/if}
