import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  Auth,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  Firestore,
  Unsubscribe,
} from 'firebase/firestore';
import { AppState } from '../types/domain';
import { validateAndMigrateState } from './migrationService';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
);

let appInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;

function ensureFirebase(): {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
} | null {
  if (!isFirebaseConfigured) return null;
  try {
    if (!appInstance) {
      appInstance =
        getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
    }
    if (!authInstance) {
      authInstance = getAuth(appInstance);
    }
    if (!dbInstance) {
      dbInstance = getFirestore(appInstance);
    }
    return { app: appInstance, auth: authInstance, db: dbInstance };
  } catch {
    return null;
  }
}

/**
 * Limpia recursivamente cualquier valor `undefined` convirtiéndolo en `null`
 * para evitar errores en Firestore (`setDoc`).
 */
export function sanitizeForFirestore<T>(input: T): T {
  if (input === undefined) {
    return null as unknown as T;
  }
  if (input === null || typeof input !== 'object') {
    return input;
  }
  if (Array.isArray(input)) {
    return input.map((item) => sanitizeForFirestore(item)) as unknown as T;
  }
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    result[key] = sanitizeForFirestore(value);
  }
  return result as T;
}

export async function signInWithGoogle(): Promise<User | null> {
  const fb = ensureFirebase();
  if (!fb) return null;
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(fb.auth, provider);
  return result.user;
}

export async function signOutFromCloud(): Promise<void> {
  const fb = ensureFirebase();
  if (!fb) return;
  await firebaseSignOut(fb.auth);
}

export function onCloudAuthStateChanged(
  callback: (user: User | null) => void
): Unsubscribe {
  const fb = ensureFirebase();
  if (!fb) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(fb.auth, callback);
}

export async function fetchCloudState(
  userId: string
): Promise<AppState | null> {
  const fb = ensureFirebase();
  if (!fb || !userId) return null;

  try {
    const ref = doc(fb.db, 'ideavault_users', userId);
    const snapshot = await getDoc(ref);
    if (!snapshot.exists()) return null;
    return validateAndMigrateState(snapshot.data());
  } catch {
    return null;
  }
}

export async function saveStateToCloud(
  userId: string,
  state: AppState
): Promise<boolean> {
  const fb = ensureFirebase();
  if (!fb || !userId) return false;

  try {
    const ref = doc(fb.db, 'ideavault_users', userId);
    const sanitized = sanitizeForFirestore(state);
    await setDoc(ref, sanitized);
    return true;
  } catch {
    return false;
  }
}

export function subscribeToCloudState(
  userId: string,
  onReceiveState: (state: AppState) => void,
  onError?: () => void
): Unsubscribe {
  const fb = ensureFirebase();
  if (!fb || !userId) return () => {};

  const ref = doc(fb.db, 'ideavault_users', userId);
  return onSnapshot(
    ref,
    (snapshot) => {
      if (!snapshot.exists()) return;
      const rawData = snapshot.data();
      const validated = validateAndMigrateState(rawData);
      if (validated) {
        onReceiveState(validated);
      }
    },
    () => {
      if (onError) onError();
    }
  );
}
