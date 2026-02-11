/**
 * Global Time Store
 *
 * Provides a single source of truth for current time across the application.
 * This ensures all timers, countdowns, and progress bars are synchronized.
 *
 * Usage:
 * - Import `currentTime` or `serverAdjustedTime` in any component
 * - No need to create local timers - time is global and always synchronized
 * - The timer is automatically started in +layout.svelte
 */

import { writable, derived } from 'svelte/store';
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

				// Start new timer (ticks every second)
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
 *
 * Use this in components that need the current time.
 * Example: `formatTimeRemaining(task.endTime, $currentTime, $serverTimeOffset)`
 */
export const currentTime = derived(globalTime, ($state) => $state.clientTime);

/**
 * Derived store: Server-adjusted time (current time + server offset)
 *
 * Use this for calculations that need server-synchronized time.
 * Example: `const adjustedNow = $serverAdjustedTime;`
 */
export const serverAdjustedTime = derived(
	[currentTime, serverTimeOffset],
	([$currentTime, $offset]) => $currentTime + $offset
);

/**
 * Hook to use in components that need time tracking
 * Automatically starts the global timer (though it should already be started in layout)
 *
 * Returns reactive stores for current time and server-adjusted time.
 *
 * @example
 * const { currentTime, serverAdjustedTime } = useGlobalTime();
 * $: console.log($currentTime, $serverAdjustedTime);
 */
export function useGlobalTime() {
	globalTime.start();
	return { currentTime, serverAdjustedTime };
}
