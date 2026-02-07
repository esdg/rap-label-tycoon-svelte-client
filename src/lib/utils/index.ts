/**
 * Centralized utility exports
 * Import common utilities from here for convenience
 */

export * from './arrayUtils';
export * from './timeUtils';
export * from './errorUtils';
export * from './clickOutside';
export * from './artistUtils';
export * from './taskUtils';
export * from './performanceUtils';

// Re-export formatDuration from timeUtils for backward compatibility
// (in case old imports still reference formatDuration.ts)
export { formatDuration } from './timeUtils';
