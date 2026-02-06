<script lang="ts">
	import { XMarkIcon, CheckIcon } from 'heroicons-svelte/24/solid';
	import RadialProgressBar from '../progress-bars/RadialProgressBar.svelte';
	import RecordIcon from '$lib/icons/RecordIcon.svelte';

	export let state: 'loading' | 'in-progress' | 'failed' | 'succeeded' | 'error' = 'succeeded';
	export let durationText: string = '6h 34m 45s';
	export let inProgressDescription: string = 'Creating beats...';
	export let beatmakerName: string = 'Beatmaker';
	export let numberOfBeats: number = 1;
	export let taskProgress = 0;
</script>

<article
	class="border border-gray-800 h-auto bg-primary-950 rounded-lg w-48 flex flex-col items-center gap-4 select-none"
>
	{#if state === 'in-progress'}
		<div class="relative group p-4 w-48 h-64 overflow-hidden flex flex-col items-center gap-4">
			<div class="text-center">
				<h4 class="uppercase text-sm font-thin leading-none">Producing</h4>
				<p class="uppercase text-lg font-black leading-none">
					{numberOfBeats} Beat{numberOfBeats !== 1 ? 's' : ''}
				</p>
				<p class="text-xs text-primary-400 mt-1">{beatmakerName}</p>
			</div>

			<RadialProgressBar
				value={taskProgress}
				strokeWidth={2}
				useGradient={true}
				gradientFrom="#f59e0b"
				gradientTo="#ef4444"
				backgroundClass="stroke-gray-800"
			>
				<div class="flex flex-col items-center">
					<span class="text-xl font-thin">{durationText}</span>
					<span class="text-sm font-light text-xs italic text-primary-400"
						>{inProgressDescription}</span
					>
				</div>
			</RadialProgressBar>
		</div>
	{:else if state === 'failed'}
		<div class="relative group p-4 w-48 h-64 overflow-hidden flex flex-col items-center gap-4">
			<div class="text-center mb-4">
				<h4 class="uppercase text-sm font-thin leading-none">Producing</h4>
				<p class="uppercase text-lg font-black leading-none">
					{numberOfBeats} Beat{numberOfBeats !== 1 ? 's' : ''}
				</p>
				<p class="text-xs text-primary-400 mt-1">{beatmakerName}</p>
			</div>
			<RadialProgressBar
				value={taskProgress}
				strokeWidth={2}
				progressClass="stroke-error-500"
				backgroundClass="stroke-gray-800"
			>
				<div class="flex flex-col items-center">
					<XMarkIcon class="w-4 h-4 text-error-500 inline" />
					<span class="text-error-500 text-lg uppercase">Failed</span>
				</div>
			</RadialProgressBar>
		</div>
	{:else if state === 'succeeded'}
		<div class="relative group p-4 w-48 h-64 overflow-hidden flex flex-col items-center gap-4">
			<div class="text-center mb-4">
				<h4 class="uppercase text-sm font-thin leading-none">Producing</h4>
				<p class="uppercase text-lg font-black leading-none">
					{numberOfBeats} Beat{numberOfBeats !== 1 ? 's' : ''}
				</p>
				<p class="text-xs text-primary-400 mt-1">{beatmakerName}</p>
			</div>

			<RadialProgressBar
				value={taskProgress}
				strokeWidth={2}
				progressClass="stroke-success-500"
				backgroundClass="stroke-gray-800"
			>
				<div class="flex flex-col items-center">
					<CheckIcon class="w-4 h-4 text-success-500" />
					<span class="text-success-500 text-lg uppercase">Complete</span>
				</div>
			</RadialProgressBar>
		</div>
	{/if}
</article>
