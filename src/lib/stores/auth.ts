import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';
import { onFirebaseAuthStateChanged, type User } from '$lib/firebase';
import { player } from './player';
import { label } from './label';
import type { Player } from '$lib/types/player';
import type { Label } from '$lib/types/label';

// Auth state store
interface AuthState {
    user: User | null;
    loading: boolean;
    initialized: boolean;
}

function createAuthStore() {
    const { subscribe, set, update } = writable<AuthState>({
        user: null,
        loading: true,
        initialized: false
    });

    // Initialize auth state listener
    if (browser) {
        onFirebaseAuthStateChanged((user) => {
            update(state => ({
                ...state,
                user,
                loading: false,
                initialized: true
            }));
        });
    }

    return {
        subscribe,
        setUser: (user: User | null) => update(state => ({ ...state, user })),
        setLoading: (loading: boolean) => update(state => ({ ...state, loading })),
        reset: () => set({ user: null, loading: false, initialized: true })
    };
}

export const authStore = createAuthStore();

// Derived store to check if user is authenticated
export const isAuthenticated = derived(authStore, $auth => $auth.user !== null);

// Derived store to get the current Firebase user
export const currentUser = derived(authStore, $auth => $auth.user);

// Combined auth loading state
export const authLoading = derived(authStore, $auth => $auth.loading || !$auth.initialized);

// Helper function to clear all auth-related stores on logout
export function clearAuthStores() {
    player.set(null);
    label.set(null);
}

// Auth flow types
export interface AuthResult {
    success: boolean;
    error?: string;
    player?: Player;
    labels?: Label[];
}
