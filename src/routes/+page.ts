import { executeGuards } from '$lib/guards';
import { preventAccess } from '$lib/guards/rules';

/**
 * Redirect home page to dashboard
 */
export async function load() {
    await executeGuards({
        rules: [
            {
                name: 'redirect-to-dashboard',
                check: preventAccess('/label/dashboard', 'Redirecting from home to dashboard')
            }
        ]
    });
}
