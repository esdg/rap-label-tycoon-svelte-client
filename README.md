# Rap Label Tycoon - Svelte Client

A music label management simulation game built with SvelteKit and TanStack Query.

## Tech Stack

- **Framework**: SvelteKit 2.0+ (Static SPA mode)
- **Language**: TypeScript
- **State Management**: TanStack Query v5 (server state) + Svelte Stores (client state)
- **Styling**: Tailwind CSS
- **Build Tool**: Vite 5.0+
- **Authentication**: Firebase Auth
- **Deployment**: Vercel (static adapter)

## Project Structure

```
src/
├── lib/
│   ├── api/              # API client layer (fetch wrappers)
│   │   ├── client.ts     # Base fetch utility with error handling
│   │   ├── artists.ts    # Artist endpoints
│   │   ├── labels.ts     # Label endpoints
│   │   ├── tasks.ts      # Task endpoints
│   │   ├── contracts.ts  # Contract endpoints
│   │   ├── releases.ts   # Release/track/beat endpoints
│   │   └── ...
│   │
│   ├── queries/          # TanStack Query hooks
│   │   ├── queryClient.ts       # Query client config + keys
│   │   ├── artistQueries.ts     # Artist query hooks
│   │   ├── labelQueries.ts      # Label query hooks
│   │   ├── taskQueries.ts       # Task query hooks
│   │   ├── contractQueries.ts   # Contract query hooks
│   │   └── ...
│   │
│   ├── stores/           # Svelte stores (client state)
│   │   ├── appState.ts          # Central app state (user, player, label, config)
│   │   ├── modal.ts             # Modal management
│   │   ├── beats.ts             # Beat selection state
│   │   └── errorNotifications.ts # Error notification queue
│   │
│   ├── components/       # Reusable Svelte components
│   │   ├── cards/        # Card components (Artist, Contract, etc.)
│   │   ├── formfields/   # Form input components
│   │   ├── modals/       # Modal components
│   │   ├── progress-bars/ # Progress bar variants
│   │   └── ...
│   │
│   ├── guards/           # Route guards for authentication/authorization
│   │   ├── index.ts      # Guard execution engine
│   │   ├── rules.ts      # Reusable guard rules
│   │   └── types.ts      # Guard type definitions
│   │
│   ├── services/         # Business logic services
│   │   ├── auth.ts       # Authentication flows
│   │   └── config.ts     # Client config loading
│   │
│   ├── types/            # TypeScript type definitions
│   │   ├── task.ts       # Task types (discriminated unions)
│   │   ├── contracts.ts  # Contract types
│   │   ├── player.ts     # Player types
│   │   └── ...
│   │
│   ├── utils/            # Utility functions
│   │   ├── errorHandling.ts # Centralized error handling
│   │   ├── typeGuards.ts    # Type guard functions
│   │   ├── timeUtils.ts     # Time/date formatting
│   │   ├── taskUtils.ts     # Task progress calculations
│   │   └── ...
│   │
│   └── firebase.ts       # Firebase configuration
│
└── routes/               # SvelteKit routes (file-based routing)
    ├── +layout.svelte    # Root layout (auth, menu, modals, errors)
    ├── +layout.ts        # SSR disabled for SPA mode
    ├── labels/           # Label dashboard and management
    │   ├── +page.svelte  # Main dashboard
    │   ├── create/       # Create new label
    │   ├── finances/     # Financial reports
    │   ├── music-and-release/ # Music catalog
    │   └── roster/       # Artist roster
    ├── artists/          # Artist pages
    │   └── talents-scouting/ # Scouting results
    └── users/            # Authentication pages
        ├── login/
        └── register/
```

## Architecture Patterns

### State Management

- **Server State**: Managed by TanStack Query
  - Automatic caching, refetching, and invalidation
  - Query hooks return reactive Svelte stores
  - Centralized query keys for cache management

- **Client State**: Managed by Svelte stores
  - `appState`: Global app state (authenticated user, player, current label)
  - `modal`: Modal visibility and data
  - `discoveredArtistsStore`: Client-side bookmarks for scouted artists

### Data Fetching Pattern

```typescript
// 1. Create query hook (in component)
$: tasksQuery = createLabelTasksQuery(labelId);

// 2. Access data reactively
$: tasks = $tasksQuery.data ?? [];
$: isLoading = $tasksQuery.isLoading;
$: error = $tasksQuery.error;

// 3. Imperative operations (mutations)
const claimMutation = createClaimTaskMutation();
await $claimMutation.mutateAsync(taskId);
```

### Error Handling

- **API Layer**: Throws typed errors (`ApiError`, `TaskCreationError`)
- **Error Utilities**: Convert errors to user-friendly messages
- **UI Layer**: `ErrorAlert` component displays notifications
- **Development**: Errors logged to console in DEV mode only

### Modal System

The app uses a centralized modal system with type-safe helpers:

**Modal Helpers** (`src/lib/modals/helpers.ts`):

- `openScoutingModal()` - Open scouting task modal
- `openScoutResultsModal(task)` - Display scouting results
- `openSignContractModal(artist, options?)` - Open contract signing modal
- `openProducingBeatsModal(options?)` - Open beat production modal
- `openRecordingReleaseModal(options?)` - Open release recording modal

**Configuration** (`src/lib/modals/constants.ts`):

- `MODAL_DEFAULTS` - Default titles/images for each modal type
- `TASK_SUB_MODALS` - Const enum for sub-modal identifiers

```typescript
import { openScoutingModal, openSignContractModal } from '$lib/modals/helpers';

// Simple modal
openScoutingModal();

// Modal with data and overrides
openSignContractModal(artist, {
	title: 'Custom Title',
	imageUrl: artist.profileImage
});
```

**Benefits**: Type safety, centralized defaults, consistent behavior, IDE autocomplete

### Type Safety

- TypeScript strict mode enabled
- Discriminated unions for task types
- Type guards for safe narrowing
- No `any` casts in production code

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Format code
npm run format
```

## Key Features

- **Real-time task tracking** with server time synchronization
- **Artist scouting** system with discovery and bookmarking
- **Contract negotiations** with multi-iteration offers
- **Music production** (beats, tracks, releases)
- **Financial dashboard** with revenue tracking
- **Error notifications** with auto-dismiss
- **Authentication** with Firebase

## Documentation

- [Architecture Overview](docs/RLT.md) - High-level component structure
- [Guard System](docs/GUARDS.md) - Route protection patterns

## Notes

- SPA mode: SSR disabled for static deployment
- Firebase Auth required for user management
- Server time offset calculated for accurate progress bars
- Query cache automatically cleared on logout/label switch
