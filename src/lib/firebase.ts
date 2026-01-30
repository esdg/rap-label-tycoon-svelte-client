// Firebase Configuration and Initialization
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, type User } from 'firebase/auth';
import { browser } from '$app/environment';

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyC9iNcJpKM4QVQy1deHTSzl0EdcSpb3KdY",
    authDomain: "rltycoon-project.firebaseapp.com",
    projectId: "rltycoon-project",
    storageBucket: "rltycoon-project.firebasestorage.app",
    messagingSenderId: "6675003652",
    appId: "1:6675003652:web:ca0c72109c9be82cc5b851",
    measurementId: "G-8HPVMM5BHL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Auth helper functions
export async function firebaseCreateAccount(email: string, password: string): Promise<User> {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
}

export async function firebaseSignIn(email: string, password: string): Promise<User> {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
}

export async function firebaseSignOut(): Promise<void> {
    await signOut(auth);
}

export async function firebaseSignInWithGoogle(): Promise<User> {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    return userCredential.user;
}

export function onFirebaseAuthStateChanged(callback: (user: User | null) => void): () => void {
    if (!browser) {
        return () => { };
    }
    return onAuthStateChanged(auth, callback);
}

export type { User };
