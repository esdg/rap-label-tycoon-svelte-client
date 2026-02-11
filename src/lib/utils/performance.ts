/**
 * Performance Monitoring Utilities
 *
 * Tools for tracking and optimizing application performance
 */

/**
 * Measure and log component render time
 * Useful for identifying slow-rendering components
 *
 * @param componentName - Name of the component being measured
 * @returns Cleanup function to call after render completes
 *
 * @example
 * // In a Svelte component
 * import { measureRenderTime } from '$lib/utils/performance';
 *
 * const endMeasure = measureRenderTime('MyComponent');
 * onMount(() => {
 *   endMeasure();
 * });
 */
export function measureRenderTime(componentName: string) {
	const start = performance.now();

	return () => {
		const end = performance.now();
		const duration = end - start;

		// Warn if render takes more than one frame at 60fps (16.67ms)
		if (duration > 16) {
			console.warn(
				`[Performance] ${componentName} render took ${duration.toFixed(2)}ms (> 16ms warning threshold)`
			);
		} else if (duration > 8) {
			console.info(`[Performance] ${componentName} render took ${duration.toFixed(2)}ms`);
		}
	};
}

/**
 * Debounce a function call
 * Useful for expensive operations triggered by frequent events (scroll, resize, input)
 *
 * @param func - Function to debounce
 * @param wait - Milliseconds to wait before executing
 * @returns Debounced function
 *
 * @example
 * const debouncedSearch = debounce((query: string) => {
 *   performSearch(query);
 * }, 300);
 */
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

/**
 * Throttle a function call
 * Ensures function is called at most once per specified interval
 *
 * @param func - Function to throttle
 * @param limit - Minimum milliseconds between calls
 * @returns Throttled function
 *
 * @example
 * const throttledScroll = throttle(() => {
 *   handleScroll();
 * }, 100);
 */
export function throttle<T extends (...args: any[]) => any>(
	func: T,
	limit: number
): (...args: Parameters<T>) => void {
	let inThrottle: boolean;

	return function executedFunction(...args: Parameters<T>) {
		if (!inThrottle) {
			func(...args);
			inThrottle = true;
			setTimeout(() => (inThrottle = false), limit);
		}
	};
}

/**
 * Measure time between marks
 * Uses Performance API for accurate measurements
 *
 * @param markName - Unique identifier for this measurement
 * @returns Object with start and end functions
 *
 * @example
 * const measure = createPerformanceMark('dataFetch');
 * measure.start();
 * await fetchData();
 * const duration = measure.end();
 * console.log(`Fetch took ${duration}ms`);
 */
export function createPerformanceMark(markName: string) {
	const startMark = `${markName}-start`;
	const endMark = `${markName}-end`;
	const measureName = `${markName}-measure`;

	return {
		start: () => {
			performance.mark(startMark);
		},
		end: () => {
			performance.mark(endMark);
			const measure = performance.measure(measureName, startMark, endMark);
			performance.clearMarks(startMark);
			performance.clearMarks(endMark);
			performance.clearMeasures(measureName);
			return measure.duration;
		}
	};
}

/**
 * Log slow queries for debugging
 * Wraps TanStack Query to log queries that take too long
 *
 * @param queryKey - The query key
 * @param duration - Duration in milliseconds
 * @param threshold - Threshold in ms to trigger warning (default: 1000ms)
 */
export function logSlowQuery(queryKey: unknown[], duration: number, threshold: number = 1000) {
	if (duration > threshold) {
		console.warn(
			`[Performance] Slow query detected: ${JSON.stringify(queryKey)} took ${duration.toFixed(2)}ms`
		);
	}
}

/**
 * Memory usage monitoring
 * Returns current memory usage if available
 *
 * @returns Memory info object or null if not available
 */
export function getMemoryUsage() {
	if ('memory' in performance && (performance as any).memory) {
		const memory = (performance as any).memory;
		return {
			usedJSHeapSize: Math.round(memory.usedJSHeapSize / 1048576), // MB
			totalJSHeapSize: Math.round(memory.totalJSHeapSize / 1048576), // MB
			jsHeapSizeLimit: Math.round(memory.jsHeapSizeLimit / 1048576) // MB
		};
	}
	return null;
}
