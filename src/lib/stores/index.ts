// Centralized store exports
// The main app state is now managed through appState

// App state (recommended for new code)
export * from './appState';

// Modal store (still needed for UI state)
export * from './modal';

// Beats store (for beat management)
export * from './beats';

// Legacy stores (deprecated - use appState or queries instead)
// These are kept for backward compatibility but should be migrated
export { player } from './player';
export { label, updateLabelBankroll } from './label';
