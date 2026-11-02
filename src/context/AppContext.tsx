import React, {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useRef,
  useState,
} from 'react';
import { INITIAL_APP_STATE } from '../constants/initialData';
import { AppAction, AppState } from '../types/domain';
import { appReducer } from './appReducer';
import {
  loadStateFromStorage,
  loadUserProfileState,
  saveStateToStorage,
  saveUserProfileState,
  STORAGE_KEY,
} from '../services/storageService';
import { validateAndMigrateState } from '../services/migrationService';
import {
  fetchCloudState,
  isFirebaseConfigured,
  saveStateToCloud,
  subscribeToCloudState,
} from '../services/firebase';
import { useAuth } from './AuthContext';

export type SyncStatus = 'local' | 'syncing' | 'synced';

export const StateContext = createContext<AppState | undefined>(undefined);
export const DispatchContext = createContext<
  React.Dispatch<AppAction> | undefined
>(undefined);
export const SyncStatusContext = createContext<SyncStatus>('local');

export const AppProvider: React.FC<{
  children: React.ReactNode;
  initialState?: AppState;
}> = ({ children, initialState }) => {
  const [state, dispatch] = useReducer(
    appReducer,
    initialState ?? undefined,
    () => initialState ?? loadStateFromStorage()
  );

  const { user, isLoading: isAuthLoading } = useAuth();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('local');

  const previousUserUid = useRef<string | null>(null);
  const isHydratingUserProfile = useRef<boolean>(false);
  const isApplyingRemoteUpdate = useRef<boolean>(false);

  // 1. Transición de Sesión: Al iniciar sesión carga las ideas del perfil; al cerrar sesión limpia y deja el ejemplo de uso
  useEffect(() => {
    if (isAuthLoading) return;

    const currentUid = user?.uid ?? null;

    // Caso A: El usuario acaba de CERRAR SESIÓN -> limpiar datos privados y restaurar el ejemplo de uso
    if (previousUserUid.current && !currentUid) {
      previousUserUid.current = null;
      isHydratingUserProfile.current = false;
      const demoState: AppState = {
        ...INITIAL_APP_STATE,
        lastUpdated: new Date().toISOString(),
      };
      saveStateToStorage(demoState);
      dispatch({ type: 'HYDRATE_STATE', payload: demoState });
      setSyncStatus('local');
      return;
    }

    // Caso B: El usuario INICIÓ SESIÓN o recargó la página con su perfil abierto
    if (currentUid && previousUserUid.current !== currentUid) {
      previousUserUid.current = currentUid;
      isHydratingUserProfile.current = true;
      setSyncStatus('syncing');

      // Primero restauramos de inmediato el caché local del perfil (respuesta en 0ms)
      const localProfile = loadUserProfileState(currentUid);
      if (localProfile) {
        isApplyingRemoteUpdate.current = true;
        dispatch({ type: 'HYDRATE_STATE', payload: localProfile });
      }

      // Luego consultamos Cloud Firestore para traer sus ideas desde la nube
      let cancelled = false;
      fetchCloudState(currentUid).then((cloudState) => {
        if (cancelled) return;

        if (cloudState) {
          // Si hay tanto caché local del perfil como nube, elegimos el más reciente
          const bestState =
            localProfile && localProfile.lastUpdated > cloudState.lastUpdated
              ? localProfile
              : cloudState;

          saveUserProfileState(currentUid, bestState);
          isApplyingRemoteUpdate.current = true;
          dispatch({ type: 'HYDRATE_STATE', payload: bestState });
        } else if (localProfile) {
          // Si ya tenía ideas en su perfil local pero Firestore aún no las tenía, las subimos a la nube
          saveStateToCloud(currentUid, localProfile);
        } else {
          // Usuario nuevo que entra por primera vez: inicia su perfil con las ideas de bienvenida
          const initialProfileState: AppState = {
            ...INITIAL_APP_STATE,
            lastUpdated: new Date().toISOString(),
          };
          saveUserProfileState(currentUid, initialProfileState);
          saveStateToCloud(currentUid, initialProfileState);
          isApplyingRemoteUpdate.current = true;
          dispatch({ type: 'HYDRATE_STATE', payload: initialProfileState });
        }

        isHydratingUserProfile.current = false;
        setSyncStatus('synced');
      });

      return () => {
        cancelled = true;
      };
    }
  }, [user, isAuthLoading]);

  // 2. Persistencia automática: Si hay sesión iniciada guarda en el perfil del usuario; si no, en el almacenamiento local de ejemplo
  useEffect(() => {
    if (isAuthLoading || isHydratingUserProfile.current) return;

    if (user) {
      saveUserProfileState(user.uid, state);
      // Mantenemos el almacenamiento público limpio con el ejemplo para que nunca queden datos privados expuestos al salir
      saveStateToStorage(INITIAL_APP_STATE);
    } else {
      saveStateToStorage(state);
    }
  }, [state, user, isAuthLoading]);

  // 3. Sincronización multi-pestaña en Modo Local (sin sesión)
  useEffect(() => {
    if (user) return;
    const handleStorageEvent = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY || !event.newValue) return;
      try {
        const parsed = JSON.parse(event.newValue);
        const validated = validateAndMigrateState(parsed);
        if (validated && validated.lastUpdated !== state.lastUpdated) {
          dispatch({ type: 'HYDRATE_STATE', payload: validated });
        }
      } catch {
        // Ignorar JSON inválido externo
      }
    };

    window.addEventListener('storage', handleStorageEvent);
    return () => window.removeEventListener('storage', handleStorageEvent);
  }, [state.lastUpdated, user]);

  // 4. Suscripción Real-Time a Cloud Firestore mientras el perfil está abierto
  useEffect(() => {
    if (!isFirebaseConfigured || !user) {
      return;
    }

    const unsubscribe = subscribeToCloudState(
      user.uid,
      (remoteState) => {
        if (isHydratingUserProfile.current) return;
        if (remoteState.lastUpdated > state.lastUpdated) {
          saveUserProfileState(user.uid, remoteState);
          isApplyingRemoteUpdate.current = true;
          dispatch({ type: 'HYDRATE_STATE', payload: remoteState });
          setSyncStatus('synced');
        }
      },
      () => {
        setSyncStatus('local');
      }
    );

    return () => unsubscribe();
  }, [user, state.lastUpdated]);

  // 5. Guardado automático hacia Cloud Firestore cuando el usuario modifica o crea ideas en su perfil
  useEffect(() => {
    if (!isFirebaseConfigured || !user || isHydratingUserProfile.current) {
      return;
    }

    if (isApplyingRemoteUpdate.current) {
      isApplyingRemoteUpdate.current = false;
      return;
    }

    setSyncStatus('syncing');
    const timer = window.setTimeout(async () => {
      const ok = await saveStateToCloud(user.uid, state);
      setSyncStatus(ok ? 'synced' : 'local');
    }, 350);

    return () => window.clearTimeout(timer);
  }, [state, user]);

  return (
    <StateContext.Provider value={state}>
      <DispatchContext.Provider value={dispatch}>
        <SyncStatusContext.Provider value={syncStatus}>
          {children}
        </SyncStatusContext.Provider>
      </DispatchContext.Provider>
    </StateContext.Provider>
  );
};

export function useAppState(): AppState {
  const context = useContext(StateContext);
  if (!context) {
    throw new Error('useAppState debe usarse dentro de un AppProvider');
  }
  return context;
}

export function useAppDispatch(): React.Dispatch<AppAction> {
  const context = useContext(DispatchContext);
  if (!context) {
    throw new Error('useAppDispatch debe usarse dentro de un AppProvider');
  }
  return context;
}

export function useSyncStatus(): SyncStatus {
  return useContext(SyncStatusContext);
}
