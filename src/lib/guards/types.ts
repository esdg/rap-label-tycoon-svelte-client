/**
 * Guard check result
 */
export interface GuardResult {
    /** Whether the check passed */
    allowed: boolean;
    /** Redirect path if check failed */
    redirectTo?: string;
    /** Optional message for debugging */
    message?: string;
}

/**
 * Guard check function
 */
export type GuardCheck = () => Promise<GuardResult> | GuardResult;

/**
 * Guard rule configuration
 */
export interface GuardRule {
    /** Name of the guard rule for debugging */
    name: string;
    /** The check function to execute */
    check: GuardCheck;
}

/**
 * Page guard configuration
 */
export interface PageGuardConfig {
    /** List of guard rules to check in order */
    rules: GuardRule[];
    /** Whether to stop on first failure (default: true) */
    stopOnFirstFailure?: boolean;
}
