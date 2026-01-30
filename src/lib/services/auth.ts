// Authentication Service
// Handles the complete auth flow including fetching player and label data

import { goto } from '$app/navigation';
import { firebaseSignIn, firebaseSignOut, firebaseCreateAccount, firebaseSignInWithGoogle } from '$lib/firebase';
import { getPlayerByFirebaseUserId, getPlayerLabels, createPlayer } from '$lib/api';
import { player } from '$lib/stores/player';
import { label } from '$lib/stores/label';
import { clearAuthStores, type AuthResult } from '$lib/stores/auth';
import type { CreatePlayerRequest } from '$lib/types/player';

/**
 * Complete login flow:
 * 1. Sign in with Firebase
 * 2. Fetch player data from backend
 * 3. Fetch label data if player has labels
 * 4. Redirect to appropriate page
 */
export async function loginAndRedirect(email: string, password: string): Promise<AuthResult> {
    try {
        // Sign in with Firebase
        const firebaseUser = await firebaseSignIn(email, password);

        // Fetch player data using Firebase UID
        const playerData = await getPlayerByFirebaseUserId(firebaseUser.uid);
        player.set(playerData);

        // Check if player has labels
        if (playerData.labelIds && playerData.labelIds.length > 0) {
            // Fetch labels
            const labels = await getPlayerLabels(playerData.labelIds);
            if (labels.length > 0) {
                label.set(labels[0]); // Set first label as active
            }
            await goto('/labels');
            return { success: true, player: playerData, labels };
        } else {
            // No labels - redirect to create label
            await goto('/labels/create');
            return { success: true, player: playerData, labels: [] };
        }
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Login failed'
        };
    }
}

/**
 * Google Sign-In flow:
 * 1. Sign in with Google popup
 * 2. Check if player exists in backend
 * 3. If not, create player with Google account info
 * 4. Fetch label data if player has labels
 * 5. Redirect to appropriate page
 */
export async function googleSignInAndRedirect(): Promise<AuthResult> {
    try {
        // Sign in with Google
        const firebaseUser = await firebaseSignInWithGoogle();

        try {
            // Try to fetch existing player data
            const playerData = await getPlayerByFirebaseUserId(firebaseUser.uid);
            player.set(playerData);

            // Check if player has labels
            if (playerData.labelIds && playerData.labelIds.length > 0) {
                // Fetch labels
                const labels = await getPlayerLabels(playerData.labelIds);
                if (labels.length > 0) {
                    label.set(labels[0]); // Set first label as active
                }
                await goto('/labels');
                return { success: true, player: playerData, labels };
            } else {
                // No labels - redirect to create label
                await goto('/labels/create');
                return { success: true, player: playerData, labels: [] };
            }
        } catch (error) {
            // Player doesn't exist - create new player
            const createPlayerData: CreatePlayerRequest = {
                firebaseUserId: firebaseUser.uid,
                username: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Player',
                email: firebaseUser.email || ''
            };
            const playerData = await createPlayer(createPlayerData);
            player.set(playerData);

            // New users don't have labels, redirect to create
            await goto('/labels/create');
            return { success: true, player: playerData, labels: [] };
        }
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Google sign-in failed'
        };
    }
}

/**
 * Complete registration flow:
 * 1. Create Firebase account
 * 2. Create player in backend
 * 3. Redirect to label creation
 */
export async function registerAndRedirect(
    username: string,
    email: string,
    password: string
): Promise<AuthResult> {
    try {
        // Create Firebase account
        const firebaseUser = await firebaseCreateAccount(email, password);

        // Create player in backend
        const createPlayerData: CreatePlayerRequest = {
            firebaseUserId: firebaseUser.uid,
            username,
            email
        };
        const playerData = await createPlayer(createPlayerData);
        player.set(playerData);

        // New users don't have labels, redirect to create
        await goto('/labels/create');
        return { success: true, player: playerData, labels: [] };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Registration failed'
        };
    }
}

/**
 * Logout flow:
 * 1. Sign out from Firebase
 * 2. Clear all stores
 * 3. Redirect to login
 */
export async function logoutAndRedirect(): Promise<void> {
    try {
        await firebaseSignOut();
    } finally {
        clearAuthStores();
        await goto('/users/login');
    }
}

/**
 * Initialize auth state on app load
 * Called when Firebase auth state changes
 */
export async function initializeAuthState(firebaseUserId: string): Promise<AuthResult> {
    try {
        // Fetch player data
        const playerData = await getPlayerByFirebaseUserId(firebaseUserId);
        player.set(playerData);

        // Fetch labels if player has any
        if (playerData.labelIds && playerData.labelIds.length > 0) {
            const labels = await getPlayerLabels(playerData.labelIds);
            if (labels.length > 0) {
                label.set(labels[0]);
            }
            return { success: true, player: playerData, labels };
        }

        return { success: true, player: playerData, labels: [] };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to initialize auth state'
        };
    }
}
