<script lang="ts">
	import type {
		ProducingBeatsTaskResponse,
		RecordingReleaseTaskResponse,
		RestingTaskResponse
	} from '$lib/types/task';
	import type { Artist } from '$lib/types/nonPlayingCharacter';
	import {
		getTaskProgress,
		getTaskStatus,
		getActiveBeatTask,
		getActiveRecordingTask,
		getActiveRestingTask
	} from '$lib/utils';
	import { formatTimeRemaining } from '$lib/utils/timeUtils';
	import { currentTime } from '$lib/stores/globalTime';
	import { serverTimeOffset } from '$lib/queries/taskQueries';
	import ProgressBar from './progress-bars/ProgressBar.svelte';

	export let artist: Artist;
	export let beatProductionTasks: ProducingBeatsTaskResponse[] = [];
	export let recordingReleaseTasks: RecordingReleaseTaskResponse[] = [];
	export let restingTasks: RestingTaskResponse[] = [];

	// Filter to find active tasks for this artist
	$: beatProductionTask = getActiveBeatTask(beatProductionTasks, artist.id);
	$: recordingReleaseTask = getActiveRecordingTask(recordingReleaseTasks, artist.id);
	$: restingTask = getActiveRestingTask(restingTasks, artist.id);

	$: beatTaskState = beatProductionTask
		? getTaskStatus(beatProductionTask, $serverTimeOffset)
		: null;
	$: beatTimeRemaining = beatProductionTask
		? formatTimeRemaining(beatProductionTask.endTime, $currentTime, $serverTimeOffset)
		: '';
	$: beatProgress = beatProductionTask
		? getTaskProgress(beatProductionTask, $serverTimeOffset, $currentTime)
		: 0;
	$: numberOfBeats = beatProductionTask?.numberOfBeats || 1;

	$: recordingTaskState = recordingReleaseTask
		? getTaskStatus(recordingReleaseTask, $serverTimeOffset)
		: null;
	$: recordingTimeRemaining = recordingReleaseTask
		? formatTimeRemaining(recordingReleaseTask.endTime, $currentTime, $serverTimeOffset)
		: '';
	$: recordingProgress = recordingReleaseTask
		? getTaskProgress(recordingReleaseTask, $serverTimeOffset, $currentTime)
		: 0;
	$: numberOfTracks = recordingReleaseTask?.beatIds?.length || 1;

	$: restingTaskState = restingTask ? getTaskStatus(restingTask, $serverTimeOffset) : null;
	$: restingTimeRemaining = restingTask
		? formatTimeRemaining(restingTask.endTime, $currentTime, $serverTimeOffset)
		: '';
	$: restingProgress = restingTask
		? getTaskProgress(restingTask, $serverTimeOffset, $currentTime)
		: 0;

	$: hasAnyTask = beatProductionTask || recordingReleaseTask || restingTask;
</script>

{#if !hasAnyTask}
	<!-- Idle State -->
	<div class="space-y-1 rounded-md border border-gray-700 bg-gray-800/50 p-2">
		<div class="flex items-center justify-between text-xs">
			<span class="text-gray-500">Idle</span>
		</div>
		<ProgressBar
			value={0}
			lengthClass="w-full"
			thicknessClass="h-1"
			useGradient={false}
			progressClass="bg-gray-700"
			backgroundClass="bg-gray-800"
			ariaLabel="Artist idle"
		/>
	</div>
{/if}

<!-- Resting Task Progress -->
{#if restingTask}
	<div class="space-y-1 rounded-md border border-gray-700 bg-gray-800/50 p-2">
		<div class="flex items-center justify-between text-xs">
			<span class="text-gray-400">Resting</span>
			{#if restingTaskState === 'in-progress'}
				<span class="font-medium text-teal-300">{restingTimeRemaining}</span>
			{:else if restingTaskState === 'succeeded'}
				<span class="font-medium text-success-500">Complete</span>
			{:else if restingTaskState === 'failed'}
				<span class="font-medium text-error-500">Failed</span>
			{/if}
		</div>
		<ProgressBar
			value={restingProgress}
			lengthClass="w-full"
			thicknessClass="h-1"
			useGradient={restingTaskState === 'in-progress'}
			gradientFromClass="from-teal-400"
			gradientToClass="to-emerald-400"
			progressClass={restingTaskState === 'succeeded'
				? 'bg-success-500'
				: restingTaskState === 'failed'
					? 'bg-error-500'
					: 'bg-teal-400'}
			backgroundClass="bg-gray-800"
			ariaLabel="Resting progress"
		/>
	</div>
{/if}

<!-- Beat Production Task Progress -->
{#if beatProductionTask}
	<div class="space-y-1 rounded-md border border-gray-700 bg-gray-800/50 p-2">
		<div class="flex items-center justify-between text-xs">
			<span class="text-gray-400"
				>Producing {numberOfBeats} beat{numberOfBeats !== 1 ? 's' : ''}</span
			>
			{#if beatTaskState === 'in-progress'}
				<span class="font-medium text-amber-400">{beatTimeRemaining}</span>
			{:else if beatTaskState === 'succeeded'}
				<span class="font-medium text-success-500">Complete</span>
			{:else if beatTaskState === 'failed'}
				<span class="font-medium text-error-500">Failed</span>
			{/if}
		</div>
		<ProgressBar
			value={beatProgress}
			lengthClass="w-full"
			thicknessClass="h-1"
			useGradient={beatTaskState === 'in-progress'}
			gradientFromClass="from-amber-500"
			gradientToClass="to-red-500"
			progressClass={beatTaskState === 'succeeded'
				? 'bg-success-500'
				: beatTaskState === 'failed'
					? 'bg-error-500'
					: 'bg-amber-500'}
			backgroundClass="bg-gray-800"
			ariaLabel="Beat production progress"
		/>
	</div>
{/if}

<!-- Recording Release Task Progress -->
{#if recordingReleaseTask}
	<div class="space-y-1 rounded-md border border-gray-700 bg-gray-800/50 p-2">
		<div class="flex items-center justify-between text-xs">
			<span class="text-gray-400"
				>Recording {numberOfTracks} track{numberOfTracks !== 1 ? 's' : ''}</span
			>
			{#if recordingTaskState === 'in-progress'}
				<span class="font-medium text-purple-400">{recordingTimeRemaining}</span>
			{:else if recordingTaskState === 'succeeded'}
				<span class="font-medium text-success-500">Complete</span>
			{:else if recordingTaskState === 'failed'}
				<span class="font-medium text-error-500">Failed</span>
			{/if}
		</div>
		<ProgressBar
			value={recordingProgress}
			lengthClass="w-full"
			thicknessClass="h-1"
			useGradient={recordingTaskState === 'in-progress'}
			gradientFromClass="from-purple-500"
			gradientToClass="to-pink-500"
			progressClass={recordingTaskState === 'succeeded'
				? 'bg-success-500'
				: recordingTaskState === 'failed'
					? 'bg-error-500'
					: 'bg-purple-500'}
			backgroundClass="bg-gray-800"
			ariaLabel="Recording release progress"
		/>
	</div>
{/if}
