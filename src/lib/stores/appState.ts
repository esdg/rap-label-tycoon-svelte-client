// App-level state management
// This centralizes the current user/player/label context

import { writable, derived, get } from 'svelte/store';
import type { User } from '$lib/firebase';
import type { Player } from '$lib/types/player';
import type { Label } from '$lib/types/label';
import { clearAllQueries } from '$lib/queries/queryClient';
import { clearDiscoveredArtists } from '$lib/queries/artistQueries';

// Import legacy stores for backward compatibility sync
import { player as legacyPlayerStore } from './player';
import { label as legacyLabelStore } from './label';

// Core app state
interface AppState {
    // Firebase user (auth layer)
    firebaseUser: User | null;
    // Player data from backend
    player: Player | null;
    // Currently active label
    currentLabel: Label | null;
    // All labels owned by player
    labels: Label[];
    // Loading states
    authLoading: boolean;
    authInitialized: boolean;
}

function createAppState() {
    const initialState: AppState = {
        firebaseUser: null,
        player: null,
        currentLabel: null,
        labels: [],
        authLoading: true,
        authInitialized: false,
    };

    const { subscribe, set, update } = writable<AppState>(initialState);

    return {
        subscribe,

        // Auth methods
        setFirebaseUser: (user: User | null) => {
            update(state => ({
                ...state,
                firebaseUser: user,
                authLoading: false,
                authInitialized: true,
            }));
        },

        setAuthLoading: (loading: boolean) => {
            update(state => ({ ...state, authLoading: loading }));
        },

        // Player methods
        setPlayer: (player: Player | null) => {
            update(state => ({ ...state, player }));
        },

        // Label methods
        setCurrentLabel: (label: Label | null) => {
            update(state => ({ ...state, currentLabel: label }));
        },

        setLabels: (labels: Label[]) => {
            update(state => ({ ...state, labels }));
        },

        updateCurrentLabelBankroll: (amount: number) => {
            update(state => {
                if (!state.currentLabel) return state;
                return {
                    ...state,
                    currentLabel: {
                        ...state.currentLabel,
                        bankroll: state.currentLabel.bankroll + amount,
                    },
                };
            });
        },

        // Switch to a different label
        switchLabel: (labelId: string) => {
            update(state => {
                const foundLabel = state.labels.find(l => l.id === labelId);
                if (foundLabel) {
                    // Clear label-specific data when switching
                    clearDiscoveredArtists();
                    // Sync legacy store
                    legacyLabelStore.set(foundLabel);
                    return { ...state, currentLabel: foundLabel };
                }
                return state;
            });
        },

        // Full reset on logout
        reset: () => {
            clearAllQueries();
            clearDiscoveredArtists();
            // Sync legacy stores
            legacyPlayerStore.set(null);
            legacyLabelStore.set(null);
            set(initialState);
        },

        // Initialize with full data (after login)
        initialize: (data: { player: Player; labels: Label[]; currentLabel?: Label }) => {
            const currentLabel = data.currentLabel || data.labels[0] || null;

            // Sync legacy stores for backward compatibility
            legacyPlayerStore.set(data.player);
            legacyLabelStore.set(currentLabel);

            update(state => ({
                ...state,
                player: data.player,
                labels: data.labels,
                currentLabel,
            }));
        },

        // Add a newly created label
        addLabel: (label: Label) => {
            // Sync legacy store
            legacyLabelStore.set(label);

            update(state => ({
                ...state,
                labels: [...state.labels, label],
                currentLabel: label,
            }));
        },
    };
}

export const appState = createAppState();

// Derived stores for easy access
export const firebaseUser = derived(appState, $state => $state.firebaseUser);
export const currentPlayer = derived(appState, $state => $state.player);
export const currentLabel = derived(appState, $state => $state.currentLabel);
export const playerLabels = derived(appState, $state => $state.labels);
export const isAuthenticated = derived(appState, $state => $state.firebaseUser !== null);
export const isAuthLoading = derived(appState, $state => $state.authLoading || !$state.authInitialized);
export const currentLabelId = derived(appState, $state => $state.currentLabel?.id ?? null);

// Helper to get current label ID synchronously (for queries)
export function getCurrentLabelId(): string | null {
    return get(appState).currentLabel?.id ?? null;
}

// Helper to get current player ID synchronously
export function getCurrentPlayerId(): string | null {
    return get(appState).player?.id ?? null;
}
