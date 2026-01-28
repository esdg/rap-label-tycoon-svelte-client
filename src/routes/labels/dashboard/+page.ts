import { executeGuards } from '$lib/guards';
import { requireLabel, requirePlayer } from '$lib/guards/rules';

/**
 * Dashboard page load function with entity checks
 */
export async function load() {
    /*     await executeGuards({
            rules: [
                {
                    name: 'require-player',
                    check: requirePlayer
                },
                {
                    name: 'require-label',
                    check: requireLabel
                }
            ]
        }); */

    // If we reach here, all guards passed
    return {
        // You can return additional data needed by the page
    };
}
