# AI Coding Guidelines for RLT Svelte Client

- **Stack & entry points**: SvelteKit SPA (SSR disabled in src/routes/+layout.ts). Global shell in src/routes/+layout.svelte pulls in app.css, sets Roboto font, wraps app in QueryClientProvider, and renders MenuBar for authenticated users.
- **Dev commands**: npm install; npm run dev for local; npm run build for production bundle; npm run preview to serve build; npm run format to apply Prettier + Svelte plugin.
- **Architecture docs**: High-level screens/components in docs/RLT.md; guard system overview and examples in docs/GUARDS.md.

## Data Fetching (TanStack Query)
- **Query setup**: QueryClient configured in src/lib/queries/queryClient.ts with sensible defaults (30s stale time, 5min cache). QueryClientProvider wraps app in +layout.svelte.
- **Query keys**: Centralized in queryKeys object in queryClient.ts. Use these for cache invalidation and consistency.
- **API layer**: Backend calls organized in src/lib/api/ folder with modules per domain (players.ts, labels.ts, tasks.ts, artists.ts, contracts.ts). Legacy src/lib/api.ts re-exports for backward compatibility.
- **Query hooks**: Located in src/lib/queries/ folder:
  - playerQueries.ts: createPlayerByFirebaseIdQuery, createPlayerMutation
  - labelQueries.ts: createLabelByIdQuery, createPlayerLabelsQuery, createLabelMutation
  - taskQueries.ts: createLabelTasksQuery, createClaimTaskMutation, createScoutingTaskMutation, serverTimeOffset store
  - artistQueries.ts: createArtistsByIdsQuery, discoveredArtistsStore (client-side bookmarks), addDiscoveredArtists
  - contractQueries.ts: createContractsByIdsQuery, createLabelContractsQuery
- **Usage pattern**: In components, use `$: query = createXxxQuery(id)` to make reactive queries. Access data via `$query.data`, loading via `$query.isLoading`, errors via `$query.error`.
- **Cache invalidation**: Use queryClient.invalidateQueries({ queryKey: queryKeys.xxx }) after mutations. clearAllQueries() on logout.

## App State
- **Centralized state**: src/lib/stores/appState.ts contains unified AppState with firebaseUser, player, currentLabel, labels. Use derived stores: currentPlayer, currentLabel, isAuthenticated, isAuthLoading.
- **Auth service**: src/lib/services/auth.ts handles login/register/logout flows and calls appState.initialize() with fetched data.
- **Label context**: When switching labels, use appState.switchLabel(labelId) which clears label-specific caches.

## Legacy (Deprecated)
- Old stores in src/lib/stores/player.ts, label.ts, tasks.ts, artists.ts, contracts.ts, auth.ts are kept for compatibility but prefer appState + queries.

- **Navigation**: Use goto from $app/navigation for route changes; avoid window.location.
- **Guards**: Guard utilities in src/lib/guards/index.ts + types.ts; reusable rules in src/lib/guards/rules.ts (requireLabel, requirePlayer, preventAccess, allowAccess). executeGuards throws redirect on failure; stopOnFirstFailure defaults true.
- **Modal/task pattern**: Task modal entry at src/lib/components/modals/TaskModal.svelte with sub-modals under task-submodals/. Labels dashboard uses queries for tasks, auto-claims finished tasks.
- **Data models**: Types under src/lib/types/.
- **UI components**: Shared components in src/lib/components (Button, Modal, MenuBar, form fields, etc.).
- **Styling**: Tailwind configured via tailwind.config.js/postcss.
- **Error handling**: Queries expose error state via $query.error. TaskCreationError for task-specific errors.
- **Testing status**: No automated tests configured; manually verify flows.

## Utilities
- Prefer adding reusable helpers (e.g., time-based progress calculations) to src/lib/utils and import from the index barrel instead of redefining them inside components.
