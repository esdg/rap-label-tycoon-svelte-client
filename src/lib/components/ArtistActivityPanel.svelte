<script lang="ts">
	import type { Artist } from '$lib/types/nonPlayingCharacter';
	import {
		getTaskProgress,
		getTaskStatus,
		getActiveBeatTask,
		getActiveRecordingTask,
		getActiveRestingTask,
		formatCurrency
	} from '$lib/utils';
	import { formatTimeRemaining } from '$lib/utils/timeUtils';
	import { formatDuration } from '$lib/utils';
	import { currentTime } from '$lib/stores/globalTime';
	import {
		createLabelTasksQuery,
		createTasksByType,
		serverTimeOffset
	} from '$lib/queries/taskQueries';
	import { currentLabel } from '$lib/stores/appState';
	import { serverAdjustedTime } from '$lib/stores/globalTime';
	import { ArrowPathIcon } from 'heroicons-svelte/24/outline';
	import ProgressBar from './progress-bars/ProgressBar.svelte';

	let className = '';
	export { className as class };

	export let artist: Artist;

	// Helper to check if a task is optimistic (waiting for API response)
	function isOptimistic(task: any): boolean {
		return task?._optimistic === true;
	}

	// Query tasks from cache (no extra network request)
	$: labelId = $currentLabel?.id ?? null;
	$: tasksQuery = createLabelTasksQuery(labelId);
	$: taskData = $tasksQuery.data
		? createTasksByType($tasksQuery.data)
		: {
				scoutingTasks: [],
				contractTasks: [],
				beatProductionTasks: [],
				recordingReleaseTasks: [],
				restingTasks: []
			};

	// Filter to find active tasks for this artist (including optimistic ones)
	$: adjustedNow = $serverAdjustedTime;

	// Also check for optimistic tasks that match this artist by workerId
	$: beatProductionTask =
		getActiveBeatTask(taskData.beatProductionTasks, artist.id, adjustedNow) ??
		taskData.beatProductionTasks.find((t) => isOptimistic(t) && t.workerId === artist.id) ??
		null;
	$: recordingReleaseTask =
		getActiveRecordingTask(taskData.recordingReleaseTasks, artist.id, adjustedNow) ??
		taskData.recordingReleaseTasks.find((t) => isOptimistic(t) && t.workerId === artist.id) ??
		null;
	$: restingTask =
		getActiveRestingTask(taskData.restingTasks, artist.id, adjustedNow) ??
		taskData.restingTasks.find((t) => isOptimistic(t) && t.workerId === artist.id) ??
		null;

	// Detect optimistic (loading) state per task type
	$: isBeatLoading = beatProductionTask ? isOptimistic(beatProductionTask) : false;
	$: isRecordingLoading = recordingReleaseTask ? isOptimistic(recordingReleaseTask) : false;
	$: isRestingLoading = restingTask ? isOptimistic(restingTask) : false;

	$: beatTaskState = beatProductionTask
		? isBeatLoading
			? 'loading'
			: getTaskStatus(beatProductionTask, $serverTimeOffset)
		: null;
	$: beatTimeRemaining = beatProductionTask
		? formatTimeRemaining(beatProductionTask.endTime, $currentTime, $serverTimeOffset)
		: '';
	$: beatProgress = beatProductionTask
		? getTaskProgress(beatProductionTask, $serverTimeOffset, $currentTime)
		: 0;
	$: numberOfBeats = beatProductionTask?.numberOfBeats || 1;
	$: beatEstimatedCost = isBeatLoading
		? ((beatProductionTask as any)?._requestData?.costPrediction?.budgetRequired ?? null)
		: null;
	$: beatEstimatedDuration = isBeatLoading
		? ((beatProductionTask as any)?._requestData?.costPrediction?.duration ?? '')
		: '';

	$: recordingTaskState = recordingReleaseTask
		? isRecordingLoading
			? 'loading'
			: getTaskStatus(recordingReleaseTask, $serverTimeOffset)
		: null;
	$: recordingTimeRemaining = recordingReleaseTask
		? formatTimeRemaining(recordingReleaseTask.endTime, $currentTime, $serverTimeOffset)
		: '';
	$: recordingProgress = recordingReleaseTask
		? getTaskProgress(recordingReleaseTask, $serverTimeOffset, $currentTime)
		: 0;
	$: numberOfTracks = recordingReleaseTask?.beatIds?.length || 1;
	$: recordingEstimatedCost = isRecordingLoading
		? ((recordingReleaseTask as any)?._requestData?.costPrediction?.budgetRequired ?? null)
		: null;
	$: recordingEstimatedDuration = isRecordingLoading
		? ((recordingReleaseTask as any)?._requestData?.costPrediction?.duration ?? '')
		: '';

	$: restingTaskState = restingTask
		? isRestingLoading
			? 'loading'
			: getTaskStatus(restingTask, $serverTimeOffset)
		: null;
	$: restingTimeRemaining = restingTask
		? formatTimeRemaining(restingTask.endTime, $currentTime, $serverTimeOffset)
		: '';
	$: restingProgress = restingTask
		? getTaskProgress(restingTask, $serverTimeOffset, $currentTime)
		: 0;
	$: restingEstimatedCost = isRestingLoading
		? ((restingTask as any)?._requestData?.costPrediction?.budgetRequired ?? null)
		: null;
	$: restingEstimatedDuration = isRestingLoading
		? ((restingTask as any)?._requestData?.costPrediction?.duration ?? '')
		: '';

	$: hasAnyTask = beatProductionTask || recordingReleaseTask || restingTask;
</script>

<div class={className}>
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
			{#if restingTaskState === 'loading'}
				<div class="flex items-center justify-between text-xs">
					<span class="text-gray-400">Resting</span>
					<ArrowPathIcon class="h-3 w-3 animate-spin text-teal-400" />
				</div>
				<p class="text-xs text-teal-300">Taking a break, settling in...</p>
				{#if restingEstimatedDuration}
					<div class="flex justify-between text-xs text-gray-500">
						<span>Duration:</span>
						<span>{formatDuration(restingEstimatedDuration)}</span>
					</div>
				{/if}
				{#if restingEstimatedCost !== null}
					<div class="flex justify-between text-xs text-gray-500">
						<span>Est. Cost:</span>
						<span>{formatCurrency(restingEstimatedCost)}</span>
					</div>
				{/if}
			{:else}
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
			{/if}
		</div>
	{/if}

	<!-- Beat Production Task Progress -->
	{#if beatProductionTask}
		<div class="space-y-1 rounded-md border border-gray-700 bg-gray-800/50 p-2">
			{#if beatTaskState === 'loading'}
				<div class="flex items-center justify-between text-xs">
					<span class="text-gray-400"
						>Producing {numberOfBeats} beat{numberOfBeats !== 1 ? 's' : ''}</span
					>
					<ArrowPathIcon class="h-3 w-3 animate-spin text-amber-400" />
				</div>
				<p class="text-xs text-amber-300">Studio is heating up...</p>
				{#if beatEstimatedDuration}
					<div class="flex justify-between text-xs text-gray-500">
						<span>Duration:</span>
						<span>{formatDuration(beatEstimatedDuration)}</span>
					</div>
				{/if}
				{#if beatEstimatedCost !== null}
					<div class="flex justify-between text-xs text-gray-500">
						<span>Est. Cost:</span>
						<span>{formatCurrency(beatEstimatedCost)}</span>
					</div>
				{/if}
			{:else}
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
			{/if}
		</div>
	{/if}

	<!-- Recording Release Task Progress -->
	{#if recordingReleaseTask}
		<div class="space-y-1 rounded-md border border-gray-700 bg-gray-800/50 p-2">
			{#if recordingTaskState === 'loading'}
				<div class="flex items-center justify-between text-xs">
					<span class="text-gray-400"
						>Recording {numberOfTracks} track{numberOfTracks !== 1 ? 's' : ''}</span
					>
					<ArrowPathIcon class="h-3 w-3 animate-spin text-purple-400" />
				</div>
				<p class="text-xs text-purple-300">Studio is warming up...</p>
				{#if recordingEstimatedDuration}
					<div class="flex justify-between text-xs text-gray-500">
						<span>Duration:</span>
						<span>{formatDuration(recordingEstimatedDuration)}</span>
					</div>
				{/if}
				{#if recordingEstimatedCost !== null}
					<div class="flex justify-between text-xs text-gray-500">
						<span>Est. Cost:</span>
						<span>{formatCurrency(recordingEstimatedCost)}</span>
					</div>
				{/if}
			{:else}
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
			{/if}
		</div>
	{/if}
</div>
