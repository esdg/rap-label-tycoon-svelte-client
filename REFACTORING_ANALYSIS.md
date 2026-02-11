# Rap Label Tycoon - Refactoring Analysis & Best Practices

**Date:** February 11, 2026  
**Focus:** Task Synchronization & Architectural Best Practices

---

## Executive Summary

Your project has a solid foundation with TanStack Query for data management and a task claiming service. However, there are **critical synchronization issues** with task timers and progress bars across different pages. This document outlines current issues and provides a comprehensive refactoring plan.

### Critical Issues 🚨

1. **Multiple Independent Timers** - Each page component creates its own `currentTime` setInterval, causing drift and inconsistency
2. **Duplicated Progress Calculations** - Progress/status calculated independently in each component
3. **No Global Time Source** - Time tracking is not centralized, leading to sync issues across pages
4. **Polling-based Task Claiming** - Works but could be more efficient with better reactivity

---

## Current Architecture Analysis

### ✅ What's Working Well

1. **TanStack Query Implementation**
   - Good use of query keys and cache management
   - Proper invalidation strategies
   - Centralized query hooks in `src/lib/queries/`

2. **Task Claiming Service**
   - Global service that auto-claims finished tasks
   - Runs independently of UI components
   - Proper cleanup in lifecycle methods

3. **Server Time Offset**
   - Accounts for client-server time differences
   - Updated on every task fetch

4. **Component Architecture**
   - Good separation of concerns
   - Reusable components (ScoutingTaskCard, etc.)
   - Modal system for task flows

### ❌ What Needs Improvement

#### 1. Time Management (CRITICAL)

**Current Problem:**

```svelte
<!-- In labels/+page.svelte -->
let currentTime = Date.now();
onMount(() => {
    const interval = setInterval(() => {
        currentTime = Date.now();
    }, 1000);
    return () => clearInterval(interval);
});

<!-- In labels/roster/+page.svelte -->
let currentTime = Date.now();
onMount(() => {
    const interval = setInterval(() => {
        currentTime = Date.now();
    }, 1000);
    return () => clearInterval(interval);
});
```

**Issues:**

- Each page creates its own timer
- Timers can drift from each other
- No synchronization between pages
- Timer continues running even when page is not visible
- Performance impact with multiple pages

#### 2. Progress Calculation Duplication

**Current Problem:**

```svelte
<!-- Calculated separately in each component -->
{@const adjustedNow = currentTime + $serverTimeOffset}
taskProgress={getTaskProgress(lastTask, $serverTimeOffset, currentTime)}
```

**Issues:**

- Same calculation repeated in multiple places
- Different components might show different values at same instant
- Hard to maintain consistency

#### 3. Task State Management

**Current Problem:**

- Tasks are fetched independently by each page
- Status/progress derived locally in each component
- No centralized task state tracking

---

## Refactoring Plan

### Phase 1: Global Time Management (HIGH PRIORITY) ⏰

Create a centralized time store that all components use.

#### 1.1 Create Global Time Store

**File:** `src/lib/stores/globalTime.ts`

```typescript
/**
 * Global Time Store
 *
 * Provides a single source of truth for current time across the application.
 * This ensures all timers, countdowns, and progress bars are synchronized.
 */

import { writable, derived, get } from 'svelte/store';
import { serverTimeOffset } from '$lib/queries/taskQueries';

interface TimeState {
	clientTime: number;
	isActive: boolean;
}

function createGlobalTimeStore() {
	const { subscribe, set, update } = writable<TimeState>({
		clientTime: Date.now(),
		isActive: false
	});

	let timer: ReturnType<typeof setInterval> | null = null;

	return {
		subscribe,

		/**
		 * Start the global timer
		 * Safe to call multiple times - only one timer will run
		 */
		start() {
			update((state) => {
				if (state.isActive) return state;

				// Clear any existing timer
				if (timer) clearInterval(timer);

				// Start new timer
				timer = setInterval(() => {
					update((s) => ({ ...s, clientTime: Date.now() }));
				}, 1000);

				return { ...state, isActive: true };
			});
		},

		/**
		 * Stop the global timer
		 */
		stop() {
			if (timer) {
				clearInterval(timer);
				timer = null;
			}
			update((state) => ({ ...state, isActive: false }));
		},

		/**
		 * Force an immediate time update
		 */
		tick() {
			update((state) => ({ ...state, clientTime: Date.now() }));
		}
	};
}

export const globalTime = createGlobalTimeStore();

/**
 * Derived store: Current client time (updates every second)
 */
export const currentTime = derived(globalTime, ($state) => $state.clientTime);

/**
 * Derived store: Server-adjusted time (current time + server offset)
 */
export const serverAdjustedTime = derived(
	[currentTime, serverTimeOffset],
	([$currentTime, $offset]) => $currentTime + $offset
);

/**
 * Hook to use in components that need time tracking
 * Automatically starts the global timer
 */
export function useGlobalTime() {
	globalTime.start();
	return { currentTime, serverAdjustedTime };
}
```

#### 1.2 Start Global Timer in App Layout

**File:** `src/routes/+layout.svelte`

```svelte
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { globalTime } from '$lib/stores/globalTime';
	// ... other imports

	onMount(() => {
		// Start global timer
		globalTime.start();

		// ... existing auth listener
	});

	onDestroy(() => {
		// Stop global timer
		globalTime.stop();

		// ... existing cleanup
	});
</script>
```

#### 1.3 Update Components to Use Global Time

**Before:**

```svelte
<script lang="ts">
	let currentTime = Date.now();
	onMount(() => {
		const interval = setInterval(() => {
			currentTime = Date.now();
		}, 1000);
		return () => clearInterval(interval);
	});

	$: adjustedNow = currentTime + $serverTimeOffset;
</script>
```

**After:**

```svelte
<script lang="ts">
	import { currentTime, serverAdjustedTime } from '$lib/stores/globalTime';
	// No onMount needed! Time is global and always synchronized
</script>

<template>
	<!-- Use $currentTime and $serverAdjustedTime directly -->
	{formatTimeRemaining(task.endTime, $currentTime, $serverTimeOffset)}
</template>
```

---

### Phase 2: Task State Management (HIGH PRIORITY) 📋

Centralize task-related calculations and state.

#### 2.1 Create Task Store with Derived State

**File:** `src/lib/stores/taskState.ts`

```typescript
/**
 * Task State Store
 *
 * Provides reactive, derived state for tasks including progress,
 * status, and time remaining. Automatically updates with global time.
 */

import { derived, type Readable } from 'svelte/store';
import { serverAdjustedTime } from './globalTime';
import { serverTimeOffset } from '$lib/queries/taskQueries';
import { queryClient, queryKeys } from '$lib/queries/queryClient';
import type { TimedTask, AnyTaskResponse } from '$lib/types/task';
import { getTaskProgress, getTaskStatus, isTaskFinished } from '$lib/utils/taskUtils';

export interface TaskWithState extends TimedTask {
	progress: number;
	status: 'in-progress' | 'failed' | 'succeeded';
	isFinished: boolean;
	timeRemaining: number;
}

/**
 * Creates a reactive store for a specific label's tasks with computed state
 */
export function createTasksStateStore(labelId: string | null): Readable<TaskWithState[]> {
	return derived([serverAdjustedTime, serverTimeOffset], ([$adjustedTime, $offset]) => {
		if (!labelId) return [];

		const tasks = queryClient.getQueryData<TimedTask[]>(queryKeys.tasks.byLabel(labelId));

		if (!tasks) return [];

		return tasks.map((task) => {
			const endTime = new Date(task.endTime).getTime();
			const timeRemaining = Math.max(0, endTime - $adjustedTime);

			return {
				...task,
				progress: getTaskProgress(task, $offset),
				status: getTaskStatus(task, $offset),
				isFinished: isTaskFinished(task, $offset),
				timeRemaining
			};
		});
	});
}

/**
 * Creates a reactive store for a single task with computed state
 */
export function createTaskStateStore(
	taskId: string,
	labelId: string
): Readable<TaskWithState | null> {
	return derived(
		createTasksStateStore(labelId),
		($tasks) => $tasks.find((t) => t.id === taskId) ?? null
	);
}

/**
 * Get all finished but unclaimed tasks
 */
export function createUnclaimedFinishedTasksStore(
	labelId: string | null
): Readable<TaskWithState[]> {
	return derived(createTasksStateStore(labelId), ($tasks) =>
		$tasks.filter((t) => t.isFinished && !t.claimedAt)
	);
}
```

#### 2.2 Update Components to Use Task State

**Before:**

```svelte
<script lang="ts">
	$: tasksQuery = createLabelTasksQuery(labelId);
	let currentTime = Date.now();

	onMount(() => {
		const interval = setInterval(() => {
			currentTime = Date.now();
		}, 1000);
		return () => clearInterval(interval);
	});

	$: scoutingTasks = ($tasksQuery.data ?? []).filter(/* ... */);
	$: lastTask = scoutingTasks[scoutingTasks.length - 1];
</script>

<ScoutingTaskCard
	state={getTaskStatus(lastTask, $serverTimeOffset)}
	taskProgress={getTaskProgress(lastTask, $serverTimeOffset, currentTime)}
	durationText={formatTimeRemaining(lastTask.endTime, currentTime, $serverTimeOffset)}
/>
```

**After:**

```svelte
<script lang="ts">
	import { createTasksStateStore } from '$lib/stores/taskState';
	import { currentTime } from '$lib/stores/globalTime';

	// Fetch tasks with TanStack Query (still needed for data fetching)
	$: tasksQuery = createLabelTasksQuery(labelId);

	// Get reactive task state (auto-updates every second)
	$: tasksWithState = createTasksStateStore(labelId);

	$: scoutingTasks = $tasksWithState.filter((t) => t.taskType === TaskType.Scouting);
	$: lastTask = scoutingTasks[scoutingTasks.length - 1];
</script>

<ScoutingTaskCard
	state={lastTask.status}
	taskProgress={lastTask.progress}
	durationText={formatCountdown(lastTask.timeRemaining)}
/>
```

---

### Phase 3: Improved Task Claiming (MEDIUM PRIORITY) ✅

Make task claiming more reactive and efficient.

#### 3.1 Enhanced Task Claiming Service

**File:** `src/lib/services/taskClaimingService.ts` (Enhanced)

```typescript
/**
 * Global Task Claiming Service v2
 *
 * Improvements:
 * - Uses global time instead of local intervals
 * - More efficient checking with derived stores
 * - Better error handling and retry logic
 * - Event emission for UI feedback
 */

import { get } from 'svelte/store';
import { derived } from 'svelte/store';
import { queryClient, queryKeys } from '$lib/queries/queryClient';
import { serverTimeOffset } from '$lib/queries/taskQueries';
import { currentTime } from '$lib/stores/globalTime';
import { createUnclaimedFinishedTasksStore } from '$lib/stores/taskState';
import { claimTask } from '$lib/api/tasks';
import type { TimedTask } from '$lib/types/task';

// Event types for task claiming
export type TaskClaimEvent = {
	type: 'claiming' | 'claimed' | 'failed';
	taskId: string;
	task?: TimedTask;
	error?: Error;
};

type TaskClaimListener = (event: TaskClaimEvent) => void;

class TaskClaimingServiceV2 {
	private currentLabelId: string | null = null;
	private claimingTaskIds = new Set<string>();
	private listeners = new Set<TaskClaimListener>();
	private unsubscribe: (() => void) | null = null;
	private lastCheckTime = 0;
	private readonly CHECK_THROTTLE = 1000; // Check at most once per second

	/**
	 * Start the service for a specific label
	 */
	start(labelId: string) {
		if (this.currentLabelId === labelId && this.unsubscribe) {
			return; // Already running for this label
		}

		this.stop();
		this.currentLabelId = labelId;
		this.claimingTaskIds.clear();

		console.log(`[TaskClaimingServiceV2] Started for label: ${labelId}`);

		// Create a store that watches for finished tasks
		const finishedTasksStore = createUnclaimedFinishedTasksStore(labelId);

		// Subscribe to the store - it will update automatically with global time
		this.unsubscribe = finishedTasksStore.subscribe((finishedTasks) => {
			// Throttle checks to avoid excessive processing
			const now = Date.now();
			if (now - this.lastCheckTime < this.CHECK_THROTTLE) {
				return;
			}
			this.lastCheckTime = now;

			if (finishedTasks.length > 0) {
				this.claimFinishedTasks(finishedTasks);
			}
		});
	}

	/**
	 * Stop the service
	 */
	stop() {
		if (this.unsubscribe) {
			this.unsubscribe();
			this.unsubscribe = null;
		}
		this.currentLabelId = null;
		this.claimingTaskIds.clear();
		console.log('[TaskClaimingServiceV2] Stopped');
	}

	/**
	 * Add event listener
	 */
	on(listener: TaskClaimListener) {
		this.listeners.add(listener);
		return () => this.listeners.delete(listener);
	}

	/**
	 * Emit event to all listeners
	 */
	private emit(event: TaskClaimEvent) {
		this.listeners.forEach((listener) => listener(event));
	}

	/**
	 * Claim finished tasks
	 */
	private async claimFinishedTasks(tasks: TimedTask[]) {
		const unclaimed = tasks.filter((t) => !this.claimingTaskIds.has(t.id));

		if (unclaimed.length === 0) return;

		console.log(`[TaskClaimingServiceV2] Claiming ${unclaimed.length} task(s)`);

		unclaimed.forEach((task) => {
			this.claimingTaskIds.add(task.id);
			this.emit({ type: 'claiming', taskId: task.id, task });
		});

		const results = await Promise.allSettled(unclaimed.map((task) => this.claimSingleTask(task)));

		results.forEach((result, index) => {
			const task = unclaimed[index];
			this.claimingTaskIds.delete(task.id);

			if (result.status === 'fulfilled') {
				this.emit({ type: 'claimed', taskId: task.id, task: result.value });
			} else {
				this.emit({ type: 'failed', taskId: task.id, error: result.reason });
			}
		});
	}

	/**
	 * Claim a single task with proper error handling
	 */
	private async claimSingleTask(task: TimedTask): Promise<TimedTask> {
		try {
			const claimedTask = await claimTask(task.id);

			// Update cache
			if (this.currentLabelId) {
				queryClient.setQueryData<TimedTask[]>(queryKeys.tasks.byLabel(this.currentLabelId), (old) =>
					old?.map((t) => (t.id === claimedTask.id ? claimedTask : t))
				);
			}

			// Handle task-specific results (scouting, etc.)
			await this.handleTaskResults(claimedTask);

			return claimedTask;
		} catch (error) {
			console.error(`[TaskClaimingServiceV2] Failed to claim task ${task.id}:`, error);
			throw error;
		}
	}

	/**
	 * Handle task-specific results after claiming
	 */
	private async handleTaskResults(task: TimedTask) {
		// Handle scouting tasks
		if (task.results && 'discoveredArtistsIds' in task.results) {
			const { fetchArtistsByIds } = await import('$lib/api/artists');
			const { addDiscoveredArtists } = await import('$lib/queries/artistQueries');

			const artistIds = (task.results as any).discoveredArtistsIds;
			if (artistIds?.length > 0) {
				const artists = await fetchArtistsByIds(artistIds);
				addDiscoveredArtists(artists, false);
			}
		}

		// Invalidate related queries
		if ('contractId' in task && task.contractId) {
			queryClient.invalidateQueries({
				queryKey: queryKeys.contracts.byId(task.contractId as string)
			});
		}
	}
}

export const taskClaimingService = new TaskClaimingServiceV2();
```

---

### Phase 4: Component Refactoring (MEDIUM PRIORITY) 🎨

Update components to use the new centralized stores.

#### 4.1 Update Label Dashboard

**File:** `src/routes/labels/+page.svelte`

Key changes:

- Remove local `currentTime` timer
- Use global time stores
- Use task state stores
- Simplify progress/status calculations

#### 4.2 Update All Task-Related Components

Components to update:

- `src/routes/labels/roster/+page.svelte`
- `src/routes/labels/music-and-release/+page.svelte`
- `src/lib/components/cards/ScoutingTaskCard.svelte`
- `src/lib/components/cards/ArtistCard.svelte`
- Any other components displaying tasks

---

### Phase 5: Additional Best Practices (LOW PRIORITY) 📚

#### 5.1 Query Configuration Optimization

**File:** `src/lib/queries/queryClient.ts`

```typescript
export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 30 * 1000,
			gcTime: 5 * 60 * 1000,
			retry: 3,
			retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
			// Add refetch configuration for better reactivity
			refetchOnWindowFocus: true,
			refetchOnReconnect: true
		}
	}
});

// For task queries specifically, use shorter stale time
export const taskQueryConfig = {
	staleTime: 5 * 1000, // 5 seconds
	gcTime: 2 * 60 * 1000 // 2 minutes
};
```

Update task queries to use this config:

```typescript
export function createLabelTasksQuery(labelId: string | null) {
	return createQuery({
		queryKey: labelId ? queryKeys.tasks.byLabel(labelId) : ['tasks', 'none'],
		queryFn: async () => {
			const result = await fetchLabelTasks(labelId!);
			const clientTime = Date.now();
			const serverTime = result.serverTime.getTime();
			serverTimeOffset.set(serverTime - clientTime);
			return result.data;
		},
		enabled: !!labelId,
		...taskQueryConfig // Apply task-specific config
	});
}
```

#### 5.2 Error Boundary Component

Create a reusable error boundary for better error handling:

**File:** `src/lib/components/ErrorBoundary.svelte`

```svelte
<script lang="ts">
	import { onMount } from 'svelte';

	export let fallback: any = null;

	let error: Error | null = null;

	function handleError(event: ErrorEvent) {
		error = event.error;
		event.preventDefault();
	}

	onMount(() => {
		window.addEventListener('error', handleError);
		return () => window.removeEventListener('error', handleError);
	});
</script>

{#if error}
	{#if fallback}
		<svelte:component this={fallback} {error} />
	{:else}
		<div class="error-boundary">
			<h2>Something went wrong</h2>
			<p>{error.message}</p>
			<button on:click={() => window.location.reload()}>Reload Page</button>
		</div>
	{/if}
{:else}
	<slot />
{/if}
```

#### 5.3 Add TypeScript Strict Mode

**File:** `tsconfig.json`

```json
{
	"compilerOptions": {
		"strict": true,
		"strictNullChecks": true,
		"noImplicitAny": true,
		"noImplicitThis": true,
		"noUnusedLocals": true,
		"noUnusedParameters": true
		// ... other options
	}
}
```

#### 5.4 Performance Monitoring

Add performance monitoring utilities:

**File:** `src/lib/utils/performance.ts`

```typescript
/**
 * Performance monitoring utilities
 */

export function measureRenderTime(componentName: string) {
	const start = performance.now();

	return () => {
		const end = performance.now();
		const duration = end - start;

		if (duration > 16) {
			// More than one frame (60fps)
			console.warn(`[Performance] ${componentName} render took ${duration.toFixed(2)}ms`);
		}
	};
}

export function debounce<T extends (...args: any[]) => any>(
	func: T,
	wait: number
): (...args: Parameters<T>) => void {
	let timeout: ReturnType<typeof setTimeout> | null = null;

	return function executedFunction(...args: Parameters<T>) {
		const later = () => {
			timeout = null;
			func(...args);
		};

		if (timeout) clearTimeout(timeout);
		timeout = setTimeout(later, wait);
	};
}
```

---

## Implementation Priority

### Must Do (Critical) 🔴

1. **Global Time Store** - Fixes synchronization issues
2. **Task State Store** - Centralizes state management
3. **Remove Local Timers** - Update all components to use global time

### Should Do (Important) 🟡

4. **Enhanced Task Claiming** - More efficient and reactive
5. **Component Refactoring** - Clean up and simplify components
6. **Query Configuration** - Optimize cache and refetch behavior

### Nice to Have (Enhancement) 🟢

7. **Error Boundaries** - Better error handling
8. **TypeScript Strict Mode** - Catch more bugs at compile time
9. **Performance Monitoring** - Track and optimize performance

---

## Testing Strategy

### Manual Testing Checklist

After implementing refactoring:

- [ ] Open multiple pages simultaneously (Labels, Roster, Music & Release)
- [ ] Verify all timers show the same countdown values
- [ ] Verify progress bars are synchronized across pages
- [ ] Start a task and switch between pages - check consistency
- [ ] Let a task finish and verify auto-claiming works
- [ ] Check that finished tasks show "claim" state immediately on all pages
- [ ] Test with slow network (throttle in DevTools)
- [ ] Test with page visibility changes (switch tabs)
- [ ] Verify no memory leaks (check DevTools Performance)

### Integration Testing

Consider adding:

- Vitest for unit tests
- Playwright for E2E tests
- Testing Library for component tests

---

## Future Enhancements

### WebSocket Integration

For real-time updates without polling:

```typescript
// src/lib/services/websocket.ts
class TaskUpdateWebSocket {
	private ws: WebSocket | null = null;

	connect(labelId: string) {
		this.ws = new WebSocket(`wss://api.example.com/tasks/${labelId}`);

		this.ws.onmessage = (event) => {
			const update = JSON.parse(event.data);

			// Directly update query cache
			queryClient.setQueryData(queryKeys.tasks.byLabel(labelId), (old: TimedTask[] | undefined) => {
				// Update specific task in cache
				return old?.map((t) => (t.id === update.taskId ? { ...t, ...update } : t));
			});
		};
	}
}
```

### Offline Support

Add service worker for offline functionality:

- Cache task data
- Queue mutations when offline
- Sync when back online

### Analytics & Monitoring

Add analytics to track:

- Task completion rates
- Time to claim
- User engagement with tasks
- Performance metrics

---

## Migration Guide

### Step-by-Step Migration

1. **Create new stores** (no breaking changes)

   ```bash
   # Create globalTime.ts and taskState.ts
   ```

2. **Update layout to start global timer**

   ```bash
   # Modify +layout.svelte
   ```

3. **Migrate one component at a time**

   ```bash
   # Start with labels/+page.svelte
   # Then roster/+page.svelte
   # Then others
   ```

4. **Update task claiming service**

   ```bash
   # Replace existing taskClaimingService.ts
   ```

5. **Test thoroughly**

   ```bash
   # Manual testing on all pages
   ```

6. **Deploy gradually**
   ```bash
   # Deploy to staging first
   # Monitor for issues
   # Deploy to production
   ```

---

## Conclusion

This refactoring will:

- ✅ **Fix timer synchronization** across all pages
- ✅ **Centralize state management** for tasks
- ✅ **Improve performance** by eliminating redundant timers
- ✅ **Simplify components** by removing boilerplate
- ✅ **Enable better testing** with clearer separation of concerns
- ✅ **Set foundation** for future enhancements (WebSocket, offline support)

The most critical changes are **Phase 1 (Global Time)** and **Phase 2 (Task State)**. These two phases will solve your primary concerns about task synchronization across the application.

---

**Questions or need help implementing? Let me know which phase you'd like to start with!**
