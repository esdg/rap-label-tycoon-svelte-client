import { redirect } from '@sveltejs/kit';
import type { GuardResult, PageGuardConfig } from './types';

/**
 * Execute page guards and handle redirects
 * @param config Page guard configuration
 * @returns void if all checks pass, redirects otherwise
 */
export async function executeGuards(config: PageGuardConfig): Promise<void> {
	const { rules, stopOnFirstFailure = true } = config;

	for (const rule of rules) {
		try {
			const result: GuardResult = await rule.check();

			if (!result.allowed) {
				if (import.meta.env.DEV && result.message) {
					console.log(`[Guard: ${rule.name}] ${result.message}`);
				}

				if (result.redirectTo) {
					throw redirect(303, result.redirectTo);
				}

				// If no redirect specified but not allowed, stop checking
				if (stopOnFirstFailure) {
					return;
				}
			}
		} catch (error) {
			// Re-throw redirect errors
			if (error && typeof error === 'object' && 'status' in error) {
				throw error;
			}

			// Log other errors and continue or stop based on config
			console.error(`[Guard: ${rule.name}] Error:`, error);
			if (stopOnFirstFailure) {
				throw error;
			}
		}
	}
}

/**
 * Helper to create a simple redirect guard result
 */
export function redirectResult(redirectTo: string, message?: string): GuardResult {
	return {
		allowed: false,
		redirectTo,
		message
	};
}

/**
 * Helper to create a pass guard result
 */
export function passResult(message?: string): GuardResult {
	return {
		allowed: true,
		message
	};
}
