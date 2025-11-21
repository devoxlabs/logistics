// Small auth client service that wraps Firebase Auth.
// UI components call these helpers instead of depending directly on Firebase,
// which makes it easier to swap the auth provider later.

import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase';

// Call into the API route that mirrors the current Firebase ID token
// into a cookie. This is ONLY for development / demo purposes.
async function setSessionToken(idToken: string | null) {
  await fetch('/api/auth/set-cookie', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: idToken }),
  });
}

// Log a user in with email/password and persist the ID token cookie.
export async function login(email: string, password: string): Promise<void> {
  const auth = getFirebaseAuth();
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const token = await cred.user.getIdToken();
  await setSessionToken(token);
}

// Create a new account, optionally set the display name, and persist cookie.
export async function signup(
  name: string,
  email: string,
  password: string,
): Promise<void> {
  const auth = getFirebaseAuth();
  const cred = await createUserWithEmailAndPassword(auth, email, password);

  if (name) {
    await updateProfile(cred.user, { displayName: name });
  }

  const token = await cred.user.getIdToken();
  await setSessionToken(token);
}

// Clear Firebase Auth state and remove the token cookie.
export async function logout(): Promise<void> {
  const auth = getFirebaseAuth();
  await signOut(auth);
  await setSessionToken(null);
}

// Lightweight subscription wrapper so UI can react to auth changes.
export function subscribeToAuth(
  callback: (user: User | null) => void,
): () => void {
  const auth = getFirebaseAuth();
  return onAuthStateChanged(auth, (user) => {
    callback(user);
  });
}

// Helper to synchronously read the current user from Firebase Auth.
// (Useful for places where you don't need live subscription.)
export async function getCurrentUser(): Promise<User | null> {
  const auth = getFirebaseAuth();
  return auth.currentUser ?? null;
}
