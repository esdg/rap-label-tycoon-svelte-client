import type { GuardCheck } from './types';
import { redirectResult, passResult } from './index';
import { apiFetch } from '$lib/api/client';

/**
 * Check if at least one label exists
 */
export const requireLabel: GuardCheck = async () => {
	try {
		const labels = await apiFetch<any[]>('/api/labels');

		if (!labels || labels.length === 0) {
			return redirectResult('/labels/create', 'No label found, redirecting to creation');
		}

		return passResult('Label exists');
	} catch (error) {
		console.error('Error checking labels:', error);
		// On error, redirect to creation page as safe fallback
		return redirectResult('/labels/create', 'Error checking labels, redirecting to creation');
	}
};

/**
 * Check if at least one player exists
 */
export const requirePlayer: GuardCheck = async () => {
	try {
		const players = await apiFetch<any[]>('/api/players');

		if (!players || players.length === 0) {
			return redirectResult('/user/register', 'No player found, redirecting to registration');
		}

		return passResult('Player exists');
	} catch (error) {
		console.error('Error checking players:', error);
		// On error, redirect to registration page as safe fallback
		return redirectResult('/user/register', 'Error checking players, redirecting to registration');
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
