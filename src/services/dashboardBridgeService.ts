import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getFirestore, doc, setDoc, type Firestore } from 'firebase/firestore';
import { Idea } from '../types/domain';

export const BRIDGE_STORAGE_KEY = 'ideavault_bridge_real_ideas_v1';
export const BRIDGE_CHANNEL_NAME = 'ideavault_dashboard_sync_v1';

const SEED_IDEA_IDS = new Set(['idea-seed-1', 'idea-seed-2', 'idea-seed-3']);

const DASHBOARD_FIREBASE_CONFIG = {
  apiKey: 'AIzaSyCLDlxqyd4DI1_Aj_wtJDACqPSpxFDLAEI',
  authDomain: 'dashboard-personal-mateo.firebaseapp.com',
  projectId: 'dashboard-personal-mateo',
  storageBucket: 'dashboard-personal-mateo.firebasestorage.app',
  messagingSenderId: '810853367735',
  appId: '1:810853367735:web:311b47ab1a70d5c1253232',
};

let dashboardApp: FirebaseApp | null = null;
let dashboardDb: Firestore | null = null;
let lastPublishedSignature = '';

function getDashboardFirestore(): Firestore | null {
  try {
    if (!dashboardApp) {
      const existing = getApps().find((a) => a.name === 'personal-dashboard-bridge');
      dashboardApp =
        existing || initializeApp(DASHBOARD_FIREBASE_CONFIG, 'personal-dashboard-bridge');
    }
    if (!dashboardDb) {
      dashboardDb = getFirestore(dashboardApp);
    }
    return dashboardDb;
  } catch {
    return null;
  }
}

export function isSeedExampleIdea(idea: Pick<Idea, 'id' | 'title'>): boolean {
  if (!idea || !idea.id) return true;
  if (SEED_IDEA_IDS.has(idea.id)) return true;
  const t = (idea.title || '').trim();
  if (
    t.startsWith('Ejemplo 1:') ||
    t.startsWith('Ejemplo 2:') ||
    t.startsWith('Ejemplo 3:')
  ) {
    return true;
  }
  return false;
}

/**
 * Publica de forma silenciosa las ideas reales creadas en el Organizador de Ideas
 * hacia el Dashboard de Tareas (vía localStorage, BroadcastChannel y Firestore).
 */
export function syncIdeasToPersonalDashboard(ideas: Idea[]): void {
  if (typeof window === 'undefined' || !Array.isArray(ideas)) return;

  const realIdeas = ideas.filter((idea) => !isSeedExampleIdea(idea));
  const signature = JSON.stringify(
    realIdeas.map((i) => ({
      id: i.id,
      u: i.updatedAt,
      s: i.stage,
      t: i.title,
      steps: i.validationSteps,
      roadmap: i.roadmap,
    }))
  );

  if (signature === lastPublishedSignature) return;
  lastPublishedSignature = signature;

  try {
    // No sobrescribir con vacío si aún estamos en estado semilla y ya habían ideas reales guardadas
    if (realIdeas.length > 0) {
      window.localStorage.setItem(BRIDGE_STORAGE_KEY, JSON.stringify(realIdeas));
    }
  } catch {
    // Ignorar errores de cuota local
  }

  try {
    if ('BroadcastChannel' in window && realIdeas.length > 0) {
      const channel = new BroadcastChannel(BRIDGE_CHANNEL_NAME);
      channel.postMessage({
        type: 'IDEAS_UPDATED',
        ideas: realIdeas,
        timestamp: new Date().toISOString(),
      });
      channel.close();
    }
  } catch {
    // Ignorar si BroadcastChannel no está disponible
  }

  if (realIdeas.length > 0) {
    const db = getDashboardFirestore();
    if (db) {
      const cleanIdeas = JSON.parse(JSON.stringify(realIdeas));
      const bridgeRef = doc(db, 'users', 'ideavault_sync_bridge', 'dashboard', 'ideas');
      setDoc(bridgeRef, {
        ideas: cleanIdeas,
        updatedAt: new Date().toISOString(),
      }).catch(() => {
        // Ignorar fallos de red en modo offline
      });
    }
  }
}
