// Authentication Service
// Handles the complete auth flow including fetching player and label data

import { goto } from '$app/navigation';
import {
    firebaseSignIn,
    firebaseSignOut,
    firebaseCreateAccount,
    firebaseSignInWithGoogle
} from '$lib/firebase';
import { fetchPlayerByFirebaseId, createPlayer } from '$lib/api/players';
import { fetchLabelsByIds } from '$lib/api/labels';
import { appState } from '$lib/stores/appState';
import { getFirebaseErrorCode, getFirebaseErrorMessage } from '$lib/utils/errorUtils';
import type { CreatePlayerRequest, Player } from '$lib/types/player';
import type { Label } from '$lib/types/label';

// Auth result type
export interface AuthResult {
    success: boolean;
    error?: string;
    errorCode?: string; // Firebase error code for specific error handling
    player?: Player;
    labels?: Label[];
}

/**
 * Complete login flow:
 * 1. Sign in with Firebase
 * 2. Fetch player data from backend
 * 3. Fetch label data if player has labels
 * 4. Update app state and redirect
 */
export async function loginAndRedirect(email: string, password: string): Promise<AuthResult> {
    try {
        const firebaseUser = await firebaseSignIn(email, password);
        const playerData = await fetchPlayerByFirebaseId(firebaseUser.uid);

        let labels: Label[] = [];
        if (playerData.labelIds && playerData.labelIds.length > 0) {
            labels = await fetchLabelsByIds(playerData.labelIds);
        }

        // Update centralized app state
        appState.initialize({ player: playerData, labels });

        // Redirect based on whether user has labels
        if (labels.length > 0) {
            await goto('/labels');
        } else {
            await goto('/labels/create');
        }

        return { success: true, player: playerData, labels };
    } catch (error) {
        return {
            success: false,
            error: getFirebaseErrorMessage(error, 'Login failed'),
            errorCode: getFirebaseErrorCode(error)
        };
    }
}

/**
 * Google Sign-In flow:
 * 1. Sign in with Google popup
 * 2. Check if player exists in backend
 * 3. If not, create player with Google account info
 * 4. Fetch label data if player has labels
 * 5. Update app state and redirect
 */
export async function googleSignInAndRedirect(): Promise<AuthResult> {
    try {
        const firebaseUser = await firebaseSignInWithGoogle();

        let playerData: Player;
        let labels: Label[] = [];

        try {
            // Try to fetch existing player
            playerData = await fetchPlayerByFirebaseId(firebaseUser.uid);
        } catch {
            // Player doesn't exist - create new one
            const createPlayerData: CreatePlayerRequest = {
                firebaseUserId: firebaseUser.uid,
                username: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Player',
                email: firebaseUser.email || ''
            };
            playerData = await createPlayer(createPlayerData);
        }

        // Fetch labels if player has any
        if (playerData.labelIds && playerData.labelIds.length > 0) {
            labels = await fetchLabelsByIds(playerData.labelIds);
        }

        // Update centralized app state
        appState.initialize({ player: playerData, labels });

        // Redirect based on whether user has labels
        if (labels.length > 0) {
            await goto('/labels');
        } else {
            await goto('/labels/create');
        }

        return { success: true, player: playerData, labels };
    } catch (error) {
        return {
            success: false,
            error: getFirebaseErrorMessage(error, 'Google sign-in failed'),
            errorCode: getFirebaseErrorCode(error)
        };
    }
}

/**
 * Complete registration flow:
 * 1. Create Firebase account
 * 2. Create player in backend
 * 3. Update app state and redirect to label creation
 */
export async function registerAndRedirect(
    username: string,
    email: string,
    password: string
): Promise<AuthResult> {
    try {
        const firebaseUser = await firebaseCreateAccount(email, password);

        const createPlayerData: CreatePlayerRequest = {
            firebaseUserId: firebaseUser.uid,
            username,
            email
        };
        const playerData = await createPlayer(createPlayerData);

        // Update centralized app state (no labels for new users)
        appState.initialize({ player: playerData, labels: [] });

        await goto('/labels/create');
        return { success: true, player: playerData, labels: [] };
    } catch (error) {
        return {
            success: false,
            error: getFirebaseErrorMessage(error, 'Registration failed'),
            errorCode: getFirebaseErrorCode(error)
        };
    }
}

/**
 * Logout flow:
 * 1. Sign out from Firebase
 * 2. Reset all app state
 * 3. Redirect to login
 */
export async function logoutAndRedirect(): Promise<void> {
    try {
        await firebaseSignOut();
    } finally {
        appState.reset();
        await goto('/users/login');
    }
}

/**
 * Initialize auth state on app load
 * Called when Firebase auth state changes
 */
export async function initializeAuthState(firebaseUserId: string): Promise<AuthResult> {
    try {
        const playerData = await fetchPlayerByFirebaseId(firebaseUserId);

        let labels: Label[] = [];
        if (playerData.labelIds && playerData.labelIds.length > 0) {
            labels = await fetchLabelsByIds(playerData.labelIds);
        }

        // Update centralized app state
        appState.initialize({ player: playerData, labels });

        return { success: true, player: playerData, labels };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to initialize auth state'
        };
    }
}
