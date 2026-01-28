# Page Access Control & Guard System

A scalable, rule-based system for controlling page access and handling redirects in the SvelteKit application.

## Architecture

### Core Components

1. **Guard Types** (`src/lib/guards/types.ts`)
   - Defines interfaces for guard checks and results
   - Provides type safety for guard configurations

2. **Guard Executor** (`src/lib/guards/index.ts`)
   - Central execution engine for running guard checks
   - Handles redirects and error cases
   - Provides helper functions for creating guard results

3. **Guard Rules** (`src/lib/guards/rules.ts`)
   - Pre-built guard checks (requireLabel, requirePlayer, etc.)
   - Reusable across multiple pages
   - Easy to extend with new rules

4. **Page Load Functions** (`+page.ts` files)
   - Apply guards to specific routes
   - Run before page renders
   - Control access and redirects

## How It Works

### Flow

```
User visits page 
    ↓
+page.ts load() runs
    ↓
executeGuards() called
    ↓
Each rule checked in order
    ↓
If rule fails → redirect
If all pass → page loads
```

### Example: Dashboard Protection

```typescript
// src/routes/label/dashboard/+page.ts
export async function load() {
    await executeGuards({
        rules: [
            { name: 'require-label', check: requireLabel },
            { name: 'require-player', check: requirePlayer }
        ]
    });
}
```

## Current Redirects

| From | To | Condition |
|------|-----|-----------|
| `/` (home) | `/label/dashboard` | Always |
| `/label/dashboard` | `/label/create` | No labels exist |
| `/label/dashboard` | `/user/register` | No players exist (after label check) |

## Adding New Guards

### 1. Create a Guard Rule

```typescript
// In src/lib/guards/rules.ts
export const requireArtist: GuardCheck = async () => {
    try {
        const artists = await api<any[]>('/api/artists');
        
        if (!artists || artists.length === 0) {
            return redirectResult('/artist/create', 'No artist found');
        }
        
        return passResult('Artist exists');
    } catch (error) {
        return redirectResult('/artist/create', 'Error checking artists');
    }
};
```

### 2. Apply to a Page

```typescript
// In your route's +page.ts
import { executeGuards } from '$lib/guards';
import { requireArtist } from '$lib/guards/rules';

export async function load() {
    await executeGuards({
        rules: [
            { name: 'require-artist', check: requireArtist }
        ]
    });
}
```

### 3. Custom Inline Guards

For one-off checks:

```typescript
export async function load() {
    await executeGuards({
        rules: [
            {
                name: 'custom-check',
                check: async () => {
                    const data = await someCheck();
                    if (!data.valid) {
                        return redirectResult('/error', 'Invalid data');
                    }
                    return passResult();
                }
            }
        ]
    });
}
```

## Advanced Features

### Multiple Guards with Priority

Guards run in order. Place most critical checks first:

```typescript
await executeGuards({
    rules: [
        { name: 'auth', check: requireAuth },        // Check auth first
        { name: 'label', check: requireLabel },      // Then label
        { name: 'player', check: requirePlayer }     // Then player
    ]
});
```

### Continue on Failure

By default, guards stop on first failure. To check all:

```typescript
await executeGuards({
    rules: [...],
    stopOnFirstFailure: false  // Will check all rules
});
```

### Conditional Guards

```typescript
import { allowAccess } from '$lib/guards/rules';

export async function load({ url }) {
    // Only apply guards in production
    const isDev = url.hostname === 'localhost';
    
    await executeGuards({
        rules: [
            {
                name: 'production-only',
                check: isDev ? allowAccess : requireAuth
            }
        ]
    });
}
```

## Common Patterns

### Protect Admin Routes

```typescript
// src/routes/admin/+page.ts
export async function load() {
    await executeGuards({
        rules: [
            { name: 'require-auth', check: requireAuth },
            { name: 'require-admin', check: requireAdminRole }
        ]
    });
}
```

### Progressive Data Requirements

```typescript
// src/routes/studio/+page.ts
export async function load() {
    await executeGuards({
        rules: [
            { name: 'require-label', check: requireLabel },
            { name: 'require-studio', check: requireStudio }
        ]
    });
}
```

### Redirect Based on State

```typescript
export const requireOnboarding: GuardCheck = async () => {
    const user = await getCurrentUser();
    
    if (!user.hasCompletedOnboarding) {
        return redirectResult('/onboarding', 'Complete onboarding first');
    }
    
    return passResult();
};
```

## Edge Cases & Safety

### Infinite Loop Prevention

✅ **Safe Pattern:**
```typescript
// Dashboard requires label
// Label create page has NO guards
await executeGuards({
    rules: [{ name: 'require-label', check: requireLabel }]
});
```

❌ **Dangerous Pattern:**
```typescript
// Both pages redirect to each other - AVOID!
// Page A redirects to B if no data
// Page B redirects to A if no data
```

### Error Handling

Guards catch errors and can:
1. Redirect to safe fallback page
2. Log error and continue
3. Re-throw for app-level handling

```typescript
export const safeGuard: GuardCheck = async () => {
    try {
        await riskyCheck();
        return passResult();
    } catch (error) {
        console.error('Guard failed:', error);
        // Redirect to safe page instead of crashing
        return redirectResult('/safe-fallback');
    }
};
```

## Testing Guards

```typescript
import { requireLabel } from '$lib/guards/rules';

// Mock the API
vi.mock('$lib/api', () => ({
    api: vi.fn()
}));

test('requireLabel redirects when no labels', async () => {
    api.mockResolvedValue([]);
    const result = await requireLabel();
    
    expect(result.allowed).toBe(false);
    expect(result.redirectTo).toBe('/label/create');
});
```

## Future Extensions

### Authentication Guards
- JWT token validation
- Session checks
- Role-based access control

### Feature Flags
- Enable/disable features per user
- A/B testing redirects

### Analytics
- Track guard failures
- Monitor redirect patterns
- Identify onboarding bottlenecks

### Time-based Access
- Maintenance mode redirects
- Scheduled feature access
- Time-zone based routing
