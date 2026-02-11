/**
 * Global Task Claiming Service (Enhanced v2)
 *
 * Manages automatic claiming of finished tasks at the app level.
 * Uses reactive stores to automatically detect finished tasks,
 * ensuring consistency across all pages.
 *
 * Improvements over v1:
 * - Uses global time and task state stores for automatic reactivity
 * - No independent timer - leverages the global time system
 * - More efficient - only processes when tasks actually finish
 */

import { get } from 'svelte/store';
import { queryClient, queryKeys } from '$lib/queries/queryClient';
import { serverTimeOffset } from '$lib/queries/taskQueries';
import { createUnclaimedFinishedTasksStore } from '$lib/stores/taskState';
import { claimTask } from '$lib/api/tasks';
import { fetchArtistsByIds } from '$lib/api/artists';
import { addDiscoveredArtists } from '$lib/queries/artistQueries';
import { errorNotifications } from '$lib/stores/errorNotifications';
import { handleError, getUserFriendlyError } from '$lib/utils';
import { TaskType, type TimedTask, type ScoutingTaskResults } from '$lib/types/task';

class TaskClaimingService {
	private unsubscribe: (() => void) | null = null;
	private claimingTaskIds = new Set<string>();
	private currentLabelId: string | null = null;
	private isActive = false;
	private lastCheckTime = 0;
	private readonly CHECK_THROTTLE = 1000; // Throttle to once per second

	/**
	 * Start the global task claiming service for a specific label
	 */
	start(labelId: string) {
		// Don't restart if already running for this label
		if (this.isActive && this.currentLabelId === labelId) return;

		// Stop any existing subscription
		this.stop();

		this.currentLabelId = labelId;
		this.isActive = true;
		this.claimingTaskIds.clear();

		console.log(`[TaskClaimingService] Started for label: ${labelId}`);

		// Create a reactive store that watches for finished, unclaimed tasks
		const finishedTasksStore = createUnclaimedFinishedTasksStore(labelId);

		// Subscribe to the store - it will automatically update with global time
		this.unsubscribe = finishedTasksStore.subscribe((finishedTasks) => {
			// Throttle checks to avoid excessive processing
			const now = Date.now();
			if (now - this.lastCheckTime < this.CHECK_THROTTLE) {
				return;
			}
			this.lastCheckTime = now;

			// Only process if there are actually finished tasks
			if (finishedTasks.length > 0) {
				this.claimFinishedTasks(finishedTasks);
			}
		});
	}

	/**
	 * Stop the global task claiming service
	 */
	stop() {
		if (this.unsubscribe) {
			this.unsubscribe();
			this.unsubscribe = null;
		}
		this.isActive = false;
		this.claimingTaskIds.clear();
		this.currentLabelId = null;
		console.log('[TaskClaimingService] Stopped');
	}

	/**
	 * Claim finished tasks
	 */
	private async claimFinishedTasks(tasks: TimedTask[]) {
		// Filter out tasks that are already being claimed
		const unclaimed = tasks.filter((t) => !this.claimingTaskIds.has(t.id));

		if (unclaimed.length === 0) return;

		// Track which resources need to be refreshed
		const contractIdsToRefresh = new Set<string>();
		let hasPublishingTask = false;
		let hasBeatProductionTask = false;

		unclaimed.forEach((task) => {
			if ('contractId' in task && typeof task.contractId === 'string' && task.contractId) {
				contractIdsToRefresh.add(task.contractId);
			}
			if (task.taskType === TaskType.PublishingRelease) {
				hasPublishingTask = true;
			}
			if (task.taskType === TaskType.ProducingBeats) {
				hasBeatProductionTask = true;
			}
		});

		// Mark tasks as being claimed
		unclaimed.forEach((task) => this.claimingTaskIds.add(task.id));

		console.log(`[TaskClaimingService] Claiming ${unclaimed.length} finished task(s)`);

		// Claim all finished tasks in parallel
		const claimPromises = unclaimed.map(async (task) => {
			try {
				const claimedTask = await claimTask(task.id);

				// Fetch and store discovered artists if this is a scouting task
				if (claimedTask.results && 'discoveredArtistsIds' in claimedTask.results) {
					const scoutingResults = claimedTask.results as ScoutingTaskResults;
					if (scoutingResults.discoveredArtistsIds?.length > 0) {
						const artists = await fetchArtistsByIds(scoutingResults.discoveredArtistsIds);
						addDiscoveredArtists(artists, false);
					}
				}

				return { success: true, taskId: task.id, taskType: task.taskType };
			} catch (err) {
				handleError('ClaimTask', err);
				errorNotifications.add('Task Claim Failed', getUserFriendlyError(err).message);
				this.claimingTaskIds.delete(task.id); // Allow retry
				return { success: false, taskId: task.id, error: err };
			}
		});

		const results = await Promise.all(claimPromises);

		// Count successful claims by type for notification
		const successfulClaims = results.filter((r) => r.success);
		const taskTypeCount = new Map<TaskType, number>();

		successfulClaims.forEach((result) => {
			if ('taskType' in result && result.taskType) {
				const count = taskTypeCount.get(result.taskType) || 0;
				taskTypeCount.set(result.taskType, count + 1);
			}
		});

		// Show success notification
		if (successfulClaims.length > 0) {
			const taskTypesStr = Array.from(taskTypeCount.entries())
				.map(([type, count]) => `${count} ${this.getTaskTypeDisplayName(type)}`)
				.join(', ');

			errorNotifications.add('Tasks Completed', `Successfully claimed: ${taskTypesStr}`, 'success');
		}

		// Refetch tasks to get updated state
		queryClient.invalidateQueries({ queryKey: queryKeys.tasks.byLabel(this.currentLabelId) });
		queryClient.invalidateQueries({ queryKey: queryKeys.contracts.byLabel(this.currentLabelId) });

		if (contractIdsToRefresh.size > 0) {
			queryClient.invalidateQueries({
				queryKey: queryKeys.contracts.byIds([...contractIdsToRefresh])
			});
		}

		// If any publishing tasks were claimed, invalidate releases cache
		if (hasPublishingTask) {
			queryClient.invalidateQueries({ queryKey: queryKeys.releases.byLabel(this.currentLabelId) });
		}

		// If any beat production tasks were claimed, invalidate beats cache
		if (hasBeatProductionTask) {
			queryClient.invalidateQueries({ queryKey: queryKeys.beats.byLabel(this.currentLabelId) });
		}

		// Also invalidate the label itself (budget may have changed)
		queryClient.invalidateQueries({ queryKey: queryKeys.labels.byId(this.currentLabelId) });
	}

	/**
	 * Get user-friendly display name for task types
	 */
	private getTaskTypeDisplayName(taskType: TaskType): string {
		switch (taskType) {
			case TaskType.Scouting:
				return 'Scouting';
			case TaskType.SigningContract:
				return 'Contract';
			case TaskType.ProducingBeats:
				return 'Beat Production';
			case TaskType.PublishingRelease:
				return 'Release';
			case TaskType.RecordingRelease:
				return 'Recording';
			case TaskType.Resting:
				return 'Resting';
			default:
				return 'Task';
		}
	}

	/**
	 * Get the current active label ID
	 */
	getCurrentLabelId(): string | null {
		return this.currentLabelId;
	}

	/**
	 * Check if the service is currently active
	 */
	isRunning(): boolean {
		return this.isActive;
	}
}

// Export a singleton instance
export const taskClaimingService = new TaskClaimingService();
