<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { XMarkIcon, CheckIcon, ArrowRightIcon } from 'heroicons-svelte/24/solid';
	import { ArrowPathIcon } from 'heroicons-svelte/24/outline';
	import RadialProgressBar from '../progress-bars/RadialProgressBar.svelte';
	import { ScoutingType, ScoutingTypeNames } from '$lib/types/scoutingArtistsTask';
	import { formatCurrency } from '$lib/utils';

	export let state: 'loading' | 'in-progress' | 'failed' | 'succeeded' | 'error' = 'succeeded';
	export let durationText: string = '6h 34m 45s';
	export let inProgressDescription: string = 'Observing at open mic...';
	export let scoutingType: ScoutingType = ScoutingType.Rappers;
	export let taskProgress = 0;

	// Props for loading state with detailed info
	export let genreNames: string[] = [];
	export let scopeName: string = '';
	export let estimatedCost: number | null = null;
	export let estimatedDuration: string = '';

	const dispatch = createEventDispatcher();
</script>

<article
	class="flex h-auto w-48 select-none flex-col items-center gap-4 rounded-lg border border-gray-800 bg-primary-950"
>
	{#if state === 'loading'}
		<div class="relative flex h-64 w-48 flex-col items-center gap-3 overflow-hidden p-4">
			<div class="mb-2 text-center">
				<h4 class="text-sm font-thin uppercase leading-none">Scouting</h4>
				<p class="text-lg font-black uppercase leading-none">{ScoutingTypeNames[scoutingType]}</p>
			</div>

			<div class="flex flex-1 flex-col items-center justify-center gap-2">
				<ArrowPathIcon class="h-8 w-8 animate-spin text-primary-400" />
				<p class="text-center text-xs font-semibold text-primary-300">
					Scouting is starting, be ready...
				</p>
			</div>

			<div class="w-full space-y-1 text-xs text-gray-400">
				{#if scopeName}
					<div class="flex justify-between">
						<span class="text-gray-500">Scope:</span>
						<span class="ml-2 truncate text-right">{scopeName}</span>
					</div>
				{/if}
				{#if genreNames.length > 0}
					<div class="flex justify-between">
						<span class="text-gray-500">Genres:</span>
						<span class="ml-2 truncate text-right">{genreNames.join(', ')}</span>
					</div>
				{/if}
				{#if estimatedDuration}
					<div class="flex justify-between">
						<span class="text-gray-500">Duration:</span>
						<span class="text-right">{estimatedDuration}</span>
					</div>
				{/if}
				{#if estimatedCost !== null}
					<div class="flex justify-between">
						<span class="text-gray-500">Est. Cost:</span>
						<span class="text-right">{formatCurrency(estimatedCost)}</span>
					</div>
				{/if}
			</div>
		</div>
	{:else if state === 'in-progress'}
		<div class="group relative flex h-64 w-48 flex-col items-center gap-4 overflow-hidden p-4">
			<div class="mb-4 text-center">
				<h4 class="text-sm font-thin uppercase leading-none">Scouting</h4>
				<p class="text-lg font-black uppercase leading-none">{ScoutingTypeNames[scoutingType]}</p>
			</div>

			<RadialProgressBar
				value={taskProgress}
				strokeWidth={2}
				useGradient={true}
				gradientFrom="#8b5cf6"
				gradientTo="#ec4899"
				backgroundClass="stroke-gray-800"
			>
				<div class="flex flex-col items-center">
					<span class="text-xl font-thin">{durationText}</span>
					<span class="text-sm text-xs font-light italic text-primary-400"
						>{inProgressDescription}</span
					>
				</div>
			</RadialProgressBar>
		</div>
	{:else if state === 'failed'}
		<div class="group relative flex h-64 w-48 flex-col items-center gap-4 overflow-hidden p-4">
			<div class="mb-4 text-center">
				<h4 class="text-sm font-thin uppercase leading-none">Scouting</h4>
				<p class="text-lg font-black uppercase leading-none">{ScoutingTypeNames[scoutingType]}</p>
			</div>
			<RadialProgressBar
				value={taskProgress}
				strokeWidth={2}
				progressClass="stroke-error-500"
				backgroundClass="stroke-gray-800"
			>
				<div class="flex flex-col items-center">
					<div class="flex flex-col items-center">
						<XMarkIcon class="inline h-4 w-4 text-error-500" />
						<span class="text-lg uppercase text-error-500">Failed</span>
					</div>
				</div>
			</RadialProgressBar>
		</div>
	{:else if state === 'succeeded'}
		<div class="group relative flex h-64 w-48 flex-col items-center gap-4 overflow-hidden p-4">
			<div class="mb-4 text-center">
				<h4 class="text-sm font-thin uppercase leading-none">Scouting</h4>
				<p class="text-lg font-black uppercase leading-none">{ScoutingTypeNames[scoutingType]}</p>
			</div>

			<RadialProgressBar
				value={taskProgress}
				strokeWidth={2}
				progressClass="stroke-success-500"
				backgroundClass="stroke-gray-800"
			>
				<div class="flex flex-col items-center">
					<div class="flex flex-col items-center">
						<CheckIcon class="h-4 w-4 text-success-500" />
						<span class="text-lg uppercase text-success-500">Succeeded</span>
					</div>
				</div>
			</RadialProgressBar>

			<button
				type="button"
				class="
				absolute inset-0
				flex
				cursor-pointer flex-col
				items-center
				justify-center
				justify-between
				rounded-lg
				border border-primary-500 bg-primary-950 p-4 opacity-0 transition-opacity group-hover:opacity-100"
				on:click={() => dispatch('viewResults')}
			>
				<span class="font-black uppercase text-primary-500">Results</span>
				<svg
					fill="text-primary-500"
					id="Layer_1"
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 57.27 81.25"
					class="size-16 text-primary-500"
					><path
						fill="#0c88ea"
						d="M50.88,4.68h-16.18c-.72-2.68-3.19-4.68-6.07-4.68-1.66,0-3.23,.64-4.4,1.8-.82,.8-1.39,1.79-1.68,2.88H6.39C2.86,4.67,0,7.54,0,11.06v63.8c0,3.52,2.87,6.39,6.39,6.39H50.88c3.52,0,6.39-2.87,6.39-6.39V11.06c0-3.52-2.86-6.39-6.38-6.39h0Zm-27.01,3.04c.83,0,1.5-.66,1.52-1.49,.02-.86,.36-1.66,.98-2.26,.6-.6,1.41-.93,2.27-.93,1.75,0,3.21,1.43,3.24,3.18,.02,.83,.69,1.49,1.52,1.49h5.11v5.91H18.77V7.71h5.11Zm30.35,67.15c0,1.84-1.5,3.34-3.34,3.34H6.39c-1.84,0-3.34-1.5-3.34-3.34V11.06c0-1.84,1.5-3.34,3.34-3.34H15.72v7.43c0,.84,.68,1.52,1.52,1.52h22.78c.84,0,1.52-.68,1.52-1.52V7.72h9.33c1.84,0,3.34,1.5,3.34,3.34v63.8h0Zm-25.59-24.88c7.59,0,13.77-6.18,13.77-13.77s-6.18-13.77-13.77-13.77-13.77,6.18-13.77,13.77,6.18,13.77,13.77,13.77Zm0-24.49c5.91,0,10.72,4.81,10.72,10.72s-4.81,10.72-10.72,10.72-10.72-4.81-10.72-10.72,4.81-10.72,10.72-10.72Zm-6.34,10.98c-.59-.59-.59-1.56,0-2.15,.59-.59,1.55-.59,2.15,0l2.98,2.98,5.39-5.39c.59-.59,1.55-.59,2.15,0s.59,1.56,0,2.15l-6.46,6.46c-.3,.3-.69,.45-1.07,.45s-.78-.15-1.07-.45l-4.05-4.05h0Zm20.94,22.93c0,.84-.68,1.52-1.52,1.52H15.55c-.84,0-1.52-.68-1.52-1.52s.68-1.52,1.52-1.52h26.17c.84,0,1.52,.68,1.52,1.52Zm0,8.03c0,.84-.68,1.52-1.52,1.52H15.55c-.84,0-1.52-.68-1.52-1.52s.68-1.52,1.52-1.52h26.17c.84,0,1.52,.68,1.52,1.52Z"
					/></svg
				>
				<span
					class="mt-2 block rounded-full border border-primary-500 pb-1 pl-2 pr-2 pt-1 text-xs text-primary-500"
					>View details <ArrowRightIcon class="inline h-4 w-4 text-primary-500 " /></span
				>
			</button>
		</div>
	{/if}
</article>
