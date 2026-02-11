import type { GuardCheck } from './types';
import { redirectResult, passResult } from './index';
import { apiFetch } from '$lib/api/client';
import { get } from 'svelte/store';
import { appState, waitForAuthInitialization } from '$lib/stores/appState';

/**
 * Check if the current player has at least one label
 * NOTE: Should not be used in +page.ts load functions as it creates deadlock
 * Use only in component-level guards after layout has mounted
 */
export const requireLabel: GuardCheck = async () => {
	try {
		const state = get(appState);
		const player = state.player;

		if (!player) {
			return redirectResult('/users/login', 'No player found, redirecting to login');
		}

		// Check both player.labelIds and state.labels for reliability
		// (state.labels is more up-to-date when a label is just created)
		const hasLabels = (player.labelIds && player.labelIds.length > 0) || state.labels.length > 0;

		if (!hasLabels) {
			return redirectResult('/labels/create', 'No label found for player, redirecting to creation');
		}

		return passResult('Player has label(s)');
	} catch (error) {
		console.error('Error checking player labels:', error);
		// On error, redirect to creation page as safe fallback
		return redirectResult('/labels/create', 'Error checking labels, redirecting to creation');
	}
};

/**
 * Check if at least one player exists
 * NOTE: Should not be used in +page.ts load functions as it creates deadlock
 * Use only in component-level guards after layout has mounted
 */
export const requirePlayer: GuardCheck = async () => {
	try {
		const state = get(appState);
		const player = state.player;

		if (!player) {
			return redirectResult('/users/login', 'No player found, redirecting to login');
		}

		return passResult('Player exists');
	} catch (error) {
		console.error('Error checking players:', error);
		// On error, redirect to login page as safe fallback
		return redirectResult('/users/login', 'Error checking players, redirecting to login');
	}
};

/**
 * Prevent access to a page by redirecting
 */
export function preventAccess(redirectTo: string, reason?: string): GuardCheck {
	return () => redirectResult(redirectTo, reason);
}

/**
 * Allow access unconditionally
 */
export const allowAccess: GuardCheck = () => passResult('Access allowed');

/**
 * Check if user is authenticated (example for future use)
 */
export const requireAuth: GuardCheck = async () => {
	// TODO: Implement actual authentication check
	// For now, always allow
	return passResult('Auth check passed');
};
