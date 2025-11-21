// Centralized Firebase client initialization.
// This file is the only place that knows how to construct the Firebase app,
// Auth and Firestore instances. Everything else should call the helpers below.

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

// Cached singletons so we don't re‑initialize Firebase multiple times.
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

// Firebase config is pulled from public env vars.
// These are not considered secrets, but rules must be locked down on the backend.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Ensure we only run Firebase client code in the browser
// and fail early if required envs are missing.
function ensureClient() {
  if (typeof window === 'undefined') {
    throw new Error('Firebase is only available in the browser for this app');
  }
  if (!firebaseConfig.apiKey) {
    throw new Error('Firebase config is missing. Set env vars in .env.local');
  }
}

// Lazily initialize (or reuse) the Firebase app.
function getFirebaseApp(): FirebaseApp {
  if (app) return app;
  ensureClient();

  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }

  return app;
}

// Public helper to get the Auth instance.
export function getFirebaseAuth(): Auth {
  if (auth) return auth;
  const firebaseApp = getFirebaseApp();
  auth = getAuth(firebaseApp);
  return auth;
}

// Public helper to get the Firestore instance.
export function getFirebaseDb(): Firestore {
  if (db) return db;
  const firebaseApp = getFirebaseApp();
  db = getFirestore(firebaseApp);
  return db;
}

