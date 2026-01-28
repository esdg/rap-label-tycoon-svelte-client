/**
 * Example page implementations showing guard usage patterns
 * These demonstrate how to apply guards to different routes
 */

// ============================================================================
// EXAMPLE 1: Simple redirect from home to dashboard
// File: src/routes/+page.ts
// ============================================================================
/*
import { executeGuards } from '$lib/guards';
import { preventAccess } from '$lib/guards/rules';

export async function load() {
    await executeGuards({
        rules: [
            {
                name: 'redirect-to-dashboard',
                check: preventAccess('/label/dashboard', 'Redirecting to dashboard')
            }
        ]
    });
}
*/

// ============================================================================
// EXAMPLE 2: Dashboard with multiple requirements
// File: src/routes/label/dashboard/+page.ts
// ============================================================================
/*
import { executeGuards } from '$lib/guards';
import { requireLabel, requirePlayer } from '$lib/guards/rules';

export async function load() {
    await executeGuards({
        rules: [
            { name: 'require-label', check: requireLabel },
            { name: 'require-player', check: requirePlayer }
        ]
    });
}
*/

// ============================================================================
// EXAMPLE 3: Admin page with authentication and role check
// File: src/routes/admin/+page.ts
// ============================================================================
/*
import { executeGuards } from '$lib/guards';
import { requireAuth, requireAdmin } from '$lib/guards/rules';

export async function load() {
    await executeGuards({
        rules: [
            { name: 'auth', check: requireAuth },
            { name: 'admin', check: requireAdmin }
        ]
    });
}
*/

// ============================================================================
// EXAMPLE 4: Feature-gated page
// File: src/routes/beta-feature/+page.ts
// ============================================================================
/*
import { executeGuards } from '$lib/guards';
import { requireAuth, requireFeature } from '$lib/guards/rules';

export async function load() {
    await executeGuards({
        rules: [
            { name: 'auth', check: requireAuth },
            { name: 'beta-access', check: requireFeature('beta-feature') }
        ]
    });
}
*/

// ============================================================================
// EXAMPLE 5: Progressive onboarding
// File: src/routes/studio/+page.ts
// ============================================================================
/*
import { executeGuards } from '$lib/guards';
import { requireLabel, requirePlayer, requireOnboarding } from '$lib/guards/rules';

export async function load() {
    await executeGuards({
        rules: [
            { name: 'require-player', check: requirePlayer },
            { name: 'require-onboarding', check: requireOnboarding },
            { name: 'require-label', check: requireLabel }
        ]
    });
}
*/

// ============================================================================
// EXAMPLE 6: Resource-specific protection with ownership
// File: src/routes/label/[id]/edit/+page.ts
// ============================================================================
/*
import type { PageLoad } from './$types';
import { executeGuards } from '$lib/guards';
import { requireAuth, requireOwnership } from '$lib/guards/rules';

export const load: PageLoad = async ({ params }) => {
    await executeGuards({
        rules: [
            { name: 'auth', check: requireAuth },
            {
                name: 'ownership',
                check: requireOwnership('labels', params.id)
            }
        ]
    });

    return {
        labelId: params.id
    };
}
*/

// ============================================================================
// EXAMPLE 7: Conditional guards based on query params
// File: src/routes/marketplace/+page.ts
// ============================================================================
/*
import type { PageLoad } from './$types';
import { executeGuards } from '$lib/guards';
import { requireAuth, requireBankroll } from '$lib/guards/rules';

export const load: PageLoad = async ({ url }) => {
    const isPremium = url.searchParams.get('tier') === 'premium';

    const rules = [
        { name: 'auth', check: requireAuth }
    ];

    // Add bankroll requirement for premium tier
    if (isPremium) {
        rules.push({
            name: 'bankroll',
            check: requireBankroll(10000)
        });
    }

    await executeGuards({ rules });
}
*/

// ============================================================================
// EXAMPLE 8: Custom inline guard for specific business logic
// File: src/routes/tournament/[id]/+page.ts
// ============================================================================
/*
import type { PageLoad } from './$types';
import { executeGuards } from '$lib/guards';
import { redirectResult, passResult } from '$lib/guards';
import { requireAuth } from '$lib/guards/rules';
import { api } from '$lib/api';

export const load: PageLoad = async ({ params }) => {
    await executeGuards({
        rules: [
            { name: 'auth', check: requireAuth },
            {
                name: 'tournament-registration',
                check: async () => {
                    const tournament = await api(`/api/tournaments/${params.id}`);

                    if (tournament.registrationClosed) {
                        return redirectResult(
                            '/tournaments',
                            'Registration closed for this tournament'
                        );
                    }

                    if (tournament.isFull) {
                        return redirectResult(
                            '/tournaments',
                            'Tournament is full'
                        );
                    }

                    return passResult();
                }
            }
        ]
    });
}
*/

// ============================================================================
// EXAMPLE 9: Time-based access control
// File: src/routes/daily-challenge/+page.ts
// ============================================================================
/*
import { executeGuards } from '$lib/guards';
import { requireAuth } from '$lib/guards/rules';
import { redirectResult, passResult } from '$lib/guards';

export async function load() {
    await executeGuards({
        rules: [
            { name: 'auth', check: requireAuth },
            {
                name: 'daily-limit',
                check: async () => {
                    const today = new Date().toDateString();
                    const lastPlayed = localStorage.getItem('lastDailyChallenge');

                    if (lastPlayed === today) {
                        return redirectResult(
                            '/label/dashboard',
                            'Already completed today\'s challenge'
                        );
                    }

                    return passResult();
                }
            }
        ]
    });
}
*/

// ============================================================================
// EXAMPLE 10: Multi-step form with progress tracking
// File: src/routes/onboarding/step-2/+page.ts
// ============================================================================
/*
import { executeGuards } from '$lib/guards';
import { requireAuth } from '$lib/guards/rules';
import { redirectResult, passResult } from '$lib/guards';
import { api } from '$lib/api';

export async function load() {
    await executeGuards({
        rules: [
            { name: 'auth', check: requireAuth },
            {
                name: 'previous-steps',
                check: async () => {
                    const progress = await api('/api/onboarding/progress');

                    if (!progress.step1Completed) {
                        return redirectResult(
                            '/onboarding/step-1',
                            'Complete step 1 first'
                        );
                    }

                    return passResult();
                }
            }
        ]
    });
}
*/

// ============================================================================
// EXAMPLE 11: No guards needed (public page)
// File: src/routes/about/+page.ts
// ============================================================================
/*
// No load function needed - page is publicly accessible
// Or explicitly allow access:

import { executeGuards } from '$lib/guards';
import { allowAccess } from '$lib/guards/rules';

export async function load() {
    await executeGuards({
        rules: [
            { name: 'public-page', check: allowAccess }
        ]
    });
}
*/

// ============================================================================
// EXAMPLE 12: Error handling with fallback
// File: src/routes/stats/+page.ts
// ============================================================================
/*
import type { PageLoad } from './$types';
import { executeGuards } from '$lib/guards';
import { requireAuth } from '$lib/guards/rules';
import { redirectResult, passResult } from '$lib/guards';
import { api } from '$lib/api';

export const load: PageLoad = async () => {
    await executeGuards({
        rules: [
            { name: 'auth', check: requireAuth },
            {
                name: 'data-available',
                check: async () => {
                    try {
                        const stats = await api('/api/stats');
                        
                        if (!stats || stats.length === 0) {
                            return redirectResult(
                                '/label/dashboard',
                                'No stats available yet'
                            );
                        }
                        
                        return passResult();
                    } catch (error) {
                        // On API error, still show the page but with empty state
                        console.error('Stats check failed:', error);
                        return passResult('Stats unavailable, showing empty state');
                    }
                }
            }
        ],
        stopOnFirstFailure: true
    });
}
*/
